import React from 'react';
import { formatTime } from '../utils/time';
import { useT } from '../i18n/I18nContext';

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

const TrainingScreen = ({
  containerRef,
  timerState,
  config,
  globalStyles,
  isFullscreen,
  hideSwitchLive,
  setHideSwitchLive,
  toggleFullscreen,
  togglePause,
  stopTraining
}) => {
  const { t } = useT();
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
          }}>{t('training.round')}</div>
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
          {isFullscreen ? '\u2299' : '\u26F6'}
        </button>
      </div>

      <div style={{
        fontSize: 'clamp(26px, 8vw, 48px)',
        letterSpacing: '5px',
        marginBottom: '12px',
        textTransform: 'uppercase',
        animation: timerState.intensity === 'intense'
          ? 'intensePulse 0.5s ease infinite'
          : 'none'
      }}>
        {t(`training.${timerState.intensity}`)}
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

      {!timerState.isResting && (
        <div style={{
          overflow: 'hidden',
          maxHeight: hideSwitchLive ? '0' : '40px',
          opacity: hideSwitchLive ? 0 : 1,
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
          marginTop: '14px'
        }}>
          <div style={{
            fontSize: '15px',
            fontFamily: "'Oswald', sans-serif",
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '2px'
          }}>
            {t('training.switchIn', { seconds: switchIn })}
          </div>
        </div>
      )}

      {/* Toggle switch visibility button */}
      {!timerState.isResting && (
        <button
          onClick={() => setHideSwitchLive(prev => !prev)}
          style={{
            marginTop: '8px',
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
          {hideSwitchLive ? t('training.show') : t('training.hide')}
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
          {timerState.isRunning ? t('training.pause') : t('training.resume')}
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
          {t('training.stop')}
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
};

export default TrainingScreen;
