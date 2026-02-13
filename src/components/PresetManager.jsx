import React, { useState, useEffect, useRef } from 'react';
import { THEMES } from '../constants/themes';
import { formatTimeShort } from '../utils/time';
import { useT } from '../i18n/I18nContext';

const PresetManager = ({ presets, activePresetId, onSelect, onAdd, onDelete, onRename, theme }) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [animatingId, setAnimatingId] = useState(null);
  const prevLength = useRef(presets.length);
  const { t } = useT();
  const th = theme || THEMES.mono.dark;

  // Detect newly added preset and trigger slide-in animation
  useEffect(() => {
    if (presets.length > prevLength.current) {
      const newPreset = presets[presets.length - 1];
      setAnimatingId(newPreset.id);
      const timer = setTimeout(() => setAnimatingId(null), 450);
      return () => clearTimeout(timer);
    }
    prevLength.current = presets.length;
  }, [presets.length]);

  const startEdit = (preset) => {
    setEditingId(preset.id);
    setEditName(preset.name);
  };

  const saveEdit = () => {
    if (editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div style={{
      background: th.surface,
      border: `1px solid ${th.border}`,
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <style>{`
        @keyframes presetGlow {
          0%, 100% { box-shadow: 0 0 4px 0 ${th.accentSolid}66; }
          50% { box-shadow: 0 0 10px 3px ${th.accentSolid}44; }
        }
        @keyframes presetSlideIn {
          0% { max-height: 0; opacity: 0; transform: translateY(-16px) scaleY(0.6); }
          60% { max-height: 80px; opacity: 0.8; transform: translateY(2px) scaleY(1.02); }
          100% { max-height: 80px; opacity: 1; transform: translateY(0) scaleY(1); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px'
      }}>
        <h3 style={{
          margin: 0,
          color: th.accent,
          fontSize: '13px',
          letterSpacing: '2px',
          fontWeight: 400
        }}>{t('presets.title')}</h3>
        <button onClick={onAdd} style={{
          background: th.surfaceHover,
          border: `1px solid ${th.border}`,
          borderRadius: '8px',
          color: th.textDim,
          padding: '6px 14px',
          fontSize: '13px',
          fontFamily: "'Oswald', sans-serif",
          cursor: 'pointer',
          letterSpacing: '1px'
        }}>{t('presets.add')}</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {presets.map(preset => {
          const isActive = activePresetId === preset.id;
          const isAnimating = animatingId === preset.id;
          return (
          <div key={preset.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            background: isActive ? th.surfaceHover : 'transparent',
            border: `1px solid ${isActive ? th.borderActive : th.border}`,
            borderRadius: '10px',
            cursor: 'pointer',
            overflow: 'hidden',
            transformOrigin: 'top',
            animation: isAnimating ? 'presetSlideIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none'
          }} onClick={() => onSelect(preset.id)}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: `2px solid ${isActive ? th.accentSolid : th.inputBorder}`,
              background: isActive ? th.accentSolid : 'transparent',
              flexShrink: 0,
              animation: isActive ? 'presetGlow 2s ease infinite' : 'none'
            }} />

            {editingId === preset.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${th.focusBorder}`,
                  borderRadius: '4px',
                  color: th.text,
                  padding: '4px 8px',
                  fontSize: '15px',
                  fontFamily: "'Oswald', sans-serif"
                }}
              />
            ) : (
              <span style={{
                flex: 1,
                fontFamily: "'Oswald', sans-serif",
                fontSize: '15px',
                color: isActive ? th.text : th.textDim
              }}>
                {preset.name}
              </span>
            )}

            <span style={{
              fontSize: '12px',
              color: th.textDim,
              fontFamily: "'Oswald', sans-serif"
            }}>
              {preset.rounds}{'\u00D7'}{formatTimeShort(preset.roundDuration)}
            </span>

            <button onClick={(e) => { e.stopPropagation(); startEdit(preset); }} style={{
              background: 'none',
              border: 'none',
              color: th.textDim,
              cursor: 'pointer',
              padding: '4px',
              fontSize: '14px'
            }}>{'\u270E'}</button>

            {presets.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(preset.id); }} style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,100,100,0.6)',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '14px'
              }}>{'\u2715'}</button>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default PresetManager;
