import React from 'react';
import { THEMES } from '../constants/themes';
import { TIMING_MODES } from '../constants/timingModes';
import { useT } from '../i18n/I18nContext';
import HelpSection from './HelpSection';

const HelpModal = ({ onClose, theme }) => {
  const { t } = useT();
  const th = theme || THEMES.mono.dark;
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
    overflowY: 'auto'
  }} onClick={onClose}>
    <div style={{
      background: th.modalBg,
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '85vh',
      overflowY: 'auto',
      border: `1px solid ${th.border}`
    }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', letterSpacing: '2px', color: th.accentSolid }}>{t('help.title')}</h2>
        <button onClick={onClose} style={{
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
              <strong style={{ color: th.text }}>{t('help.hideCountdown')}</strong><br/>
              <span style={{ color: th.textDim }}>{t('help.hideCountdownDesc')}</span>
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
