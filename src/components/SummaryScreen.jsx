import React from 'react';
import { formatTime } from '../utils/time';
import { useT } from '../i18n/I18nContext';

const SummaryScreen = ({ timerState, theme, globalStyles, onTrainAgain, containerRef }) => {
  const { t } = useT();
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
      }}>{t('summary.complete')}</h1>

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
          <div style={{ fontSize: '18px', color: theme.textDim, fontFamily: "'Oswald', sans-serif", letterSpacing: '2px' }}>{t('summary.totalActive')}</div>
          <div style={{ fontSize: '48px', color: theme.text }}>{formatTime(totalActive)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#ff3200', fontFamily: "'Oswald', sans-serif" }}>{t('summary.intense')}</div>
            <div style={{ fontSize: '24px' }}>{formatTime(timerState.totalIntenseTime)}</div>
            <div style={{ fontSize: '18px', color: theme.textDim }}>{intensePercent}%</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#32c864', fontFamily: "'Oswald', sans-serif" }}>{t('summary.normal')}</div>
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

      <button onClick={onTrainAgain} style={{
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
        {t('summary.trainAgain')}
      </button>
    </div>
  );
};

export default SummaryScreen;
