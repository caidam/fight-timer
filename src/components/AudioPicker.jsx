import React from 'react';
import { useT } from '../i18n/I18nContext';

const MODES = ['voice', 'bells', 'off'];

const IconVoice = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

const IconBell = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const IconOff = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const ICONS = { voice: IconVoice, bells: IconBell, off: IconOff };

const AudioPicker = ({ theme, audioMode, setAudioMode, showAudioPicker, setShowAudioPicker, audioPickerRef }) => {
  const { t } = useT();
  const otherModes = MODES.filter(m => m !== audioMode);
  const expandedHeight = otherModes.length * 26 + 28;
  const CurrentIcon = ICONS[audioMode];

  return (
    <div ref={audioPickerRef} style={{ position: 'relative', width: '18px', height: '24px', zIndex: 2 }}>
      {/* Backdrop pill */}
      <div style={{
        position: 'absolute',
        right: '-5px',
        top: '-2px',
        width: '28px',
        height: showAudioPicker ? `${expandedHeight}px` : '28px',
        borderRadius: '14px',
        background: theme.bg,
        border: `1.5px solid ${showAudioPicker ? theme.border : 'rgba(128,128,128,0.25)'}`,
        transition: 'height 0.35s cubic-bezier(0.22, 1.8, 0.5, 1), border-color 0.2s ease',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      {/* Other options fan out downward */}
      {otherModes.map((m, i) => {
        const Icon = ICONS[m];
        return (
          <button
            key={m}
            onClick={() => { setAudioMode(m); setShowAudioPicker(false); }}
            aria-label={t(`config.audio.${m}`)}
            title={t(`config.audio.${m}`)}
            style={{
              position: 'absolute',
              right: '-5px',
              top: '-2px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: showAudioPicker
                ? `translateY(${(i + 1) * 26}px)`
                : 'translateY(0)',
              opacity: showAudioPicker ? 1 : 0,
              transition: `transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.04}s, opacity 0.2s ease ${showAudioPicker ? i * 0.04 : 0}s`,
              zIndex: 10 - i,
              pointerEvents: showAudioPicker ? 'auto' : 'none'
            }}
          >
            <Icon color={theme.textDim} />
          </button>
        );
      })}
      {/* Trigger */}
      <button
        onClick={() => setShowAudioPicker(!showAudioPicker)}
        aria-label={t(`config.audio.${audioMode}`)}
        title={t(`config.audio.${audioMode}`)}
        style={{
          position: 'absolute',
          right: '-5px',
          top: '-2px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20
        }}
      >
        <CurrentIcon color={theme.text} />
      </button>
    </div>
  );
};

export default AudioPicker;
