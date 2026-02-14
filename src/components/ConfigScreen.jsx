import React, { useState } from 'react';
import { TIMING_MODES } from '../constants/timingModes';
import { formatTimeShort } from '../utils/time';
import { useT } from '../i18n/I18nContext';
import ThemePicker from './ThemePicker';
import LanguagePicker from './LanguagePicker';
import PresetManager from './PresetManager';
import TimeInput from './TimeInput';
import OptionToggle from './OptionToggle';
import HelpModal from './HelpModal';

const ConfigScreen = ({
  containerRef,
  theme,
  themeId,
  themeMode,
  showThemePicker,
  setShowThemePicker,
  themePickerRef,
  changeTheme,
  toggleMode,
  showHelp,
  setShowHelp,
  shareToast,
  presets,
  activePresetId,
  setActivePresetId,
  addPreset,
  deletePreset,
  renamePreset,
  reorderPresets,
  activePreset,
  config,
  updateActivePreset,
  setTimingMode,
  setRoundDuration,
  startTraining,
  shareConfig,
  showLangPicker,
  setShowLangPicker,
  langPickerRef,
  copyUrl,
  globalStyles,
  deferredInstallPrompt,
  isStandalone,
  installBannerFolded,
  handleInstallClick,
  toggleInstallBanner
}) => {
  const { t } = useT();
  const [effectOpen, setEffectOpen] = useState(false);

  return (
    <div ref={containerRef} style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      background: theme.bg,
      color: theme.text,
      fontFamily: "'Bebas Neue', 'Impact', sans-serif",
      padding: '24px',
      paddingBottom: '48px',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <style>{globalStyles}</style>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} theme={theme} />}

      {shareToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: theme.accentSolid,
          color: theme.bg,
          padding: '12px 24px',
          borderRadius: '12px',
          fontFamily: "'Oswald', sans-serif",
          fontSize: '15px',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}>
          {t('config.urlCopied')}
        </div>
      )}

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(32px, 9vw, 48px)',
              margin: '0',
              color: theme.text,
              letterSpacing: '4px',
              fontWeight: 400
            }}>{t('config.title')}</h1>
            <p style={{
              color: theme.textDim,
              fontFamily: "'Oswald', sans-serif",
              fontSize: '12px',
              letterSpacing: '3px',
              margin: '6px 0 0 0'
            }}>{t('config.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ThemePicker
              themeId={themeId}
              showThemePicker={showThemePicker}
              setShowThemePicker={setShowThemePicker}
              changeTheme={changeTheme}
              theme={theme}
              themePickerRef={themePickerRef}
              themeMode={themeMode}
              toggleMode={toggleMode}
            />
            <div style={{ marginLeft: '16px' }}>
              <LanguagePicker
                theme={theme}
                showLangPicker={showLangPicker}
                setShowLangPicker={setShowLangPicker}
                langPickerRef={langPickerRef}
              />
            </div>
            <button onClick={() => setShowHelp(true)} style={{
              marginLeft: '11px',
              background: theme.bg,
              border: '1.5px solid rgba(128,128,128,0.25)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              color: theme.textDim,
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              padding: 0,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>?</button>
          </div>
        </div>

        {/* Preset Manager */}
        <PresetManager
          presets={presets}
          activePresetId={activePresetId}
          onSelect={setActivePresetId}
          onAdd={addPreset}
          onDelete={deletePreset}
          onRename={renamePreset}
          onReorder={reorderPresets}
          theme={theme}
        />

        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Rounds */}
          <div style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: theme.accent, fontSize: '13px', letterSpacing: '2px', fontWeight: 400 }}>{t('config.session')}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', color: theme.textDim, fontFamily: "'Oswald', sans-serif", letterSpacing: '1.5px' }}>{t('config.rounds')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={activePreset.rounds}
                  onChange={e => {
                    const val = e.target.value.replace(/[^\d]/g, '');
                    if (val === '') updateActivePreset({ rounds: '' });
                    else updateActivePreset({ rounds: val });
                  }}
                  onBlur={e => {
                    const parsed = parseInt(e.target.value);
                    const clamped = isNaN(parsed) || parsed < 1 ? 1 : Math.min(parsed, 50);
                    updateActivePreset({ rounds: clamped });
                  }}
                  onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                  placeholder={t('config.roundsPlaceholder')}
                  style={{
                    background: theme.surface,
                    border: `1.5px solid ${theme.inputBorder}`,
                    color: theme.text,
                    padding: '12px 8px',
                    fontSize: '18px',
                    fontFamily: "'Oswald', sans-serif",
                    width: '100%',
                    borderRadius: '10px',
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <TimeInput
                value={activePreset.roundDuration}
                onChange={setRoundDuration}
                label={t('config.duration')}
                placeholder="3:00"
                theme={theme}
              />
              <TimeInput
                value={activePreset.restDuration}
                onChange={(v) => updateActivePreset({ restDuration: v })}
                label={t('config.rest')}
                placeholder="1:00"
                theme={theme}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <TimeInput
                value={activePreset.warmupDuration}
                onChange={(v) => updateActivePreset({ warmupDuration: v })}
                label={t('config.warmup')}
                placeholder="0:00"
                theme={theme}
              />
              <TimeInput
                value={activePreset.cooldownDuration}
                onChange={(v) => updateActivePreset({ cooldownDuration: v })}
                label={t('config.cooldown')}
                placeholder="0:00"
                theme={theme}
              />
            </div>
          </div>

          {/* Timing Mode */}
          <div style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: theme.accent, fontSize: '13px', letterSpacing: '2px', fontWeight: 400 }}>{t('config.timingMode')}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.entries(TIMING_MODES).map(([key, mode]) => (
                <button
                  key={key}
                  onClick={() => setTimingMode(key)}
                  style={{
                    padding: '14px',
                    background: activePreset.timingMode === key ? theme.surfaceHover : 'transparent',
                    border: `1.5px solid ${activePreset.timingMode === key ? theme.borderActive : theme.border}`,
                    borderRadius: '10px',
                    color: activePreset.timingMode === key ? theme.text : theme.textDim,
                    cursor: 'pointer',
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '15px',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '18px', marginRight: '8px' }}>{mode.emoji}</span>
                  {t(`mode.${key}.name`)}
                </button>
              ))}
            </div>

            <p style={{ margin: '14px 0 0 0', fontSize: '13px', color: theme.textDim, fontFamily: "'Oswald', sans-serif", lineHeight: '1.5' }}>
              {t(`mode.${activePreset.timingMode}.description`)}
            </p>
          </div>

          {/* Timing Ranges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px'
          }}>
            <div style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '18px',
              opacity: activePreset.timingMode === 'custom' ? 1 : 0.5
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: theme.accent, fontSize: '12px', letterSpacing: '1px', fontWeight: 400 }}>
                {t('config.intenseSec')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <TimeInput
                  value={config.intenseMin}
                  onChange={(v) => updateActivePreset({ intenseMin: v, timingMode: 'custom' })}
                  label={t('config.min')}
                  isSeconds
                  disabled={activePreset.timingMode !== 'custom'}
                  theme={theme}
                />
                <TimeInput
                  value={config.intenseMax}
                  onChange={(v) => updateActivePreset({ intenseMax: v, timingMode: 'custom' })}
                  label={t('config.max')}
                  isSeconds
                  disabled={activePreset.timingMode !== 'custom'}
                  theme={theme}
                />
              </div>
            </div>

            <div style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '18px',
              opacity: activePreset.timingMode === 'custom' ? 1 : 0.5
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: theme.accent, fontSize: '12px', letterSpacing: '1px', fontWeight: 400 }}>
                {t('config.normalSec')}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <TimeInput
                  value={config.normalMin}
                  onChange={(v) => updateActivePreset({ normalMin: v, timingMode: 'custom' })}
                  label={t('config.min')}
                  isSeconds
                  disabled={activePreset.timingMode !== 'custom'}
                  theme={theme}
                />
                <TimeInput
                  value={config.normalMax}
                  onChange={(v) => updateActivePreset({ normalMax: v, timingMode: 'custom' })}
                  label={t('config.max')}
                  isSeconds
                  disabled={activePreset.timingMode !== 'custom'}
                  theme={theme}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: theme.accent, fontSize: '13px', letterSpacing: '2px', fontWeight: 400 }}>{t('config.options')}</h3>

            <div style={{ display: 'grid', gap: '4px' }}>
              <OptionToggle
                checked={activePreset.progressiveIntensity}
                onChange={() => updateActivePreset({ progressiveIntensity: !activePreset.progressiveIntensity })}
                label={t('config.progressiveIntensity')}
                description={t('config.progressiveDesc')}
                theme={theme}
              />
              <OptionToggle
                checked={activePreset.hideTimer}
                onChange={() => updateActivePreset({ hideTimer: !activePreset.hideTimer })}
                label={t('config.hideTimer')}
                description={t('config.hideTimerDesc')}
                theme={theme}
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingLeft: '34px',
                marginTop: '-4px',
                marginBottom: '6px',
                opacity: activePreset.hideTimer ? 1 : 0.4,
                transition: 'opacity 0.2s ease'
              }}>
                <span style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '11px',
                  color: theme.textDim,
                  letterSpacing: '1px',
                  flexShrink: 0
                }}>{t('config.hideEffect')}:</span>
                <div
                  onClick={!effectOpen ? () => setEffectOpen(true) : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '7px',
                    border: `1px solid ${effectOpen ? theme.border : theme.borderActive}`,
                    background: effectOpen ? 'transparent' : theme.surfaceHover,
                    padding: '1px',
                    cursor: effectOpen ? 'default' : 'pointer',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease, background 0.2s ease'
                  }}
                >
                  {['glitch', 'blackout'].map(mode => {
                    const selected = (activePreset.hideTimerMode || 'blackout') === mode;
                    const collapsed = !effectOpen && !selected;
                    return (
                      <button
                        key={mode}
                        onClick={effectOpen ? () => { updateActivePreset({ hideTimerMode: mode }); setEffectOpen(false); } : undefined}
                        style={{
                          padding: collapsed ? '4px 0' : '4px 11px',
                          maxWidth: collapsed ? '0' : '100px',
                          opacity: collapsed ? 0 : 1,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          fontSize: '11px',
                          fontFamily: "'Oswald', sans-serif",
                          letterSpacing: '1px',
                          background: effectOpen && selected ? theme.surfaceHover : 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          color: selected ? theme.text : theme.textDim,
                          cursor: 'pointer',
                          transition: 'max-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease, padding 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease'
                        }}
                      >
                        {t(`config.hideMode_${mode}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <OptionToggle
                checked={activePreset.hideNextSwitch}
                onChange={() => updateActivePreset({ hideNextSwitch: !activePreset.hideNextSwitch })}
                label={t('config.hideSwitch')}
                description={t('config.hideSwitchDesc')}
                theme={theme}
              />
            </div>
          </div>

          {/* Share */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <button onClick={shareConfig} style={{
              padding: '14px',
              fontSize: '14px',
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: '1px',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              color: theme.textDim,
              cursor: 'pointer'
            }}>
              {t('config.share')}
            </button>
            <button onClick={copyUrl} style={{
              padding: '14px',
              fontSize: '14px',
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: '1px',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              color: theme.textDim,
              cursor: 'pointer'
            }}>
              {t('config.copyUrl')}
            </button>
          </div>
        </div>

        {/* Start Button */}
        <button onClick={startTraining} style={{
          width: '100%',
          marginTop: '24px',
          padding: '20px',
          fontSize: '24px',
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: '6px',
          background: theme.accentSolid,
          border: 'none',
          borderRadius: '14px',
          color: theme.bg,
          cursor: 'pointer',
          boxShadow: `0 4px 24px ${theme.focusGlow}`
        }}>
          {t('config.startTraining')}
        </button>

        <p style={{
          textAlign: 'center',
          marginTop: '14px',
          fontSize: '13px',
          color: theme.textDim,
          fontFamily: "'Oswald', sans-serif"
        }}>
          {t('config.summary', {
            name: activePreset.name,
            rounds: config.rounds,
            duration: formatTimeShort(config.roundDuration),
            rest: formatTimeShort(config.restDuration)
          })}
          {config.warmupDuration > 0 && `, ${formatTimeShort(config.warmupDuration)} ${t('config.warmup').toLowerCase()}`}
          {config.cooldownDuration > 0 && `, ${formatTimeShort(config.cooldownDuration)} ${t('config.cooldown').toLowerCase()}`}
        </p>

        {!isStandalone && (
          <div style={{
            marginTop: '12px',
            position: 'relative'
          }}>
            {/* Card — always in flow for fixed height, morphs visually */}
            <div style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              padding: '16px 36px 16px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              position: 'relative',
              transform: installBannerFolded ? 'scale(0.82)' : 'scale(1)',
              opacity: installBannerFolded ? 0 : 1,
              transition: installBannerFolded
                ? 'transform 0.3s ease-out, opacity 0.2s ease'
                : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s, opacity 0.25s ease 0.1s',
              transformOrigin: 'center center',
              pointerEvents: installBannerFolded ? 'none' : 'auto'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: theme.text,
                  fontSize: '14px',
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 700,
                  marginBottom: '2px'
                }}>{t('install.bannerTitle')}</div>
                <div style={{
                  color: theme.textDim,
                  fontSize: '12px',
                  fontFamily: "'Oswald', sans-serif",
                  lineHeight: 1.4
                }}>{t('install.bannerDesc')}</div>
              </div>
              <button
                onClick={deferredInstallPrompt ? handleInstallClick : () => setShowHelp(true)}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: '1px',
                  fontWeight: 700,
                  background: theme.accentSolid,
                  border: 'none',
                  borderRadius: '8px',
                  color: theme.bg,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {deferredInstallPrompt ? t('install.installButton') : t('install.howTo')}
              </button>
              <button
                onClick={toggleInstallBanner}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: theme.textDim,
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                  lineHeight: 1
                }}
              >{'\u00D7'}</button>
            </div>
            {/* Folded: centered icon button — overlays the invisible card space */}
            <div
              onClick={installBannerFolded ? toggleInstallBanner : undefined}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: installBannerFolded ? 1 : 0,
                transform: installBannerFolded ? 'scale(1)' : 'scale(0.5)',
                transition: installBannerFolded
                  ? 'opacity 0.2s ease 0.12s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s'
                  : 'opacity 0.15s ease, transform 0.25s ease-out',
                pointerEvents: installBannerFolded ? 'auto' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '18px',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textDim} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigScreen;
