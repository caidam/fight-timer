import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Audio context singleton
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!window._audioCtx) {
    window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window._audioCtx;
};

// Boxing ring bell synthesis — struck metal with inharmonic partials
const playBellStrike = (volume = 0.5, decay = 1.5, startTime = 0) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime + startTime;

  // Inharmonic partials — characteristic of struck metal bell
  // Ratios approximate circular plate vibration modes
  const partials = [
    { freq: 420,  gain: 1.0,  decayMul: 1.0 },
    { freq: 1130, gain: 0.55, decayMul: 0.75 },
    { freq: 2080, gain: 0.3,  decayMul: 0.5 },
    { freq: 3250, gain: 0.12, decayMul: 0.3 },
  ];

  partials.forEach(({ freq, gain: g, decayMul }) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    // Slight pitch drop at attack — struck metal characteristic
    osc.frequency.setValueAtTime(freq * 1.008, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
    const partialDecay = decay * decayMul;
    oscGain.gain.setValueAtTime(g * volume, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.05, partialDecay));
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + partialDecay + 0.02);
  });

  // Noise burst for metallic attack transient
  const bufferSize = Math.round(ctx.sampleRate * 0.025);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(volume * 0.7, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1800;
  noise.connect(hp);
  hp.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.06);
};

const sounds = {
  roundStart: () => {
    playBellStrike(0.55, 1.8);
  },
  roundEnd: () => {
    playBellStrike(0.5, 1.2, 0);
    playBellStrike(0.5, 1.2, 0.22);
    playBellStrike(0.5, 1.2, 0.44);
  },
  finalEnd: () => {
    playBellStrike(0.6, 2.0, 0);
    playBellStrike(0.6, 2.0, 0.22);
    playBellStrike(0.6, 2.0, 0.44);
  },
  intense: () => {
    playBellStrike(0.4, 0.35, 0);
    playBellStrike(0.4, 0.35, 0.14);
  },
  normal: () => {
    playBellStrike(0.25, 0.5);
  },
  warning: () => {
    playBellStrike(0.15, 0.18);
  }
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeShort = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}m`;
  if (mins === 0) return `${secs}s`;
  return `${mins}m${secs}s`;
};

const parseTimeInput = (value) => {
  if (!value) return 0;
  const str = value.toString().trim().toLowerCase();
  
  if (str.includes('s') && !str.includes(':')) {
    const num = parseInt(str.replace(/[^\d]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  
  if (str.includes(':')) {
    const parts = str.split(':');
    const mins = parseInt(parts[0]) || 0;
    const secs = parseInt(parts[1]) || 0;
    return mins * 60 + secs;
  }
  
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  
  if (str.includes('.')) {
    return Math.round(num * 60);
  }
  
  return Math.round(num * 60);
};

const parseSecondsInput = (value) => {
  if (!value) return 0;
  const str = value.toString().trim().toLowerCase();
  const num = parseInt(str.replace(/[^\d]/g, ''));
  return isNaN(num) ? 0 : num;
};

const getRandomInRange = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Timing mode calculations — scale proportionally to round duration
const TIMING_MODES = {
  chaos: {
    name: 'Chaos',
    emoji: '⚡',
    description: 'Frequent switches, short bursts. ~5 intense bursts per 3min round.',
    getTimings: (rd) => {
      const avg = rd / 10;
      return {
        intenseMin: Math.max(3, Math.round(avg * 0.4)),
        intenseMax: Math.max(5, Math.round(avg * 0.9)),
        normalMin: Math.max(4, Math.round(avg * 0.6)),
        normalMax: Math.max(7, Math.round(avg * 1.4))
      };
    }
  },
  balanced: {
    name: 'Balanced',
    emoji: '⚖️',
    description: 'Competition pace. ~3 intense bursts per 3min round.',
    getTimings: (rd) => {
      const avg = rd / 6;
      return {
        intenseMin: Math.max(5, Math.round(avg * 0.5)),
        intenseMax: Math.max(8, Math.round(avg * 0.9)),
        normalMin: Math.max(6, Math.round(avg * 0.7)),
        normalMax: Math.max(10, Math.round(avg * 1.3))
      };
    }
  },
  endurance: {
    name: 'Endurance',
    emoji: '🏔️',
    description: 'Long sustained efforts. ~2 intense bursts per 3min round.',
    getTimings: (rd) => {
      const avg = rd / 3.5;
      return {
        intenseMin: Math.max(8, Math.round(avg * 0.5)),
        intenseMax: Math.max(12, Math.round(avg * 0.9)),
        normalMin: Math.max(10, Math.round(avg * 0.7)),
        normalMax: Math.max(15, Math.round(avg * 1.3))
      };
    }
  },
  custom: {
    name: 'Custom',
    emoji: '🎛️',
    description: 'Set your own timing ranges.',
    getTimings: () => null
  }
};

const THEMES = {
  gold: {
    swatch: '#e2b714',
    dark: {
      bg: '#323437',
      surface: 'rgba(255,255,255,0.04)',
      surfaceHover: 'rgba(255,255,255,0.08)',
      border: 'rgba(255,255,255,0.06)',
      borderActive: 'rgba(226,183,20,0.4)',
      accent: '#e2b714',
      accentSolid: '#e2b714',
      text: '#d1d0c5',
      textDim: 'rgba(209,208,197,0.4)',
      inputBorder: 'rgba(226,183,20,0.2)',
      focusBorder: '#e2b714',
      focusGlow: 'rgba(226,183,20,0.15)',
      modalBg: 'linear-gradient(145deg, #3a3a3e 0%, #2a2a2e 100%)',
    },
    light: {
      bg: '#f5f2e8',
      surface: 'rgba(158,124,10,0.05)',
      surfaceHover: 'rgba(158,124,10,0.1)',
      border: 'rgba(158,124,10,0.12)',
      borderActive: 'rgba(158,124,10,0.3)',
      accent: 'rgba(158,124,10,0.6)',
      accentSolid: '#9e7c0a',
      text: '#3a3730',
      textDim: 'rgba(58,55,48,0.5)',
      inputBorder: 'rgba(158,124,10,0.2)',
      focusBorder: '#9e7c0a',
      focusGlow: 'rgba(158,124,10,0.12)',
      modalBg: 'linear-gradient(145deg, #fdfaf0 0%, #f0ece0 100%)',
    },
  },
  indigo: {
    swatch: '#7aa2f7',
    dark: {
      bg: '#1a1b26',
      surface: 'rgba(255,255,255,0.03)',
      surfaceHover: 'rgba(122,162,247,0.1)',
      border: 'rgba(255,255,255,0.06)',
      borderActive: 'rgba(122,162,247,0.4)',
      accent: '#7aa2f7',
      accentSolid: '#7aa2f7',
      text: '#c0caf5',
      textDim: 'rgba(192,202,245,0.4)',
      inputBorder: 'rgba(122,162,247,0.2)',
      focusBorder: '#7aa2f7',
      focusGlow: 'rgba(122,162,247,0.15)',
      modalBg: 'linear-gradient(145deg, #1f2035 0%, #16172a 100%)',
    },
    light: {
      bg: '#eef1f8',
      surface: 'rgba(37,99,235,0.04)',
      surfaceHover: 'rgba(37,99,235,0.08)',
      border: 'rgba(37,99,235,0.1)',
      borderActive: 'rgba(37,99,235,0.25)',
      accent: 'rgba(37,99,235,0.55)',
      accentSolid: '#2563eb',
      text: '#1e293b',
      textDim: 'rgba(30,41,59,0.45)',
      inputBorder: 'rgba(37,99,235,0.18)',
      focusBorder: '#2563eb',
      focusGlow: 'rgba(37,99,235,0.12)',
      modalBg: 'linear-gradient(145deg, #ffffff 0%, #e2e8f4 100%)',
    },
  },
  rose: {
    swatch: '#f4a0b0',
    dark: {
      bg: '#1a1215',
      surface: 'rgba(244,160,176,0.04)',
      surfaceHover: 'rgba(244,160,176,0.09)',
      border: 'rgba(244,160,176,0.08)',
      borderActive: 'rgba(244,160,176,0.3)',
      accent: '#f4a0b0',
      accentSolid: '#f4a0b0',
      text: '#ecd8dd',
      textDim: 'rgba(236,216,221,0.45)',
      inputBorder: 'rgba(244,160,176,0.18)',
      focusBorder: '#f4a0b0',
      focusGlow: 'rgba(244,160,176,0.12)',
      modalBg: 'linear-gradient(145deg, #221820 0%, #120a0e 100%)',
    },
    light: {
      bg: '#faf0f2',
      surface: 'rgba(196,96,112,0.05)',
      surfaceHover: 'rgba(196,96,112,0.09)',
      border: 'rgba(196,96,112,0.1)',
      borderActive: 'rgba(196,96,112,0.25)',
      accent: 'rgba(196,96,112,0.55)',
      accentSolid: '#c46070',
      text: '#3a2028',
      textDim: 'rgba(58,32,40,0.45)',
      inputBorder: 'rgba(196,96,112,0.18)',
      focusBorder: '#c46070',
      focusGlow: 'rgba(196,96,112,0.12)',
      modalBg: 'linear-gradient(145deg, #fff8f9 0%, #f2e4e8 100%)',
    },
  },
  mono: {
    swatch: '#999',
    dark: {
      bg: '#0e0e0e',
      surface: 'rgba(255,255,255,0.03)',
      surfaceHover: 'rgba(255,255,255,0.06)',
      border: 'rgba(255,255,255,0.06)',
      borderActive: 'rgba(255,255,255,0.15)',
      accent: 'rgba(255,255,255,0.45)',
      accentSolid: '#fff',
      text: '#fff',
      textDim: 'rgba(255,255,255,0.35)',
      inputBorder: 'rgba(255,255,255,0.12)',
      focusBorder: 'rgba(255,255,255,0.3)',
      focusGlow: 'rgba(255,255,255,0.06)',
      modalBg: 'linear-gradient(145deg, #1a1a2e 0%, #0a0a0a 100%)',
    },
    light: {
      bg: '#f5f5f0',
      surface: 'rgba(0,0,0,0.04)',
      surfaceHover: 'rgba(0,0,0,0.07)',
      border: 'rgba(0,0,0,0.08)',
      borderActive: 'rgba(0,0,0,0.2)',
      accent: 'rgba(0,0,0,0.45)',
      accentSolid: '#444',
      text: '#1a1a1a',
      textDim: 'rgba(0,0,0,0.4)',
      inputBorder: 'rgba(0,0,0,0.15)',
      focusBorder: 'rgba(0,0,0,0.35)',
      focusGlow: 'rgba(0,0,0,0.08)',
      modalBg: 'linear-gradient(145deg, #ffffff 0%, #eaeae4 100%)',
    },
  },
};

// Compact readable URL encoding
// Format: name/ROUNDSxDURATION/REST/MODE[+flags][/iMIN-MAX/nMIN-MAX]
// Multiple presets: preset1|preset2  (active preset first)
const encodePresetCompact = (preset) => {
  const name = preset.name.replace(/[|/+]/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'Preset';
  const dur = formatTimeShort(preset.roundDuration);
  const rest = formatTimeShort(preset.restDuration);
  let s = `${name}/${preset.rounds}x${dur}/${rest}/${preset.timingMode}`;
  const flags = [];
  if (preset.progressiveIntensity) flags.push('prog');
  if (preset.hideNextSwitch) flags.push('hide');
  if (flags.length) s += '+' + flags.join('+');
  if (preset.timingMode === 'custom') {
    s += `/i${preset.intenseMin}-${preset.intenseMax}/n${preset.normalMin}-${preset.normalMax}`;
  }
  return s;
};

const parseUrlDuration = (str) => {
  if (!str) return 0;
  const m = str.match(/^(\d+)m(\d+)?s?$/);
  if (m) return parseInt(m[1]) * 60 + (parseInt(m[2]) || 0);
  const sec = str.match(/^(\d+)s$/);
  if (sec) return parseInt(sec[1]);
  return parseInt(str) || 0;
};

const decodePresetCompact = (str) => {
  const parts = str.split('/');
  if (parts.length < 4) return null;
  const name = parts[0].replace(/-/g, ' ').trim();
  const rm = parts[1].match(/^(\d+)x(.+)$/);
  if (!rm) return null;
  const rounds = parseInt(rm[1]);
  const roundDuration = parseUrlDuration(rm[2]);
  const restDuration = parseUrlDuration(parts[2]);
  if (!roundDuration) return null;
  const mf = parts[3].split('+');
  const timingMode = mf[0];
  if (!TIMING_MODES[timingMode]) return null;
  const preset = createDefaultPreset(name || 'Preset');
  preset.rounds = rounds;
  preset.roundDuration = roundDuration;
  preset.restDuration = restDuration;
  preset.timingMode = timingMode;
  preset.progressiveIntensity = mf.includes('prog');
  preset.hideNextSwitch = mf.includes('hide');
  if (timingMode === 'custom') {
    for (const p of parts.slice(4)) {
      const im = p.match(/^i(\d+)-(\d+)$/);
      if (im) { preset.intenseMin = parseInt(im[1]); preset.intenseMax = parseInt(im[2]); }
      const nm = p.match(/^n(\d+)-(\d+)$/);
      if (nm) { preset.normalMin = parseInt(nm[1]); preset.normalMax = parseInt(nm[2]); }
    }
  }
  return preset;
};

const encodeStateCompact = (presets, activePresetId) => {
  const active = presets.find(p => p.id === activePresetId);
  const rest = presets.filter(p => p.id !== activePresetId);
  return [active, ...rest].filter(Boolean).map(encodePresetCompact).join('|');
};

const decodeStateCompact = (hash) => {
  if (!hash) return null;
  // Split off theme suffix: presets@themeId.mode
  let presetsPart = hash;
  let themeInfo = null;
  const atIdx = hash.lastIndexOf('@');
  if (atIdx !== -1) {
    const suffix = hash.slice(atIdx + 1);
    const dot = suffix.indexOf('.');
    if (dot !== -1) {
      const tid = suffix.slice(0, dot);
      const tmode = suffix.slice(dot + 1);
      if (THEMES[tid] && (tmode === 'dark' || tmode === 'light')) {
        themeInfo = { themeId: tid, themeMode: tmode };
        presetsPart = hash.slice(0, atIdx);
      }
    }
  }
  // Try compact format (contains '/' separators)
  if (presetsPart.includes('/')) {
    const presets = presetsPart.split('|').map(decodePresetCompact).filter(Boolean);
    if (presets.length > 0) return { presets, activePresetId: presets[0].id, ...themeInfo && { themeInfo } };
  }
  // Fall back to legacy base64 format
  try {
    const padded = presetsPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(padded)));
    const result = JSON.parse(json);
    if (themeInfo) result.themeInfo = themeInfo;
    return result;
  } catch {
    return null;
  }
};

const createDefaultPreset = (name = 'Preset 1') => ({
  id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
  name,
  rounds: 3,
  roundDuration: 180,
  restDuration: 60,
  timingMode: 'balanced',
  intenseMin: 15,
  intenseMax: 25,
  normalMin: 20,
  normalMax: 35,
  progressiveIntensity: false,
  hideNextSwitch: false
});

const applyTimingMode = (preset) => {
  if (preset.timingMode === 'custom') return preset;
  const mode = TIMING_MODES[preset.timingMode];
  if (!mode) return preset;
  const timings = mode.getTimings(preset.roundDuration);
  if (!timings) return preset;
  return { ...preset, ...timings };
};

// Calculate progressive adjustments for a given round
const getProgressiveTimings = (config, currentRound) => {
  if (!config.progressiveIntensity) {
    return {
      intenseMin: config.intenseMin,
      intenseMax: config.intenseMax,
      normalMin: config.normalMin,
      normalMax: config.normalMax
    };
  }
  
  // Each round: intense +12%, normal -12%
  const roundFactor = (currentRound - 1) * 0.12;
  
  return {
    intenseMin: Math.round(config.intenseMin * (1 + roundFactor)),
    intenseMax: Math.round(config.intenseMax * (1 + roundFactor)),
    normalMin: Math.max(5, Math.round(config.normalMin * (1 - roundFactor))),
    normalMax: Math.max(8, Math.round(config.normalMax * (1 - roundFactor)))
  };
};

// Time input component
const TimeInput = ({ value, onChange, label, isSeconds = false, placeholder, disabled = false, theme }) => {
  const [inputValue, setInputValue] = useState('');
  
  useEffect(() => {
    if (isSeconds) {
      setInputValue(value.toString());
    } else {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      if (secs === 0) {
        setInputValue(mins.toString());
      } else {
        setInputValue(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }
  }, [value, isSeconds]);
  
  const handleBlur = () => {
    const parsed = isSeconds ? parseSecondsInput(inputValue) : parseTimeInput(inputValue);
    onChange(parsed);
  };
  
  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '11px',
        color: theme ? theme.textDim : 'rgba(255,255,255,0.35)',
        fontFamily: "'Oswald', sans-serif",
        letterSpacing: '1.5px'
      }}>
        {label}
      </label>
      <input
        type="text"
        inputMode={isSeconds ? "numeric" : "text"}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          background: disabled ? 'transparent' : (theme ? theme.surface : 'rgba(255,255,255,0.05)'),
          border: `1.5px solid ${disabled ? (theme ? theme.border : 'rgba(255,255,255,0.06)') : (theme ? theme.inputBorder : 'rgba(255,255,255,0.12)')}`,
          color: disabled ? (theme ? theme.textDim : 'rgba(255,255,255,0.4)') : (theme ? theme.text : '#fff'),
          padding: '14px 16px',
          fontSize: '22px',
          fontFamily: "'Oswald', sans-serif",
          width: '100%',
          borderRadius: '10px',
          textAlign: 'center',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'text'
        }}
      />
    </div>
  );
};

// Help Modal
const HelpModal = ({ onClose, theme }) => {
  const t = theme || THEMES.mono.dark;
  return (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    overflowY: 'auto'
  }} onClick={onClose}>
    <div style={{
      background: t.modalBg,
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '85vh',
      overflowY: 'auto',
      border: `1px solid ${t.border}`
    }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', letterSpacing: '2px', color: t.accentSolid }}>HOW IT WORKS</h2>
        <button onClick={onClose} style={{
          background: 'none',
          border: 'none',
          color: t.textDim,
          fontSize: '28px',
          cursor: 'pointer',
          padding: '4px 8px'
        }}>×</button>
      </div>

      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '14px', lineHeight: '1.5', color: t.text }}>
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ color: t.accentSolid, fontSize: '16px', margin: '0 0 10px 0', letterSpacing: '1px' }}>CONCEPT</h3>
          <p style={{ margin: 0 }}>
            Randomly alternates between <span style={{ color: '#ff3200' }}>INTENSE</span> and <span style={{ color: '#32c864' }}>NORMAL</span> periods within each round. Simulates the unpredictable rhythm of a real fight.
          </p>
        </section>

        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ color: t.accentSolid, fontSize: '16px', margin: '0 0 10px 0', letterSpacing: '1px' }}>TIMING MODES</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ background: t.surface, borderRadius: '6px', padding: '10px' }}>
              <strong>⚡ Chaos</strong> — 8-12 switches/round. Street fight feel.
            </div>
            <div style={{ background: t.surface, borderRadius: '6px', padding: '10px' }}>
              <strong>⚖️ Balanced</strong> — 5-7 switches/round. Competition pace.
            </div>
            <div style={{ background: t.surface, borderRadius: '6px', padding: '10px' }}>
              <strong>🏔️ Endurance</strong> — 3-4 switches/round. Sustained pressure.
            </div>
            <div style={{ background: t.surface, borderRadius: '6px', padding: '10px' }}>
              <strong>🎛️ Custom</strong> — Set your own min/max ranges.
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ color: t.accentSolid, fontSize: '16px', margin: '0 0 10px 0', letterSpacing: '1px' }}>OPTIONS</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <strong style={{ color: t.accentSolid }}>Progressive Intensity</strong><br/>
              <span style={{ color: t.textDim }}>Each round gets harder: intense periods grow +12%/round, recovery shrinks -12%/round. Simulates late-fight fatigue.</span>
            </div>
            <div>
              <strong style={{ color: t.textDim }}>Hide Countdown</strong><br/>
              <span style={{ color: t.textDim }}>Start with countdown hidden. Can toggle during training.</span>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ color: t.accentSolid, fontSize: '16px', margin: '0 0 10px 0', letterSpacing: '1px' }}>AUDIO CUES</h3>
          <div style={{ color: t.textDim }}>
            <div>🔴 Double bell tap → INTENSE</div>
            <div>🟢 Single bell tap → NORMAL</div>
          </div>
        </section>

        <section>
          <h3 style={{ color: t.accentSolid, fontSize: '16px', margin: '0 0 10px 0', letterSpacing: '1px' }}>PRESETS & SHARING</h3>
          <p style={{ margin: 0, color: t.textDim }}>
            Create multiple presets, all saved in the URL. Use SHARE to send via WhatsApp/Messages or COPY URL to bookmark.
          </p>
        </section>
      </div>
    </div>
  </div>
  );
};

// Preset Manager Component
const PresetManager = ({ presets, activePresetId, onSelect, onAdd, onDelete, onRename, theme }) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const t = theme || THEMES.mono.dark;

  const startEdit = (preset) => {
    setEditingId(preset.id);
    setEditName(preset.name);
  };

  const saveEdit = () => {
    if (editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px'
      }}>
        <h3 style={{
          margin: 0,
          color: t.accent,
          fontSize: '13px',
          letterSpacing: '2px',
          fontWeight: 400
        }}>PRESETS</h3>
        <button onClick={onAdd} style={{
          background: t.surfaceHover,
          border: `1px solid ${t.border}`,
          borderRadius: '8px',
          color: t.textDim,
          padding: '6px 14px',
          fontSize: '13px',
          fontFamily: "'Oswald', sans-serif",
          cursor: 'pointer',
          letterSpacing: '1px'
        }}>+ ADD</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {presets.map(preset => (
          <div key={preset.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            background: activePresetId === preset.id ? t.surfaceHover : 'transparent',
            border: `1px solid ${activePresetId === preset.id ? t.borderActive : t.border}`,
            borderRadius: '10px',
            cursor: 'pointer'
          }} onClick={() => onSelect(preset.id)}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: `2px solid ${activePresetId === preset.id ? t.accentSolid : t.inputBorder}`,
              background: activePresetId === preset.id ? t.accentSolid : 'transparent',
              flexShrink: 0
            }} />

            {editingId === preset.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${t.focusBorder}`,
                  borderRadius: '4px',
                  color: t.text,
                  padding: '4px 8px',
                  fontSize: '15px',
                  fontFamily: "'Oswald', sans-serif"
                }}
              />
            ) : (
              <span style={{
                flex: 1,
                fontFamily: "'Oswald', sans-serif",
                fontSize: '15px',
                color: activePresetId === preset.id ? t.text : t.textDim
              }}>
                {preset.name}
              </span>
            )}

            <span style={{
              fontSize: '12px',
              color: t.textDim,
              fontFamily: "'Oswald', sans-serif"
            }}>
              {preset.rounds}×{formatTimeShort(preset.roundDuration)}
            </span>

            <button onClick={(e) => { e.stopPropagation(); startEdit(preset); }} style={{
              background: 'none',
              border: 'none',
              color: t.textDim,
              cursor: 'pointer',
              padding: '4px',
              fontSize: '14px'
            }}>✎</button>

            {presets.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(preset.id); }} style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,100,100,0.6)',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '14px'
              }}>✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Option toggle component
