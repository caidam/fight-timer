import React from 'react';
import { useT } from '../i18n/I18nContext';

const LANGUAGES = ['en', 'fr'];

const LanguagePicker = ({ theme, showLangPicker, setShowLangPicker, langPickerRef }) => {
  const { lang, changeLang } = useT();
  const otherLangs = LANGUAGES.filter(l => l !== lang);
  const expandedWidth = otherLangs.length * 32 + 24 + 12;

  return (
    <div ref={langPickerRef} style={{ position: 'relative', height: '24px', zIndex: 2 }}>
      {/* Backdrop pill */}
      <div style={{
        position: 'absolute',
        right: '-6px',
        top: '-5px',
        height: '34px',
        width: showLangPicker ? `${expandedWidth}px` : '34px',
        borderRadius: '17px',
        background: theme.bg,
        border: `1px solid ${showLangPicker ? theme.border : 'transparent'}`,
        opacity: showLangPicker ? 1 : 0,
        transition: 'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease, border-color 0.2s ease',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      {/* Other language options — fan out from trigger */}
      {otherLangs.map((l, i) => (
        <button
          key={l}
          onClick={() => { changeLang(l); setShowLangPicker(false); }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: theme.surface,
            border: `1.5px solid ${theme.border}`,
            cursor: 'pointer',
            padding: 0,
            fontSize: '10px',
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: theme.textDim,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: showLangPicker
              ? `translateX(-${(i + 1) * 32}px)`
              : 'translateX(0)',
            opacity: showLangPicker ? 1 : 0,
            transition: `transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.04}s, opacity 0.2s ease ${showLangPicker ? i * 0.04 : 0}s`,
            zIndex: 10 - i,
            pointerEvents: showLangPicker ? 'auto' : 'none'
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
      {/* Trigger — current language */}
      <button
        onClick={() => setShowLangPicker(!showLangPicker)}
        style={{
          position: 'relative',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: theme.surface,
          border: '1.5px solid rgba(128,128,128,0.25)',
          cursor: 'pointer',
          padding: 0,
          fontSize: '10px',
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: theme.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20
        }}
      >
        {lang.toUpperCase()}
      </button>
    </div>
  );
};

export default LanguagePicker;
