import React, { useState } from 'react';

const HelpSection = ({ title, children, defaultOpen = false, theme: th }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${th.border}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Oswald', sans-serif",
          fontSize: '14px',
          letterSpacing: '1.5px',
          color: th.accentSolid
        }}
      >
        {title}
        <span style={{
          fontSize: '18px',
          color: th.textDim,
          transform: open ? 'rotate(90deg)' : 'rotate(0)',
          transition: 'transform 0.25s ease'
        }}>{'\u203A'}</span>
      </button>
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '500px' : '0',
        transition: 'max-height 0.5s ease'
      }}>
        <div style={{
          transform: open ? 'scaleY(1)' : 'scaleY(0)',
          transformOrigin: 'top',
          opacity: open ? 1 : 0,
          transition: 'transform 0.45s ease, opacity 0.35s ease',
          paddingBottom: '14px'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
