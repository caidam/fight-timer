import React, { useState } from 'react';

const InlinePillPicker = ({ value, options, onChange, getLabel, theme, disabled = false }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={!open && !disabled ? () => setOpen(true) : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '7px',
        border: `1px solid ${open ? theme.border : theme.borderActive}`,
        background: open ? 'transparent' : theme.surfaceHover,
        padding: '1px',
        cursor: disabled ? 'default' : (open ? 'default' : 'pointer'),
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, background 0.2s ease'
      }}
    >
      {options.map(mode => {
        const selected = value === mode;
        const collapsed = !open && !selected;
        return (
          <button
            key={mode}
            onClick={open && !disabled ? () => { onChange(mode); setOpen(false); } : undefined}
            style={{
              padding: collapsed ? '4px 0' : '4px 11px',
              maxWidth: collapsed ? '0' : '120px',
              opacity: collapsed ? 0 : 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              fontSize: '11px',
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: '1px',
              background: open && selected ? theme.surfaceHover : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: selected ? theme.text : theme.textDim,
              cursor: disabled ? 'default' : 'pointer',
              transition: 'max-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease, padding 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease'
            }}
          >
            {getLabel(mode)}
          </button>
        );
      })}
    </div>
  );
};

export default InlinePillPicker;
