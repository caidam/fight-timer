// Timing mode calculations — scale proportionally to round duration
// name/description removed — now served by i18n: t('mode.${key}.name')
export const TIMING_MODES = {
  chaos: {
    emoji: '\u26A1',
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
    emoji: '\u2696\uFE0F',
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
    emoji: '\uD83C\uDFD4\uFE0F',
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
    emoji: '\uD83C\uDF9B\uFE0F',
    getTimings: () => null
  }
};
