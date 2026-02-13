import { formatTimeShort } from './time';
import { TIMING_MODES } from '../constants/timingModes';
import { THEMES } from '../constants/themes';
import { createDefaultPreset } from './presets';

// Compact readable URL encoding
// Format: name/ROUNDSxDURATION/REST/MODE[+flags][/iMIN-MAX/nMIN-MAX]
// Multiple presets: preset1|preset2  (active preset first)
export const encodePresetCompact = (preset) => {
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
  if (preset.warmupDuration > 0) s += `/w${preset.warmupDuration}`;
  if (preset.cooldownDuration > 0) s += `/d${preset.cooldownDuration}`;
  return s;
};

export const parseUrlDuration = (str) => {
  if (!str) return 0;
  const m = str.match(/^(\d+)m(\d+)?s?$/);
  if (m) return parseInt(m[1]) * 60 + (parseInt(m[2]) || 0);
  const sec = str.match(/^(\d+)s$/);
  if (sec) return parseInt(sec[1]);
  return parseInt(str) || 0;
};

export const decodePresetCompact = (str) => {
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
  for (const p of parts.slice(4)) {
    if (timingMode === 'custom') {
      const im = p.match(/^i(\d+)-(\d+)$/);
      if (im) { preset.intenseMin = parseInt(im[1]); preset.intenseMax = parseInt(im[2]); }
      const nm = p.match(/^n(\d+)-(\d+)$/);
      if (nm) { preset.normalMin = parseInt(nm[1]); preset.normalMax = parseInt(nm[2]); }
    }
    const wm = p.match(/^w(\d+)$/);
    if (wm) preset.warmupDuration = parseInt(wm[1]);
    const dm = p.match(/^d(\d+)$/);
    if (dm) preset.cooldownDuration = parseInt(dm[1]);
  }
  return preset;
};

export const encodeStateCompact = (presets, activePresetId) => {
  const active = presets.find(p => p.id === activePresetId);
  const rest = presets.filter(p => p.id !== activePresetId);
  return [active, ...rest].filter(Boolean).map(encodePresetCompact).join('|');
};

export const decodeStateCompact = (hash) => {
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
