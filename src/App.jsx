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
  const themePickerRef = useRef(null);
  const langPickerRef = useRef(null);
  const [hideSwitchLive, setHideSwitchLive] = useState(false);
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
    totalNormalTime: 0
  });

  const intervalRef = useRef(null);
  const timerStateRef = useRef(timerState);
  timerStateRef.current = timerState;
  const containerRef = useRef(null);

  const activePreset = presets.find(p => p.id === activePresetId) || presets[0];
  const config = useMemo(() => applyTimingMode(activePreset), [presets, activePresetId]);

  // Load state from URL on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decoded = decodeStateCompact(hash);
      if (decoded && decoded.presets && decoded.presets.length > 0) {
        setPresets(decoded.presets);
        setActivePresetId(decoded.activePresetId || decoded.presets[0].id);
        if (decoded.themeInfo) {
          setThemeId(decoded.themeInfo.themeId);
          setThemeMode(decoded.themeInfo.themeMode);
          localStorage.setItem('fight-timer-theme', decoded.themeInfo.themeId);
          localStorage.setItem('fight-timer-mode', decoded.themeInfo.themeMode);
        }
        return;
      }
    }
    setActivePresetId(presets[0].id);
  }, []);

  // Update URL when presets or theme change
  useEffect(() => {
    if (activePresetId) {
      const encoded = encodeStateCompact(presets, activePresetId);
      window.history.replaceState(null, '', `#${encoded}@${themeId}.${themeMode}`);
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

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.bg;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.bg);
  }, [theme]);

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
      totalNormalTime: 0
    });
    setScreen('training');
    setHideSwitchLive(config.hideNextSwitch);
    setTimeout(() => sounds.roundStart(), 100);
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

      if (prev.timeRemaining <= 1) {
        if (prev.isResting) {
          if (prev.currentRound >= config.rounds) {
            sounds.finalEnd();
            releaseWakeLock();
            setTimeout(() => setScreen('summary'), 500);
            setTimerState({ ...prev, isRunning: false, timeRemaining: 0 });
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
            releaseWakeLock();
            setTimeout(() => setScreen('summary'), 500);
            setTimerState({ ...prev, isRunning: false, timeRemaining: 0, isResting: false });
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
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;700&display=swap');
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
      />
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
      toggleFullscreen={toggleFullscreen}
      togglePause={togglePause}
      stopTraining={stopTraining}
    />
  );
}
