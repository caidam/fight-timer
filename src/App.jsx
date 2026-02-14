import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getAudioContext, sounds } from './utils/audio';
import { formatTimeShort, getRandomInRange } from './utils/time';
import { TIMING_MODES } from './constants/timingModes';
import { THEMES } from './constants/themes';
import { createDefaultPreset, applyTimingMode, getProgressiveTimings } from './utils/presets';
import { encodeStateCompact, decodeStateCompact } from './utils/url';
import { useT } from './i18n/I18nContext';
import ConfigScreen from './components/ConfigScreen';
import TrainingScreen from './components/TrainingScreen';
import SummaryScreen from './components/SummaryScreen';

export default function App() {
  const { t } = useT();
  const [screen, setScreen] = useState('config');
  const [presets, setPresets] = useState([createDefaultPreset('Muay Thai 3x3')]);
  const [activePresetId, setActivePresetId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [selectedImportIds, setSelectedImportIds] = useState({});
  const themePickerRef = useRef(null);
  const langPickerRef = useRef(null);
  const [hideSwitchLive, setHideSwitchLive] = useState(false);
  const [hideTimerLive, setHideTimerLive] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installBannerFolded, setInstallBannerFolded] = useState(() => {
    return localStorage.getItem('fight-timer-install-folded') === 'true';
  });
  const [themeId, setThemeId] = useState(() => {
    const stored = localStorage.getItem('fight-timer-theme');
    return (stored && THEMES[stored]) ? stored : 'gold';
  });
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('fight-timer-mode') || 'dark');
  const theme = THEMES[themeId][themeMode];

  const [timerState, setTimerState] = useState({
    currentRound: 1,
    timeRemaining: 0,
    isResting: false,
    isRunning: false,
    intensity: 'normal',
    nextSwitch: 0,
    switchTarget: 0,
    warningPlayed: false,
    totalIntenseTime: 0,
    totalNormalTime: 0,
    phase: 'training'
  });

  const intervalRef = useRef(null);
  const timerStateRef = useRef(timerState);
  timerStateRef.current = timerState;
  const containerRef = useRef(null);

  const activePreset = presets.find(p => p.id === activePresetId) || presets[0];
  const config = useMemo(() => applyTimingMode(activePreset), [presets, activePresetId]);

  // Process URL hash: show import dialog if foreign, or load directly if no saved presets
  const processHash = useCallback((hash, existingPresets) => {
    const decoded = decodeStateCompact(hash);
    if (!decoded || !decoded.presets || decoded.presets.length === 0) return null;

    if (existingPresets && existingPresets.length > 0) {
      const hasForeign = decoded.presets.some(sp =>
        !existingPresets.some(ep => presetsMatch(sp, ep))
      );
      if (!hasForeign) return null;

      const sel = {};
      decoded.presets.forEach(sp => {
        if (!existingPresets.some(ep => presetsMatch(sp, ep))) {
          sel[sp.id] = true;
        }
      });
      setSelectedImportIds(sel);
      setPendingImport(decoded);
      return 'import';
    }

    // No existing presets — load directly
    setPresets(decoded.presets);
    setActivePresetId(decoded.activePresetId || decoded.presets[0].id);
    return 'loaded';
  }, []);

  // Load state from URL on mount, fall back to localStorage (for PWA launches)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      let savedData = null;
      try {
        const saved = localStorage.getItem('fight-timer-presets');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.presets) && parsed.presets.length > 0) {
            savedData = parsed;
          }
        }
      } catch {}

      if (savedData) {
        setPresets(savedData.presets);
        setActivePresetId(savedData.activePresetId || savedData.presets[0].id);
      }

      const result = processHash(hash, savedData?.presets);
      if (result || savedData) return;
    }
    // No URL hash — try localStorage (PWA / direct visit)
    try {
      const saved = localStorage.getItem('fight-timer-presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.presets) && parsed.presets.length > 0) {
          setPresets(parsed.presets);
          setActivePresetId(parsed.activePresetId || parsed.presets[0].id);
          return;
        }
      }
    } catch {}
    setActivePresetId(presets[0].id);
  }, []);

  // Listen for hash changes to detect shared URLs opened in the same tab
  useEffect(() => {
    const handleHashChange = () => {
      if (pendingImport) return;
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      processHash(hash, presets);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [presets, pendingImport, processHash]);

  // Update URL and localStorage when presets or theme change
  useEffect(() => {
    if (activePresetId) {
      const encoded = encodeStateCompact(presets, activePresetId);
      window.history.replaceState(null, '', `#${encoded}@${themeId}.${themeMode}`);
      localStorage.setItem('fight-timer-presets', JSON.stringify({ presets, activePresetId }));
    }
  }, [presets, activePresetId, themeId, themeMode]);

  const updateActivePreset = (updates) => {
    setPresets(prev => prev.map(p =>
      p.id === activePresetId ? { ...p, ...updates } : p
    ));
  };

  const setTimingMode = (mode) => {
    if (mode === 'custom') {
      updateActivePreset({ timingMode: mode });
    } else {
      const timings = TIMING_MODES[mode].getTimings(activePreset.roundDuration);
      updateActivePreset({ timingMode: mode, ...timings });
    }
  };

  const setRoundDuration = (duration) => {
    if (activePreset.timingMode !== 'custom') {
      const timings = TIMING_MODES[activePreset.timingMode].getTimings(duration);
      updateActivePreset({ roundDuration: duration, ...timings });
    } else {
      updateActivePreset({ roundDuration: duration });
    }
  };

  const addPreset = () => {
    const newPreset = createDefaultPreset(`${t('presets.defaultName')} ${presets.length + 1}`);
    setPresets(prev => [...prev, newPreset]);
    setActivePresetId(newPreset.id);
  };

  const deletePreset = (id) => {
    if (presets.length <= 1) return;
    setPresets(prev => prev.filter(p => p.id !== id));
    if (activePresetId === id) {
      setActivePresetId(presets.find(p => p.id !== id)?.id);
    }
  };

  const renamePreset = (id, name) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const reorderPresets = (newPresets) => {
    setPresets(newPresets);
  };

  const presetsMatch = (a, b) => {
    const normalize = (p) => {
      if (p.timingMode === 'custom') return p;
      const mode = TIMING_MODES[p.timingMode];
      const timings = mode?.getTimings(p.roundDuration);
      return timings ? { ...p, ...timings } : p;
    };
    const na = normalize(a), nb = normalize(b);
    return Number(na.rounds) === Number(nb.rounds) &&
      na.roundDuration === nb.roundDuration &&
      na.restDuration === nb.restDuration &&
      na.warmupDuration === nb.warmupDuration &&
      na.cooldownDuration === nb.cooldownDuration &&
      na.timingMode === nb.timingMode &&
      na.intenseMin === nb.intenseMin &&
      na.intenseMax === nb.intenseMax &&
      na.normalMin === nb.normalMin &&
      na.normalMax === nb.normalMax &&
      na.progressiveIntensity === nb.progressiveIntensity &&
      na.hideNextSwitch === nb.hideNextSwitch &&
      na.hideTimer === nb.hideTimer;
  };

  const toggleImportSelection = (id) => {
    setSelectedImportIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const restoreUserHash = () => {
    const encoded = encodeStateCompact(presets, activePresetId);
    window.history.replaceState(null, '', `#${encoded}@${themeId}.${themeMode}`);
  };

  const handleImport = (action) => {
    if (!pendingImport) return;
    if (action === 'replace') {
      const imported = pendingImport.presets;
      setPresets(imported);
      setActivePresetId(imported[0].id);
      if (pendingImport.themeInfo) {
        setThemeId(pendingImport.themeInfo.themeId);
        setThemeMode(pendingImport.themeInfo.themeMode);
        localStorage.setItem('fight-timer-theme', pendingImport.themeInfo.themeId);
        localStorage.setItem('fight-timer-mode', pendingImport.themeInfo.themeMode);
      }
    } else if (action === 'add') {
      const toAdd = pendingImport.presets.filter(p => selectedImportIds[p.id]);
      if (toAdd.length > 0) {
        setPresets(prev => {
          const usedNames = new Set(prev.map(p => p.name));
          const renamed = toAdd.map(p => {
            if (!usedNames.has(p.name)) {
              usedNames.add(p.name);
              return p;
            }
            let i = 2;
            while (usedNames.has(`${p.name} (${i})`)) i++;
            const newName = `${p.name} (${i})`;
            usedNames.add(newName);
            return { ...p, name: newName };
          });
          return [...prev, ...renamed];
        });
      } else {
        restoreUserHash();
      }
    } else {
      // ignore
      restoreUserHash();
    }
    setPendingImport(null);
    setSelectedImportIds({});
  };

  // Wake lock
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        lock.addEventListener('release', () => setWakeLock(null));
      } catch (err) {
        console.log('Wake lock failed:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }
  };

  // Fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen?.() ||
              containerRef.current?.webkitRequestFullscreen?.();
        setIsFullscreen(true);
      } catch (err) {
        console.log('Fullscreen failed:', err);
      }
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Re-acquire wake lock on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && screen === 'training' && timerState.isRunning) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [screen, timerState.isRunning]);

  // Theme
  const changeTheme = (id) => {
    setThemeId(id);
    localStorage.setItem('fight-timer-theme', id);
  };

  const toggleMode = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    localStorage.setItem('fight-timer-mode', next);
  };

  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  const toggleInstallBanner = () => {
    setInstallBannerFolded(prev => {
      const next = !prev;
      localStorage.setItem('fight-timer-install-folded', String(next));
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.bg;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.bg);
  }, [theme]);

  // PWA install prompt detection
  useEffect(() => {
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    setIsStandalone(standaloneQuery.matches || navigator.standalone === true);

    const handleDisplayChange = (e) => setIsStandalone(e.matches);
    standaloneQuery.addEventListener('change', handleDisplayChange);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      standaloneQuery.removeEventListener('change', handleDisplayChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Close theme picker on outside click
  useEffect(() => {
    if (!showThemePicker) return;
    const handleClick = (e) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target)) {
        setShowThemePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showThemePicker]);

  // Close language picker on outside click
  useEffect(() => {
    if (!showLangPicker) return;
    const handleClick = (e) => {
      if (langPickerRef.current && !langPickerRef.current.contains(e.target)) {
        setShowLangPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showLangPicker]);

  // Share
  const shareConfig = async () => {
    const url = window.location.href;
    const shareData = {
      title: t('share.title'),
      text: t('share.text', { name: activePreset.name }),
      url: url
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      prompt(t('share.savePrompt'), url);
    }
  };

  const copyUrl = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      prompt(t('share.copyPrompt'), url);
    }
  };

  // Timer logic
  const calculatePeriodDuration = useCallback((intensity, currentRound) => {
    const timings = getProgressiveTimings(config, currentRound);
    if (intensity === 'intense') {
      return getRandomInRange(timings.intenseMin, timings.intenseMax);
    }
    return getRandomInRange(timings.normalMin, timings.normalMax);
  }, [config]);

  const startTraining = async () => {
    const audioContext = getAudioContext();
    if (audioContext?.state === 'suspended') {
      await audioContext.resume();
    }
    await requestWakeLock();

    if (config.warmupDuration > 0) {
      setTimerState({
        currentRound: 1,
        timeRemaining: config.warmupDuration,
        isResting: false,
        isRunning: true,
        intensity: 'warmup',
        nextSwitch: 0,
        switchTarget: 0,
        warningPlayed: false,
        totalIntenseTime: 0,
        totalNormalTime: 0,
        phase: 'warmup'
      });
    } else {
      const initialDuration = calculatePeriodDuration('normal', 1);
      setTimerState({
        currentRound: 1,
        timeRemaining: config.roundDuration,
        isResting: false,
        isRunning: true,
        intensity: 'normal',
        nextSwitch: initialDuration,
        switchTarget: Math.max(1, config.roundDuration - initialDuration),
        warningPlayed: false,
        totalIntenseTime: 0,
        totalNormalTime: 0,
        phase: 'training'
      });
      setTimeout(() => sounds.roundStart(), 100);
    }
    setScreen('training');
    setHideSwitchLive(config.hideNextSwitch);
    setHideTimerLive(config.hideTimer);
  };

  const togglePause = () => {
    setTimerState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const stopTraining = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    releaseWakeLock();
    if (document.fullscreenElement) document.exitFullscreen?.();
    setScreen('config');
  };

  // Timer tick
  useEffect(() => {
    if (!timerState.isRunning || screen !== 'training') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const prev = timerStateRef.current;

      // Warmup tick
      if (prev.phase === 'warmup') {
        if (prev.timeRemaining <= 1) {
          const initialDuration = calculatePeriodDuration('normal', 1);
          sounds.roundStart();
          setTimerState({
            ...prev,
            phase: 'training',
            timeRemaining: config.roundDuration,
            intensity: 'normal',
            nextSwitch: initialDuration,
            switchTarget: Math.max(1, config.roundDuration - initialDuration)
          });
        } else {
          setTimerState({ ...prev, timeRemaining: prev.timeRemaining - 1 });
        }
        return;
      }

      // Cooldown tick
      if (prev.phase === 'cooldown') {
        if (prev.timeRemaining <= 1) {
          sounds.finalEnd();
          releaseWakeLock();
          setTimeout(() => setScreen('summary'), 500);
          setTimerState({ ...prev, isRunning: false, timeRemaining: 0 });
        } else {
          setTimerState({ ...prev, timeRemaining: prev.timeRemaining - 1 });
        }
        return;
      }

      if (prev.timeRemaining <= 1) {
        if (prev.isResting) {
          if (prev.currentRound >= config.rounds) {
            if (config.cooldownDuration > 0) {
              setTimerState({ ...prev, phase: 'cooldown', timeRemaining: config.cooldownDuration, isResting: false, intensity: 'cooldown' });
            } else {
              sounds.finalEnd();
              releaseWakeLock();
              setTimeout(() => setScreen('summary'), 500);
              setTimerState({ ...prev, isRunning: false, timeRemaining: 0 });
            }
            return;
          }
          const newDuration = calculatePeriodDuration('normal', prev.currentRound + 1);
          sounds.roundStart();
          setTimerState({
            ...prev,
            currentRound: prev.currentRound + 1,
            timeRemaining: config.roundDuration,
            isResting: false,
            intensity: 'normal',
            nextSwitch: newDuration,
            switchTarget: Math.max(1, config.roundDuration - newDuration),
            warningPlayed: false
          });
          return;
        } else {
          sounds.roundEnd();
          if (prev.currentRound >= config.rounds) {
            if (config.cooldownDuration > 0) {
              setTimerState({ ...prev, phase: 'cooldown', timeRemaining: config.cooldownDuration, isResting: false, intensity: 'cooldown' });
            } else {
              releaseWakeLock();
              setTimeout(() => setScreen('summary'), 500);
              setTimerState({ ...prev, isRunning: false, timeRemaining: 0, isResting: false });
            }
            return;
          }
          setTimerState({
            ...prev,
            timeRemaining: config.restDuration,
            isResting: true,
            intensity: 'rest',
            warningPlayed: false
          });
          return;
        }
      }

      const newTime = prev.timeRemaining - 1;
      let newState = { ...prev, timeRemaining: newTime };

      if (!prev.isResting) {
        if (newTime <= prev.switchTarget && prev.switchTarget > 0) {
          const newIntensity = prev.intensity === 'intense' ? 'normal' : 'intense';
          const nextDuration = calculatePeriodDuration(newIntensity, prev.currentRound);
          sounds[newIntensity === 'intense' ? 'intense' : 'normal']();
          newState.intensity = newIntensity;
          newState.nextSwitch = nextDuration;
          newState.switchTarget = Math.max(1, newTime - nextDuration);
          newState.warningPlayed = false;
        }
        if (newState.intensity === 'intense') {
          newState.totalIntenseTime = prev.totalIntenseTime + 1;
        } else if (newState.intensity === 'normal') {
          newState.totalNormalTime = prev.totalNormalTime + 1;
        }
      }

      setTimerState(newState);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState.isRunning, screen, config, calculatePeriodDuration]);

  const globalStyles = useMemo(() => `
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body {
      touch-action: manipulation;
      -webkit-user-select: none;
      user-select: none;
      overscroll-behavior: none;
    }
    input { -webkit-user-select: text; user-select: text; }
    input:focus {
      outline: none;
      border-color: ${theme.focusBorder} !important;
      box-shadow: 0 0 0 3px ${theme.focusGlow};
    }
  `, [theme]);

  if (screen === 'config') {
    return (
      <>
        <ConfigScreen
          containerRef={containerRef}
          theme={theme}
          themeId={themeId}
          themeMode={themeMode}
          showThemePicker={showThemePicker}
          setShowThemePicker={setShowThemePicker}
          themePickerRef={themePickerRef}
          changeTheme={changeTheme}
          toggleMode={toggleMode}
          showHelp={showHelp}
          setShowHelp={setShowHelp}
          shareToast={shareToast}
          presets={presets}
          activePresetId={activePresetId}
          setActivePresetId={setActivePresetId}
          addPreset={addPreset}
          deletePreset={deletePreset}
          renamePreset={renamePreset}
          reorderPresets={reorderPresets}
          activePreset={activePreset}
          config={config}
          updateActivePreset={updateActivePreset}
          setTimingMode={setTimingMode}
          setRoundDuration={setRoundDuration}
          startTraining={startTraining}
          shareConfig={shareConfig}
          showLangPicker={showLangPicker}
          setShowLangPicker={setShowLangPicker}
          langPickerRef={langPickerRef}
          copyUrl={copyUrl}
          globalStyles={globalStyles}
          deferredInstallPrompt={deferredInstallPrompt}
          isStandalone={isStandalone}
          installBannerFolded={installBannerFolded}
          handleInstallClick={handleInstallClick}
          toggleInstallBanner={toggleInstallBanner}
        />
        {pendingImport && (() => {
          const dupIds = new Set(
            pendingImport.presets
              .filter(sp => presets.some(ep => presetsMatch(sp, ep)))
              .map(sp => sp.id)
          );
          const selCount = Object.keys(selectedImportIds).filter(id => selectedImportIds[id] && !dupIds.has(id)).length;
          const allDups = dupIds.size === pendingImport.presets.length;

          return (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '24px'
            }}>
              <div style={{
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '360px',
                width: '100%'
              }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  color: theme.accent,
                  fontSize: '13px',
                  letterSpacing: '2px',
                  fontWeight: 400,
                  fontFamily: "'Bebas Neue', sans-serif"
                }}>{t('import.title')}</h3>
                <p style={{
                  margin: '0 0 12px 0',
                  color: theme.text,
                  fontSize: '14px',
                  fontFamily: "'Oswald', sans-serif",
                  lineHeight: 1.5
                }}>{t('import.description')}</p>
                <div style={{
                  margin: '0 0 20px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  {pendingImport.presets.map(p => {
                    const isDup = dupIds.has(p.id);
                    const isSelected = !isDup && selectedImportIds[p.id];
                    return (
                      <div
                        key={p.id}
                        onClick={() => !isDup && toggleImportSelection(p.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: isSelected ? theme.surfaceHover : 'transparent',
                          opacity: isDup ? 0.4 : 1,
                          cursor: isDup ? 'default' : 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: `1.5px solid ${isSelected ? theme.accentSolid : theme.border}`,
                          background: isSelected ? theme.accentSolid : 'transparent',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          {isSelected && <span style={{ color: theme.bg, fontSize: '10px', fontWeight: 700 }}>{'\u2713'}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ color: theme.text, fontSize: '14px', fontFamily: "'Oswald', sans-serif" }}>
                            {p.name}
                          </span>
                          <span style={{ color: theme.textDim, fontSize: '14px', fontFamily: "'Oswald', sans-serif" }}>
                            {' '}({p.rounds}&times;{formatTimeShort(p.roundDuration)})
                          </span>
                        </div>
                        {isDup && (
                          <span style={{ color: theme.textDim, fontSize: '11px', fontFamily: "'Oswald', sans-serif", letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                            {t('import.existing')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {allDups && (
                  <p style={{
                    color: theme.textDim,
                    fontSize: '13px',
                    fontFamily: "'Oswald', sans-serif",
                    margin: '0 0 16px 0',
                    lineHeight: 1.5
                  }}>{t('import.allExist')}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!allDups && (
                    <button onClick={() => handleImport('add')} disabled={selCount === 0} style={{
                      padding: '12px',
                      fontSize: '14px',
                      fontFamily: "'Oswald', sans-serif",
                      letterSpacing: '1px',
                      background: selCount > 0 ? theme.accentSolid : theme.surface,
                      border: 'none',
                      borderRadius: '10px',
                      color: selCount > 0 ? theme.bg : theme.textDim,
                      cursor: selCount > 0 ? 'pointer' : 'default',
                      opacity: selCount > 0 ? 1 : 0.5
                    }}>{t('import.addCount', { count: selCount })}</button>
                  )}
                  {!allDups && (
                    <button onClick={() => handleImport('replace')} style={{
                      padding: '12px',
                      fontSize: '14px',
                      fontFamily: "'Oswald', sans-serif",
                      letterSpacing: '1px',
                      background: 'transparent',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                      color: theme.textDim,
                      cursor: 'pointer'
                    }}>{t('import.replaceAll')}</button>
                  )}
                  <button onClick={() => handleImport('ignore')} style={{
                    padding: '12px',
                    fontSize: '14px',
                    fontFamily: "'Oswald', sans-serif",
                    letterSpacing: '1px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    color: theme.textDim,
                    cursor: 'pointer'
                  }}>{t('import.ignore')}</button>
                </div>
              </div>
            </div>
          );
        })()}
      </>
    );
  }

  if (screen === 'summary') {
    return (
      <SummaryScreen
        containerRef={containerRef}
        timerState={timerState}
        theme={theme}
        globalStyles={globalStyles}
        onTrainAgain={() => setScreen('config')}
      />
    );
  }

  return (
    <TrainingScreen
      containerRef={containerRef}
      timerState={timerState}
      config={config}
      globalStyles={globalStyles}
      isFullscreen={isFullscreen}
      hideSwitchLive={hideSwitchLive}
      setHideSwitchLive={setHideSwitchLive}
      hideTimerLive={hideTimerLive}
      setHideTimerLive={setHideTimerLive}
      toggleFullscreen={toggleFullscreen}
      togglePause={togglePause}
      stopTraining={stopTraining}
      phase={timerState.phase}
    />
  );
}
