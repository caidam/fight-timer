import React from 'react';
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
  globalStyles
}) => {
  const { t } = useT();

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <LanguagePicker
              theme={theme}
              showLangPicker={showLangPicker}
              setShowLangPicker={setShowLangPicker}
              langPickerRef={langPickerRef}
            />
            <button onClick={() => setShowHelp(true)} style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              color: theme.textDim,
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: "'Oswald', sans-serif",
              padding: 0,
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
                checked={activePreset.hideNextSwitch}
                onChange={() => updateActivePreset({ hideNextSwitch: !activePreset.hideNextSwitch })}
                label={t('config.hideCountdown')}
                description={t('config.hideCountdownDesc')}
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
      </div>
    </div>
  );
};

export default ConfigScreen;