const OptionToggle = ({ checked, onChange, label, description, theme }) => {
  const t = theme || THEMES.mono.dark;
  return (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
    padding: '10px 0'
  }} onClick={onChange}>
    <div style={{
      width: '22px',
      height: '22px',
      borderRadius: '7px',
      border: `1.5px solid ${checked ? t.accentSolid : t.border}`,
      background: checked ? t.inputBorder : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      flexShrink: 0,
      marginTop: '2px'
    }}>
      {checked && <span style={{ fontSize: '13px', color: t.accentSolid }}>✓</span>}
    </div>
    <div>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '15px', color: t.text }}>{label}</div>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '12px', color: t.textDim, marginTop: '3px' }}>{description}</div>
    </div>
  </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState('config');
  const [presets, setPresets] = useState([createDefaultPreset('Muay Thai 3x3')]);
  const [activePresetId, setActivePresetId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [hideSwitchLive, setHideSwitchLive] = useState(false);
  const [themeId, setThemeId] = useState(() => {
    const stored = localStorage.getItem('fight-timer-theme');
    return (stored && THEMES[stored]) ? stored : 'gold';
  });
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('fight-timer-mode') || 'dark');
  const theme = THEMES[themeId][themeMode];
  
  const [timerState, setTimerState] = useState({
    currentRound: 1,
    timeRemaining: 0,
    isResting: false,
    isRunning: false,
    intensity: 'normal', // 'normal', 'intense', 'rest'
    nextSwitch: 0,
    switchTarget: 0,
    warningPlayed: false,
    totalIntenseTime: 0,
    totalNormalTime: 0
  });

  const intervalRef = useRef(null);
  const timerStateRef = useRef(timerState);
  timerStateRef.current = timerState;
  const containerRef = useRef(null);

  // Get active preset (memoized to prevent timer effect restarts)
  const activePreset = presets.find(p => p.id === activePresetId) || presets[0];
  const config = useMemo(() => applyTimingMode(activePreset), [presets, activePresetId]);

  // Load state from URL on mount (supports new compact and legacy base64 formats)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decoded = decodeStateCompact(hash);
      if (decoded && decoded.presets && decoded.presets.length > 0) {
        setPresets(decoded.presets);
        setActivePresetId(decoded.activePresetId || decoded.presets[0].id);
        if (decoded.themeInfo) {
          setThemeId(decoded.themeInfo.themeId);
          setThemeMode(decoded.themeInfo.themeMode);
          localStorage.setItem('fight-timer-theme', decoded.themeInfo.themeId);
          localStorage.setItem('fight-timer-mode', decoded.themeInfo.themeMode);
        }
        return;
      }
    }
    setActivePresetId(presets[0].id);
  }, []);

  // Update URL when presets or theme change
  useEffect(() => {
    if (activePresetId) {
      const encoded = encodeStateCompact(presets, activePresetId);
      window.history.replaceState(null, '', `#${encoded}@${themeId}.${themeMode}`);
    }
  }, [presets, activePresetId, themeId, themeMode]);

  // Update preset
  const updateActivePreset = (updates) => {
    setPresets(prev => prev.map(p => 
      p.id === activePresetId ? { ...p, ...updates } : p
    ));
  };

  // Update timing mode
  const setTimingMode = (mode) => {
    const modeConfig = TIMING_MODES[mode];
    if (mode === 'custom') {
      updateActivePreset({ timingMode: mode });
    } else {
      const timings = modeConfig.getTimings(activePreset.roundDuration);
      updateActivePreset({ timingMode: mode, ...timings });
    }
  };

  // When round duration changes
  const setRoundDuration = (duration) => {
    if (activePreset.timingMode !== 'custom') {
      const timings = TIMING_MODES[activePreset.timingMode].getTimings(duration);
      updateActivePreset({ roundDuration: duration, ...timings });
    } else {
      updateActivePreset({ roundDuration: duration });
    }
  };

  // Preset management
  const addPreset = () => {
    const newPreset = createDefaultPreset(`Preset ${presets.length + 1}`);
    setPresets(prev => [...prev, newPreset]);
    setActivePresetId(newPreset.id);
  };

  const deletePreset = (id) => {
    if (presets.length <= 1) return;
    setPresets(prev => prev.filter(p => p.id !== id));
    if (activePresetId === id) {
      setActivePresetId(presets.find(p => p.id !== id)?.id);
    }
  };

  const renamePreset = (id, name) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  // Wake lock
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        lock.addEventListener('release', () => setWakeLock(null));
      } catch (err) {
        console.log('Wake lock failed:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }
  };

  // Fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen?.() || 
              containerRef.current?.webkitRequestFullscreen?.();
        setIsFullscreen(true);
      } catch (err) {
        console.log('Fullscreen failed:', err);
      }
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Theme
  const changeTheme = (id) => {
    setThemeId(id);
    localStorage.setItem('fight-timer-theme', id);
  };

  const toggleMode = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    localStorage.setItem('fight-timer-mode', next);
  };

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.bg;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.bg);
  }, [theme]);

  // Share URL - native share on mobile, copy on desktop
  const shareConfig = async () => {
    const url = window.location.href;
    const shareData = {
      title: 'Fight Timer',
      text: `Check out my Muay Thai training preset: ${activePreset.name}`,
      url: url
    };
    
    // Try native share first (works on mobile)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or error - fall through to copy
        if (err.name === 'AbortError') return;
      }
    }
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      prompt('Copy this URL to save your presets:', url);
    }
  };

  // Copy URL only
  const copyUrl = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      prompt('Copy this URL:', url);
    }
  };

  // Returns how long the given intensity period should last
  const calculatePeriodDuration = useCallback((intensity, currentRound) => {
    const timings = getProgressiveTimings(config, currentRound);
    if (intensity === 'intense') {
      return getRandomInRange(timings.intenseMin, timings.intenseMax);
    }
    return getRandomInRange(timings.normalMin, timings.normalMax);
  }, [config]);

  const startTraining = async () => {
    const audioContext = getAudioContext();
    if (audioContext?.state === 'suspended') {
      await audioContext.resume();
    }
    
    await requestWakeLock();
    
    const initialDuration = calculatePeriodDuration('normal', 1);

    setTimerState({
      currentRound: 1,
      timeRemaining: config.roundDuration,
      isResting: false,
      isRunning: true,
      intensity: 'normal',
      nextSwitch: initialDuration,
      switchTarget: Math.max(1, config.roundDuration - initialDuration),
      warningPlayed: false,
      totalIntenseTime: 0,
      totalNormalTime: 0
    });
    setScreen('training');
    setHideSwitchLive(config.hideNextSwitch);
    
    setTimeout(() => sounds.roundStart(), 100);
  };

  const togglePause = () => {
    setTimerState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const stopTraining = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    releaseWakeLock();
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
    setScreen('config');
  };

  // Timer tick — reads from timerStateRef to avoid StrictMode double-invoke issues
  // with mutable refs inside setState updaters
  useEffect(() => {
    if (!timerState.isRunning || screen !== 'training') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const prev = timerStateRef.current;

      if (prev.timeRemaining <= 1) {
        // Round/rest ended
        if (prev.isResting) {
          if (prev.currentRound >= config.rounds) {
            sounds.finalEnd();
            releaseWakeLock();
            setTimeout(() => setScreen('summary'), 500);
            setTimerState({ ...prev, isRunning: false, timeRemaining: 0 });
            return;
          }

          const newDuration = calculatePeriodDuration('normal', prev.currentRound + 1);
          sounds.roundStart();
          setTimerState({
            ...prev,
            currentRound: prev.currentRound + 1,
            timeRemaining: config.roundDuration,
            isResting: false,
            intensity: 'normal',
            nextSwitch: newDuration,
            switchTarget: Math.max(1, config.roundDuration - newDuration),
            warningPlayed: false
          });
          return;
        } else {
          sounds.roundEnd();

          if (prev.currentRound >= config.rounds) {
            releaseWakeLock();
            setTimeout(() => setScreen('summary'), 500);
            setTimerState({ ...prev, isRunning: false, timeRemaining: 0, isResting: false });
            return;
          }

          setTimerState({
            ...prev,
            timeRemaining: config.restDuration,
            isResting: true,
            intensity: 'rest',
            warningPlayed: false
          });
          return;
        }
      }

      const newTime = prev.timeRemaining - 1;
      let newState = { ...prev, timeRemaining: newTime };

      if (!prev.isResting) {
        // Switch intensity
        if (newTime <= prev.switchTarget && prev.switchTarget > 0) {
          const newIntensity = prev.intensity === 'intense' ? 'normal' : 'intense';
          const nextDuration = calculatePeriodDuration(newIntensity, prev.currentRound);
          sounds[newIntensity === 'intense' ? 'intense' : 'normal']();

          newState.intensity = newIntensity;
          newState.nextSwitch = nextDuration;
          newState.switchTarget = Math.max(1, newTime - nextDuration);
          newState.warningPlayed = false;
        }

        // Track time
        if (newState.intensity === 'intense') {
          newState.totalIntenseTime = prev.totalIntenseTime + 1;
        } else if (newState.intensity === 'normal') {
          newState.totalNormalTime = prev.totalNormalTime + 1;
        }
      }

      setTimerState(newState);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState.isRunning, screen, config, calculatePeriodDuration]);

  const globalStyles = useMemo(() => `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;700&display=swap');
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body {
      touch-action: manipulation;
      -webkit-user-select: none;
      user-select: none;
      overscroll-behavior: none;
    }
    input { -webkit-user-select: text; user-select: text; }
    input:focus {
      outline: none;
      border-color: ${theme.focusBorder} !important;
      box-shadow: 0 0 0 3px ${theme.focusGlow};
    }
  `, [theme]);

  // CONFIG SCREEN
  if (screen === 'config') {
    return (
      <div ref={containerRef} style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        background: theme.bg,
        color: theme.text,
        fontFamily: "'Bebas Neue', 'Impact', sans-serif",
        padding: '24px',
        paddingBottom: '48px',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <style>{globalStyles}</style>

        {showHelp && <HelpModal onClose={() => setShowHelp(false)} theme={theme} />}

        {shareToast && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: theme.accentSolid,
            color: theme.bg,
            padding: '12px 24px',
            borderRadius: '12px',
            fontFamily: "'Oswald', sans-serif",
            fontSize: '15px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}>
            ✓ URL copied to clipboard
          </div>
        )}

        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(32px, 9vw, 48px)',
                margin: '0',
                color: theme.text,
                letterSpacing: '4px',
                fontWeight: 400
              }}>FIGHT TIMER</h1>
              <p style={{
                color: theme.textDim,
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px',
                letterSpacing: '3px',
                margin: '6px 0 0 0'
              }}>RANDOM INTENSITY TRAINING</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Theme picker */}
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                {Object.entries(THEMES).map(([id, { swatch }]) => (
                  <button
                    key={id}
                    onClick={() => changeTheme(id)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: swatch,
                      border: '1.5px solid rgba(128,128,128,0.25)',
                      cursor: 'pointer',
                      padding: 0,
                      opacity: themeId === id ? 1 : 0.45,
                      boxShadow: themeId === id
                        ? `0 0 0 2px ${theme.bg}, 0 0 0 3.5px ${swatch}`
                        : 'none'
                    }}
                  />
                ))}
              </div>
              {/* Light/dark toggle */}
              <button onClick={toggleMode} style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                color: theme.textDim,
                fontSize: '16px',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>{themeMode === 'dark' ? '☀' : '☾'}</button>
              <button onClick={() => setShowHelp(true)} style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                color: theme.textDim,
                fontSize: '18px',
                cursor: 'pointer',
                fontFamily: "'Oswald', sans-serif"
              }}>?</button>
            </div>
          </div>

          {/* Preset Manager */}
          <PresetManager
            presets={presets}
            activePresetId={activePresetId}
            onSelect={setActivePresetId}
            onAdd={addPreset}
            onDelete={deletePreset}
            onRename={renamePreset}
            theme={theme}
          />

          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Rounds */}
            <div style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: theme.accent, fontSize: '13px', letterSpacing: '2px', fontWeight: 400 }}>SESSION</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', color: theme.textDim, fontFamily: "'Oswald', sans-serif", letterSpacing: '1.5px' }}>ROUNDS</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={activePreset.rounds}
                    onChange={e => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      if (val === '') updateActivePreset({ rounds: '' });
                      else updateActivePreset({ rounds: val });
                    }}
                    onBlur={e => {
                      const parsed = parseInt(e.target.value);
                      const clamped = isNaN(parsed) || parsed < 1 ? 1 : Math.min(parsed, 50);
                      updateActivePreset({ rounds: clamped });
                    }}
                    onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                    placeholder="e.g. 3"
                    style={{
                      background: theme.surface,
                      border: `1.5px solid ${theme.inputBorder}`,
                      color: theme.text,
                      padding: '14px 8px',
                      fontSize: '22px',
                      fontFamily: "'Oswald', sans-serif",
                      width: '100%',
                      borderRadius: '10px',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <TimeInput
                  value={activePreset.roundDuration}
                  onChange={setRoundDuration}
                  label="DURATION"
                  placeholder="3:00"
                  theme={theme}
                />
                <TimeInput
                  value={activePreset.restDuration}
                  onChange={(v) => updateActivePreset({ restDuration: v })}
                  label="REST"
                  placeholder="1:00"
                  theme={theme}
                />
              </div>
            </div>

            {/* Timing Mode */}
            <div style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: theme.accent, fontSize: '13px', letterSpacing: '2px', fontWeight: 400 }}>TIMING MODE</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {Object.entries(TIMING_MODES).map(([key, mode]) => (
                  <button
                    key={key}
                    onClick={() => setTimingMode(key)}
                    style={{
                      padding: '14px',
                      background: activePreset.timingMode === key ? theme.surfaceHover : 'transparent',
                      border: `1.5px solid ${activePreset.timingMode === key ? theme.borderActive : theme.border}`,
                      borderRadius: '10px',
                      color: activePreset.timingMode === key ? theme.text : theme.textDim,
                      cursor: 'pointer',
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: '15px',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '18px', marginRight: '8px' }}>{mode.emoji}</span>
                    {mode.name}
                  </button>
                ))}
              </div>

              <p style={{ margin: '14px 0 0 0', fontSize: '13px', color: theme.textDim, fontFamily: "'Oswald', sans-serif", lineHeight: '1.5' }}>
                {TIMING_MODES[activePreset.timingMode].description}
              </p>
            </div>

            {/* Timing Ranges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px'
            }}>
              <div style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                padding: '18px',
                opacity: activePreset.timingMode === 'custom' ? 1 : 0.5
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: theme.accent, fontSize: '12px', letterSpacing: '1px', fontWeight: 400 }}>
                  INTENSE (sec)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <TimeInput
                    value={config.intenseMin}
                    onChange={(v) => updateActivePreset({ intenseMin: v, timingMode: 'custom' })}
                    label="MIN"
                    isSeconds
                    disabled={activePreset.timingMode !== 'custom'}
                    theme={theme}
                  />
                  <TimeInput
                    value={config.intenseMax}
                    onChange={(v) => updateActivePreset({ intenseMax: v, timingMode: 'custom' })}
                    label="MAX"
                    isSeconds
                    disabled={activePreset.timingMode !== 'custom'}
                    theme={theme}
                  />
                </div>
              </div>

              <div style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                padding: '18px',
                opacity: activePreset.timingMode === 'custom' ? 1 : 0.5
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: theme.accent, fontSize: '12px', letterSpacing: '1px', fontWeight: 400 }}>
                  NORMAL (sec)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <TimeInput
                    value={config.normalMin}
                    onChange={(v) => updateActivePreset({ normalMin: v, timingMode: 'custom' })}
                    label="MIN"
                    isSeconds
                    disabled={activePreset.timingMode !== 'custom'}
                    theme={theme}
                  />
                  <TimeInput
                    value={config.normalMax}
                    onChange={(v) => updateActivePreset({ normalMax: v, timingMode: 'custom' })}
                    label="MAX"
                    isSeconds
                    disabled={activePreset.timingMode !== 'custom'}
                    theme={theme}
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: theme.accent, fontSize: '13px', letterSpacing: '2px', fontWeight: 400 }}>OPTIONS</h3>

              <div style={{ display: 'grid', gap: '4px' }}>
                <OptionToggle
                  checked={activePreset.progressiveIntensity}
                  onChange={() => updateActivePreset({ progressiveIntensity: !activePreset.progressiveIntensity })}
                  label="Progressive Intensity"
                  description="Each round: intense +12%, recovery -12%"
                  theme={theme}
                />
                <OptionToggle
                  checked={activePreset.hideNextSwitch}
                  onChange={() => updateActivePreset({ hideNextSwitch: !activePreset.hideNextSwitch })}
                  label="Hide Countdown"
                  description="Start hidden, can toggle live during training"
                  theme={theme}
                />
              </div>
            </div>

            {/* Share */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <button onClick={shareConfig} style={{
                padding: '14px',
                fontSize: '14px',
                fontFamily: "'Oswald', sans-serif",
                letterSpacing: '1px',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                color: theme.textDim,
                cursor: 'pointer'
              }}>
                SHARE
              </button>
              <button onClick={copyUrl} style={{
                padding: '14px',
                fontSize: '14px',
                fontFamily: "'Oswald', sans-serif",
                letterSpacing: '1px',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                color: theme.textDim,
                cursor: 'pointer'
              }}>
                COPY URL
              </button>
            </div>
          </div>

          {/* Start Button */}
          <button onClick={startTraining} style={{
            width: '100%',
            marginTop: '24px',
            padding: '20px',
            fontSize: '24px',
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '6px',
            background: theme.accentSolid,
            border: 'none',
            borderRadius: '14px',
            color: theme.bg,
            cursor: 'pointer',
            boxShadow: `0 4px 24px ${theme.focusGlow}`
          }}>
            START TRAINING
          </button>

          <p style={{
            textAlign: 'center',
            marginTop: '14px',
            fontSize: '13px',
            color: theme.textDim,
            fontFamily: "'Oswald', sans-serif"
          }}>
            {activePreset.name}: {config.rounds}×{formatTimeShort(config.roundDuration)}, {formatTimeShort(config.restDuration)} rest
          </p>
        </div>
      </div>
    );
  }

  // SUMMARY SCREEN
  if (screen === 'summary') {
    const totalActive = timerState.totalIntenseTime + timerState.totalNormalTime;
    const intensePercent = totalActive > 0 ? Math.round((timerState.totalIntenseTime / totalActive) * 100) : 0;
    const normalPercent = 100 - intensePercent;
    
    return (
      <div ref={containerRef} style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        background: theme.bg,
        color: theme.text,
        fontFamily: "'Bebas Neue', 'Impact', sans-serif",
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <style>{globalStyles}</style>

        <h1 style={{
          fontSize: 'clamp(48px, 12vw, 64px)',
          margin: '0 0 32px 0',
          color: theme.text,
          letterSpacing: '4px'
        }}>COMPLETE!</h1>

        <div style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '18px',
          padding: '28px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '360px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '18px', color: theme.textDim, fontFamily: "'Oswald', sans-serif", letterSpacing: '2px' }}>TOTAL ACTIVE TIME</div>
            <div style={{ fontSize: '48px', color: theme.text }}>{formatTime(totalActive)}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#ff3200', fontFamily: "'Oswald', sans-serif" }}>INTENSE</div>
              <div style={{ fontSize: '24px' }}>{formatTime(timerState.totalIntenseTime)}</div>
              <div style={{ fontSize: '18px', color: theme.textDim }}>{intensePercent}%</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#32c864', fontFamily: "'Oswald', sans-serif" }}>NORMAL</div>
              <div style={{ fontSize: '24px' }}>{formatTime(timerState.totalNormalTime)}</div>
              <div style={{ fontSize: '18px', color: theme.textDim }}>{normalPercent}%</div>
            </div>
          </div>

          {/* Bar */}
          <div style={{
            height: '10px',
            background: theme.surfaceHover,
            borderRadius: '5px',
            overflow: 'hidden',
            display: 'flex'
          }}>
            <div style={{ height: '100%', width: `${intensePercent}%`, background: '#ff3200' }} />
            <div style={{ height: '100%', width: `${normalPercent}%`, background: '#32c864' }} />
          </div>
        </div>

        <button onClick={() => setScreen('config')} style={{
          marginTop: '28px',
          padding: '18px 44px',
          fontSize: '24px',
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: '4px',
          background: theme.accentSolid,
          border: 'none',
          borderRadius: '12px',
          color: theme.bg,
          cursor: 'pointer',
          boxShadow: `0 4px 24px ${theme.focusGlow}`
        }}>
          TRAIN AGAIN
        </button>
      </div>
    );
  }

  // TRAINING SCREEN
  const intensityColors = {
    intense: {
      bg: 'radial-gradient(circle at 50% 30%, #ff3200 0%, #8b0000 50%, #1a0000 100%)',
      glow: 'rgba(255,50,0,0.6)'
    },
    normal: {
      bg: 'radial-gradient(circle at 50% 30%, #32c864 0%, #1a6432 50%, #001a0a 100%)',
      glow: 'rgba(50,200,100,0.4)'
    },
    rest: {
      bg: 'radial-gradient(circle at 50% 30%, #3264c8 0%, #1a3264 50%, #000a1a 100%)',
      glow: 'rgba(50,100,200,0.4)'
    }
  };

  const intensityLabels = {
    intense: 'INTENSE',
    normal: 'NORMAL',
    rest: 'REST'
  };

  const currentColors = intensityColors[timerState.intensity] || intensityColors.normal;
  const switchIn = Math.max(0, timerState.timeRemaining - timerState.switchTarget);

  return (
    <div ref={containerRef} style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      background: currentColors.bg,
      color: '#fff',
      fontFamily: "'Bebas Neue', 'Impact', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      transition: 'background 0.3s ease',
      position: 'relative'
    }}>
      <style>{`
        ${globalStyles}
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes intensePulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
      `}</style>
      
      {/* Top bar */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontFamily: "'Oswald', sans-serif",
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '2px'
          }}>ROUND</div>
          <div style={{ fontSize: '40px', letterSpacing: '2px' }}>
            {timerState.currentRound}/{config.rounds}
          </div>
        </div>
        
        <button onClick={toggleFullscreen} style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer'
        }}>
          {isFullscreen ? '⊙' : '⛶'}
        </button>
      </div>

      {wakeLock && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          fontFamily: "'Oswald', sans-serif",
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '1px'
        }}>
          🔒 SCREEN ON
        </div>
      )}

      <div style={{
        fontSize: 'clamp(26px, 8vw, 48px)',
        letterSpacing: '5px',
        marginBottom: '12px',
        textTransform: 'uppercase',
        animation: timerState.intensity === 'intense' 
          ? 'intensePulse 0.5s ease infinite' 
          : 'none'
      }}>
        {intensityLabels[timerState.intensity]}
      </div>

      <div style={{
        fontSize: 'clamp(90px, 28vw, 170px)',
        fontWeight: '700',
        textShadow: `0 0 60px ${currentColors.glow}, 0 0 120px ${currentColors.glow}`,
        animation: timerState.isRunning ? 'pulse 1s ease infinite' : 'none',
        lineHeight: '1'
      }}>
        {formatTime(timerState.timeRemaining)}
      </div>

      {!timerState.isResting && !hideSwitchLive && (
        <div style={{
          marginTop: '14px',
          fontSize: '15px',
          fontFamily: "'Oswald', sans-serif",
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '2px'
        }}>
          SWITCH IN ~{switchIn}s
        </div>
      )}

      {/* Toggle switch visibility button */}
      {!timerState.isResting && (
        <button 
          onClick={() => setHideSwitchLive(prev => !prev)}
          style={{
            marginTop: hideSwitchLive ? '14px' : '8px',
            padding: '8px 16px',
            fontSize: '12px',
            fontFamily: "'Oswald', sans-serif",
            letterSpacing: '1px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer'
          }}
        >
          {hideSwitchLive ? 'SHOW' : 'HIDE'}
        </button>
      )}

      <div style={{
        display: 'flex',
        gap: '14px',
        marginTop: '30px'
      }}>
        <button onClick={togglePause} style={{
          padding: '18px 36px',
          fontSize: '22px',
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: '4px',
          background: 'rgba(255,255,255,0.15)',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '10px',
          color: '#fff',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          minWidth: '130px'
        }}>
          {timerState.isRunning ? 'PAUSE' : 'RESUME'}
        </button>
        
        <button onClick={stopTraining} style={{
          padding: '18px 28px',
          fontSize: '22px',
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: '4px',
          background: 'rgba(0,0,0,0.3)',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: '10px',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer'
        }}>
          STOP
        </button>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        display: 'flex',
        gap: '6px'
      }}>
        {Array.from({ length: config.rounds }, (_, i) => (
          <div key={i} style={{
            width: '32px',
            height: '6px',
            borderRadius: '3px',
            background: i < timerState.currentRound - 1 
              ? '#32c864' 
              : i === timerState.currentRound - 1 
                ? 'rgba(255,255,255,0.8)' 
                : 'rgba(255,255,255,0.2)'
          }} />
        ))}
      </div>
    </div>
  );
}
