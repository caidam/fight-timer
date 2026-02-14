import React from 'react';
import { useT } from '../i18n/I18nContext';

const LANGUAGES = ['en', 'fr'];

const LanguagePicker = ({ theme, showLangPicker, setShowLangPicker, langPickerRef }) => {
  const { lang, changeLang } = useT();
  const otherLangs = LANGUAGES.filter(l => l !== lang);
  const expandedHeight = otherLangs.length * 26 + 28;

  return (
    <div ref={langPickerRef} style={{ position: 'relative', width: '18px', height: '24px', zIndex: 2 }}>
      {/* Backdrop pill — always visible as the trigger's ring, morphs downward when expanded */}
      <div style={{
        position: 'absolute',
        right: '-5px',
        top: '-2px',
        width: '28px',
        height: showLangPicker ? `${expandedHeight}px` : '28px',
        borderRadius: '14px',
        background: theme.bg,
        border: `1.5px solid ${showLangPicker ? theme.border : 'rgba(128,128,128,0.25)'}`,
        transition: 'height 0.35s cubic-bezier(0.22, 1.8, 0.5, 1), border-color 0.2s ease',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      {/* Other language options — fan out downward from trigger */}
      {otherLangs.map((l, i) => (
        <button
          key={l}
          onClick={() => { changeLang(l); setShowLangPicker(false); }}
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
            fontSize: '10px',
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            color: theme.textDim,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: showLangPicker
              ? `translateY(${(i + 1) * 26}px)`
              : 'translateY(0)',
            opacity: showLangPicker ? 1 : 0,
            transition: `transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.04}s, opacity 0.2s ease ${showLangPicker ? i * 0.04 : 0}s`,
            zIndex: 10 - i,
            pointerEvents: showLangPicker ? 'auto' : 'none'
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
      {/* Trigger — current language, sits on top of the pill ring */}
      <button
        onClick={() => setShowLangPicker(!showLangPicker)}
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
          fontSize: '10px',
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
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
