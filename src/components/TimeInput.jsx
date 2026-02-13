import React, { useState, useEffect } from 'react';
import { parseTimeInput, parseSecondsInput } from '../utils/time';

const TimeInput = ({ value, onChange, label, isSeconds = false, placeholder, disabled = false, theme }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isSeconds) {
      setInputValue(value.toString());
    } else {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      if (secs === 0) {
        setInputValue(mins.toString());
      } else {
        setInputValue(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }
  }, [value, isSeconds]);

  const handleBlur = () => {
    const parsed = isSeconds ? parseSecondsInput(inputValue) : parseTimeInput(inputValue);
    onChange(parsed);
  };

  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '11px',
        color: theme ? theme.textDim : 'rgba(255,255,255,0.35)',
        fontFamily: "'Oswald', sans-serif",
        letterSpacing: '1.5px'
      }}>
        {label}
      </label>
      <input
        type="text"
        inputMode={isSeconds ? "numeric" : "text"}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          background: disabled ? 'transparent' : (theme ? theme.surface : 'rgba(255,255,255,0.05)'),
          border: `1.5px solid ${disabled ? (theme ? theme.border : 'rgba(255,255,255,0.06)') : (theme ? theme.inputBorder : 'rgba(255,255,255,0.12)')}`,
          color: disabled ? (theme ? theme.textDim : 'rgba(255,255,255,0.4)') : (theme ? theme.text : '#fff'),
          padding: '12px 8px',
          fontSize: '18px',
          fontFamily: "'Oswald', sans-serif",
          width: '100%',
          borderRadius: '10px',
          textAlign: 'center',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'text'
        }}
      />
    </div>
  );
};

export default TimeInput;
