import { TIMING_MODES } from '../constants/timingModes';

export const createDefaultPreset = (name = 'Preset 1') => ({
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
  hideNextSwitch: false,
  hideTimer: false,
  hideTimerMode: 'blackout',
  warmupDuration: 0,
  cooldownDuration: 0
});

export const applyTimingMode = (preset) => {
  if (preset.timingMode === 'custom') return preset;
  const mode = TIMING_MODES[preset.timingMode];
  if (!mode) return preset;
  const timings = mode.getTimings(preset.roundDuration);
  if (!timings) return preset;
  return { ...preset, ...timings };
};

// Calculate progressive adjustments for a given round
export const getProgressiveTimings = (config, currentRound) => {
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
