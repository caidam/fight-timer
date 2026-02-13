import React from 'react';
import { THEMES } from '../constants/themes';

const ThemePicker = ({ themeId, showThemePicker, setShowThemePicker, changeTheme, theme, themePickerRef, themeMode, toggleMode }) => {
  const ids = Object.keys(THEMES);
  const otherIds = ids.filter(id => id !== themeId);
  // +1 for the dark/light toggle at the end
  const expandedWidth = (otherIds.length + 1) * 28 + 20 + 12;

  return (
    <div ref={themePickerRef} style={{ position: 'relative', height: '22px', zIndex: 1 }}>
      {/* Backdrop pill */}
      <div style={{
        position: 'absolute',
        right: '-6px',
        top: '-5px',
        height: '30px',
        width: showThemePicker ? `${expandedWidth}px` : '30px',
        borderRadius: '15px',
        background: theme.surface,
        border: `1px solid ${showThemePicker ? theme.border : 'transparent'}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: showThemePicker ? 1 : 0,
        transition: 'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease, border-color 0.2s ease',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      {/* Other theme circles — fan out when open */}
      {otherIds.map((id, i) => (
        <button
          key={id}
          onClick={() => { changeTheme(id); setShowThemePicker(false); }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: THEMES[id].swatch,
            border: '1.5px solid rgba(128,128,128,0.25)',
            cursor: 'pointer',
            padding: 0,
            transform: showThemePicker
              ? `translateX(-${(i + 1) * 28}px)`
              : 'translateX(0)',
            opacity: showThemePicker ? 1 : 0,
            transition: `transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.04}s, opacity 0.2s ease ${showThemePicker ? i * 0.04 : 0}s`,
            zIndex: 10 - i,
            pointerEvents: showThemePicker ? 'auto' : 'none'
          }}
        />
      ))}
      {/* Dark/light toggle — last element in fan-out */}
      <button
        onClick={toggleMode}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: theme.surface,
          border: `1.5px solid ${theme.border}`,
          cursor: 'pointer',
          padding: 0,
          fontSize: '12px',
          color: theme.textDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: showThemePicker
            ? `translateX(-${(otherIds.length + 1) * 28}px)`
            : 'translateX(0)',
          opacity: showThemePicker ? 1 : 0,
          transition: `transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) ${otherIds.length * 0.04}s, opacity 0.2s ease ${showThemePicker ? otherIds.length * 0.04 : 0}s`,
          zIndex: 10 - otherIds.length,
          pointerEvents: showThemePicker ? 'auto' : 'none'
        }}
      >
        {themeMode === 'dark' ? '\u2600' : '\u263E'}
      </button>
      {/* Trigger — active theme circle */}
      <button
        onClick={() => setShowThemePicker(!showThemePicker)}
        style={{
          position: 'relative',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: THEMES[themeId].swatch,
          border: '1.5px solid rgba(128,128,128,0.25)',
          cursor: 'pointer',
          padding: 0,
          zIndex: 20,
          boxShadow: !showThemePicker
            ? `0 0 0 2px ${theme.bg}, 0 0 0 3.5px ${THEMES[themeId].swatch}`
            : 'none',
          transition: 'box-shadow 0.2s ease'
        }}
      />
    </div>
  );
};

export default ThemePicker;
