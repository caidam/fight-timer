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

export { getAudioContext, playBellStrike, sounds };
