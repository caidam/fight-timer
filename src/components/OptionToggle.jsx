import React from 'react';
import { THEMES } from '../constants/themes';

const OptionToggle = ({ checked, onChange, label, description, theme }) => {
  const th = theme || THEMES.mono.dark;
  return (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
    padding: '10px 0'
  }} onClick={onChange}>
    <div style={{
      width: '22px',
      height: '22px',
      borderRadius: '7px',
      border: `1.5px solid ${checked ? th.accentSolid : th.border}`,
      background: checked ? th.inputBorder : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      flexShrink: 0,
      marginTop: '2px'
    }}>
      {checked && <span style={{ fontSize: '13px', color: th.accentSolid }}>{'\u2713'}</span>}
    </div>
    <div>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '15px', color: th.text }}>{label}</div>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '12px', color: th.textDim, marginTop: '3px' }}>{description}</div>
    </div>
  </div>
  );
};

export default OptionToggle;
