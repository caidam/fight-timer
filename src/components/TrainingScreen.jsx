import React, { useState, useEffect } from 'react';
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
  },
  warmup: {
    bg: 'radial-gradient(circle at 50% 30%, #c89632 0%, #645020 50%, #1a1400 100%)',
    glow: 'rgba(200,150,50,0.4)'
  },
  cooldown: {
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
  hideTimerLive,
  setHideTimerLive,
  toggleFullscreen,
  togglePause,
  stopTraining,
  phase
}) => {
  const { t } = useT();
  const currentColors = intensityColors[timerState.intensity] || intensityColors.normal;
  const switchIn = Math.max(0, timerState.timeRemaining - timerState.switchTarget);
  const isTimerGlitched = hideTimerLive && phase === 'training' && !timerState.isResting;

  const [scrambled, setScrambled] = useState('0:00');
  const [scrambledGhost, setScrambledGhost] = useState('0:00');
  useEffect(() => {
    if (!isTimerGlitched) return;
    const tick = setInterval(() => {
      const d = () => Math.floor(Math.random() * 10);
      setScrambled(`${d()}:${Math.floor(Math.random() * 6)}${d()}`);
      setScrambledGhost(`${d()}:${Math.floor(Math.random() * 6)}${d()}`);
    }, 100);
    return () => clearInterval(tick);
  }, [isTimerGlitched]);

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
        @keyframes glitch {
          0%, 100% { transform: translate(0) skewX(0); }
          8% { transform: translate(-4px, 2px) skewX(-2deg); }
          12% { transform: translate(3px, -2px) skewX(1deg); }
          15% { transform: translate(0) skewX(0); }
          28% { transform: translate(2px, 1px) skewX(-1deg); }
          32% { transform: translate(-5px, -1px) skewX(2deg); }
          40% { transform: translate(0) skewX(0); }
          55% { transform: translate(4px, -2px) skewX(1deg); }
          58% { transform: translate(-2px, 2px) skewX(-1deg); }
          65% { transform: translate(0) skewX(0); }
          78% { transform: translate(-3px, 1px) skewX(1deg); }
          82% { transform: translate(3px, -1px) skewX(-1deg); }
          90% { transform: translate(0) skewX(0); }
        }
        @keyframes glitchGhost {
          0%, 100% { clip-path: inset(0 0 80% 0); transform: translate(6px, 0); }
          10% { clip-path: inset(15% 0 60% 0); transform: translate(-8px, 0); }
          20% { clip-path: inset(70% 0 5% 0); transform: translate(10px, 0); }
          30% { clip-path: inset(0 0 85% 0); transform: translate(-6px, 0); }
          40% { clip-path: inset(40% 0 30% 0); transform: translate(8px, 0); }
          50% { clip-path: inset(80% 0 0 0); transform: translate(-10px, 0); }
          60% { clip-path: inset(10% 0 70% 0); transform: translate(6px, 0); }
          70% { clip-path: inset(55% 0 20% 0); transform: translate(-8px, 0); }
          80% { clip-path: inset(0 0 65% 0); transform: translate(10px, 0); }
          90% { clip-path: inset(30% 0 45% 0); transform: translate(-6px, 0); }
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
          {phase === 'warmup' || phase === 'cooldown' ? (
            <div style={{ fontSize: '28px', letterSpacing: '2px' }}>
              {t(`training.${phase}`)}
            </div>
          ) : (
            <>
              <div style={{
                fontSize: '11px',
                fontFamily: "'Oswald', sans-serif",
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '2px'
              }}>{t('training.round')}</div>
              <div style={{ fontSize: '40px', letterSpacing: '2px' }}>
                {timerState.currentRound}/{config.rounds}
              </div>
            </>
          )}
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

      {phase !== 'warmup' && phase !== 'cooldown' && (
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
      )}

      <div
        onClick={isTimerGlitched ? () => setHideTimerLive(false) : undefined}
        style={{ position: 'relative', lineHeight: '1', cursor: isTimerGlitched ? 'pointer' : 'default' }}
      >
        <div style={{
          fontSize: 'clamp(90px, 28vw, 170px)',
          fontWeight: '700',
          textShadow: isTimerGlitched
            ? `-5px 0 rgba(255,0,60,0.7), 5px 0 rgba(0,255,255,0.7), 0 0 60px ${currentColors.glow}`
            : `0 0 60px ${currentColors.glow}, 0 0 120px ${currentColors.glow}`,
          animation: isTimerGlitched
            ? 'glitch 0.4s steps(1) infinite'
            : timerState.isRunning ? 'pulse 1s ease infinite' : 'none',
          lineHeight: '1'
        }}>
          {isTimerGlitched ? scrambled : formatTime(timerState.timeRemaining)}
        </div>
        {isTimerGlitched && (
          <div aria-hidden style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            fontSize: 'clamp(90px, 28vw, 170px)',
            fontWeight: '700',
            lineHeight: '1',
            color: 'rgba(0,255,255,0.4)',
            textShadow: `5px 0 rgba(255,0,60,0.3)`,
            animation: 'glitchGhost 0.25s steps(1) infinite',
            pointerEvents: 'none'
          }}>
            {scrambledGhost}
          </div>
        )}
        {isTimerGlitched && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-4deg)',
            background: 'rgba(0,0,0,0.9)',
            padding: '14px 30px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <span style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '14px',
              letterSpacing: '2px',
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}>
              {t('training.timerHidden')}
            </span>
          </div>
        )}
      </div>

      {!timerState.isResting && phase === 'training' && (
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

      {/* Toggle visibility buttons */}
      {!timerState.isResting && phase === 'training' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={() => setHideTimerLive(prev => !prev)}
            style={{
              padding: '8px 14px',
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
            {hideTimerLive ? t('training.timerShow') : t('training.timerHide')}
          </button>
          <button
            onClick={() => setHideSwitchLive(prev => !prev)}
            style={{
              padding: '8px 14px',
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
            {hideSwitchLive ? t('training.switchShow') : t('training.switchHide')}
          </button>
        </div>
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

      {phase !== 'warmup' && phase !== 'cooldown' && (
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
      )}
    </div>
  );
};

export default TrainingScreen;
