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

// Voice cue via Web Speech API — short commanding English words.
// Deliberately does NOT call speechSynthesis.cancel() — Chrome has a known
// bug where cancel() right before speak() leaves the engine silenced.
// Event cadence in this app is slow enough (seconds apart) that natural
// queueing is fine.
let _cachedVoice = null;
const pickVoice = () => {
  if (_cachedVoice) return _cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer an en-US voice; fall back to any English; finally any default voice.
  _cachedVoice =
    voices.find(v => v.lang === 'en-US' && v.default) ||
    voices.find(v => v.lang === 'en-US') ||
    voices.find(v => v.lang && v.lang.startsWith('en')) ||
    voices.find(v => v.default) ||
    voices[0];
  return _cachedVoice;
};

const speak = (text, { delay = 0 } = {}) => {
  if (typeof window === 'undefined') return;
  if (!('speechSynthesis' in window)) return;
  const fire = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 1.05;
    u.pitch = 1.0;
    u.volume = 1.0;
    const v = pickVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  };
  if (delay > 0) setTimeout(fire, delay * 1000);
  else fire();
};

// Audio mode: 'voice' = bells for round markers + voice for switches (default, clearest)
//             'bells' = legacy bells-only behavior
//             'off'   = silent
let audioMode = 'voice';
const setAudioMode = (mode) => {
  if (mode === 'voice' || mode === 'bells' || mode === 'off') audioMode = mode;
};
const getAudioMode = () => audioMode;

// Unlock audio context + speech synthesis on user gesture.
// iOS Safari requires speak() to be called inside a gesture handler
// before subsequent utterances will play.
const warmAudio = async () => {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') {
    try { await ctx.resume(); } catch {}
  }
  if ('speechSynthesis' in window) {
    try {
      // Voices list is often empty until voiceschanged fires — listen once.
      if (!window.speechSynthesis.getVoices().length) {
        window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice, { once: true });
      } else {
        pickVoice();
      }
      // iOS Safari unlock: need a real speak() inside the user gesture.
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {}
  }
};

const sounds = {
  roundStart: () => {
    if (audioMode === 'off') return;
    playBellStrike(0.55, 1.8);
    if (audioMode === 'voice') speak('Fight', { delay: 0.25 });
  },
  roundEnd: () => {
    if (audioMode === 'off') return;
    playBellStrike(0.5, 1.2, 0);
    playBellStrike(0.5, 1.2, 0.22);
    playBellStrike(0.5, 1.2, 0.44);
    if (audioMode === 'voice') speak('Rest', { delay: 0.7 });
  },
  finalEnd: () => {
    if (audioMode === 'off') return;
    playBellStrike(0.6, 2.0, 0);
    playBellStrike(0.6, 2.0, 0.22);
    playBellStrike(0.6, 2.0, 0.44);
    if (audioMode === 'voice') speak('Done', { delay: 0.8 });
  },
  intense: () => {
    if (audioMode === 'off') return;
    if (audioMode === 'voice') {
      speak('Push');
    } else {
      playBellStrike(0.4, 0.35, 0);
      playBellStrike(0.4, 0.35, 0.14);
    }
  },
  normal: () => {
    if (audioMode === 'off') return;
    if (audioMode === 'voice') {
      speak('Ease');
    } else {
      playBellStrike(0.25, 0.5);
    }
  }
};

export { getAudioContext, playBellStrike, speak, sounds, setAudioMode, getAudioMode, warmAudio };
