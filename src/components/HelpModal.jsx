import React, { useState, useEffect, useCallback } from 'react';
import { THEMES } from '../constants/themes';
import { TIMING_MODES } from '../constants/timingModes';
import { useT } from '../i18n/I18nContext';
import HelpSection from './HelpSection';

const HelpModal = ({ onClose, theme }) => {
  const { t } = useT();
  const th = theme || THEMES.mono.dark;
  const [visible, setVisible] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  const handleImportUrl = useCallback(() => {
    const trimmed = importUrl.trim();
    if (!trimmed) return;
    try {
      const url = new URL(trimmed);
      const hash = url.hash.slice(1);
      if (!hash) { setImportError(true); return; }
      // Close modal, then set the hash — hashchange listener handles the rest
      setVisible(false);
      setTimeout(() => {
        onClose();
        window.location.hash = hash;
      }, 250);
    } catch {
      setImportError(true);
    }
  }, [importUrl, onClose]);

  return (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    overflowY: 'auto',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.25s ease'
  }} onClick={handleClose}>
    <div style={{
      background: th.modalBg,
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '85vh',
      overflowY: 'auto',
      border: `1px solid ${th.border}`,
      transform: visible ? 'scale(1)' : 'scale(0.85)',
      opacity: visible ? 1 : 0,
      transition: visible
        ? 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease'
        : 'transform 0.2s ease-out, opacity 0.15s ease'
    }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', letterSpacing: '2px', color: th.accentSolid }}>{t('help.title')}</h2>
        <button onClick={handleClose} style={{
          background: 'none',
          border: 'none',
          color: th.textDim,
          fontSize: '28px',
          cursor: 'pointer',
          padding: '4px 8px'
        }}>{'\u00D7'}</button>
      </div>

      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '14px', lineHeight: '1.5', color: th.text }}>
        <HelpSection title={t('help.concept')} defaultOpen={true} theme={th}>
          <p style={{ margin: 0 }}>
            {t('help.conceptBefore')} <span style={{ color: '#ff3200' }}>{t('training.intense')}</span> {t('help.conceptAnd')} <span style={{ color: '#32c864' }}>{t('training.normal')}</span> {t('help.conceptAfter')}
          </p>
        </HelpSection>

        <HelpSection title={t('help.timingModes')} theme={th}>
          <div style={{ display: 'grid', gap: '8px' }}>
            {Object.entries(TIMING_MODES).map(([key, mode]) => (
              <div key={key} style={{ background: th.surface, borderRadius: '6px', padding: '10px' }}>
                <strong>{mode.emoji} {t(`mode.${key}.name`)}</strong> {'\u2014'} {t(`mode.${key}.description`)}
              </div>
            ))}
          </div>
        </HelpSection>

        <HelpSection title={t('help.options')} theme={th}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <strong style={{ color: th.text }}>{t('help.progressiveIntensity')}</strong><br/>
              <span style={{ color: th.textDim }}>{t('help.progressiveDesc')}</span>
            </div>
            <div>
              <strong style={{ color: th.text }}>{t('help.hideTimer')}</strong><br/>
              <span style={{ color: th.textDim }}>{t('help.hideTimerDesc')}</span>
            </div>
            <div>
              <strong style={{ color: th.text }}>{t('help.hideSwitch')}</strong><br/>
              <span style={{ color: th.textDim }}>{t('help.hideSwitchDesc')}</span>
            </div>
            <div>
              <strong style={{ color: th.text }}>{t('help.warmupCooldown')}</strong><br/>
              <span style={{ color: th.textDim }}>{t('help.warmupCooldownDesc')}</span>
            </div>
          </div>
        </HelpSection>

        <HelpSection title={t('help.audioCues')} theme={th}>
          <div style={{ color: th.textDim }}>
            <div>{t('help.audioIntense')}</div>
            <div>{t('help.audioNormal')}</div>
          </div>
        </HelpSection>

        <HelpSection title={t('help.savingSharing')} theme={th}>
          <div style={{ display: 'grid', gap: '10px', color: th.textDim }}>
            <div>
              <strong style={{ color: th.text }}>{t('help.savedInUrl')}</strong><br/>
              {t('help.savedInUrlDesc')}
            </div>
            <div>
              <strong style={{ color: th.text }}>{t('help.sharePartner')}</strong><br/>
              {t('help.sharePartnerDesc')}
            </div>
            <div>
              <strong style={{ color: th.text }}>{t('help.multiplePresets')}</strong><br/>
              {t('help.multiplePresetsDesc')}
            </div>
            <div style={{ marginTop: '4px' }}>
              <strong style={{ color: th.text }}>{t('help.importUrl')}</strong><br/>
              <span>{t('help.importUrlDesc')}</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => { setImportUrl(e.target.value); setImportError(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleImportUrl()}
                  placeholder={t('help.importUrlPlaceholder')}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: th.surface,
                    border: `1px solid ${importError ? 'rgba(255,100,100,0.6)' : th.border}`,
                    borderRadius: '6px',
                    color: th.text,
                    padding: '8px 10px',
                    fontSize: '13px',
                    fontFamily: "'Oswald', sans-serif",
                  }}
                />
                <button
                  onClick={handleImportUrl}
                  style={{
                    background: importUrl.trim() ? th.accentSolid : th.surface,
                    border: `1px solid ${importUrl.trim() ? th.accentSolid : th.border}`,
                    borderRadius: '6px',
                    color: importUrl.trim() ? (th.bg || '#000') : th.textDim,
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontFamily: "'Oswald', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >{t('help.importUrlButton')}</button>
              </div>
              {importError && (
                <div style={{ color: 'rgba(255,100,100,0.8)', fontSize: '12px', marginTop: '6px' }}>
                  {t('help.importUrlInvalid')}
                </div>
              )}
            </div>
          </div>
        </HelpSection>

        <HelpSection title={t('help.install')} theme={th}>
          <p style={{ margin: '0 0 10px 0', color: th.textDim }}>
            {t('help.installDesc')}
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ background: th.surface, borderRadius: '6px', padding: '10px', color: th.textDim }}>
              <strong style={{ color: th.text }}>{t('help.iphone')}</strong><br/>
              {t('help.iphoneInstructions')}
            </div>
            <div style={{ background: th.surface, borderRadius: '6px', padding: '10px', color: th.textDim }}>
              <strong style={{ color: th.text }}>{t('help.android')}</strong><br/>
              {t('help.androidInstructions')}
            </div>
          </div>
        </HelpSection>
      </div>
    </div>
  </div>
  );
};

export default HelpModal;
