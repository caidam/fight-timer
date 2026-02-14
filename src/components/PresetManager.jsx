import React, { useState, useEffect, useRef, useCallback } from 'react';
import { THEMES } from '../constants/themes';
import { formatTimeShort } from '../utils/time';
import { useT } from '../i18n/I18nContext';

const PresetManager = ({ presets, activePresetId, onSelect, onAdd, onDelete, onRename, onReorder, theme }) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [animatingId, setAnimatingId] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const prevLength = useRef(presets.length);
  const confirmTimerRef = useRef(null);
  const { t } = useT();
  const th = theme || THEMES.mono.dark;

  // Drag state
  const [dragId, setDragId] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dropping, setDropping] = useState(false);
  const [noTransition, setNoTransition] = useState(false);
  const dragRef = useRef(null);
  const holdTimerRef = useRef(null);
  const dropTimerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const listRef = useRef(null);
  const dragIdRef = useRef(null);

  // Keep dragIdRef in sync for use in non-passive touch handler
  useEffect(() => { dragIdRef.current = dragId; }, [dragId]);

  // Detect newly added preset and trigger slide-in animation
  useEffect(() => {
    if (presets.length > prevLength.current) {
      const newPreset = presets[presets.length - 1];
      setAnimatingId(newPreset.id);
      const timer = setTimeout(() => setAnimatingId(null), 450);
      return () => clearTimeout(timer);
    }
    prevLength.current = presets.length;
  }, [presets.length]);

  const startEdit = (preset) => {
    setEditingId(preset.id);
    setEditName(preset.name);
  };

  const saveEdit = () => {
    if (editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const startDrag = useCallback((id) => {
    setDragId(id);
    setDragOffset(0);
    suppressClickRef.current = true;
  }, []);

  const handlePointerDown = useCallback((e, id) => {
    if (presets.length < 2) return;
    if (e.target.closest('button') || e.target.closest('input')) return;

    const row = e.currentTarget;
    const rect = row.getBoundingClientRect();
    const index = presets.findIndex(p => p.id === id);

    dragRef.current = {
      id,
      startY: e.clientY,
      startIndex: index,
      itemHeight: rect.height + 8
    };

    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      startDrag(id);
    }, 200);
  }, [presets, startDrag]);

  // Non-passive touchmove on the list container to selectively prevent scrolling
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const handleTouchMove = (e) => {
      // Active drag — always prevent scrolling
      if (dragIdRef.current !== null) {
        e.preventDefault();
        return;
      }
      // Hold detection phase — prevent scroll for small movements, allow for fast swipes
      if (holdTimerRef.current && dragRef.current) {
        const touch = e.touches[0];
        const dy = Math.abs(touch.clientY - dragRef.current.startY);
        if (dy > 8) {
          // Fast swipe — cancel hold, let browser scroll
          cancelHold();
          dragRef.current = null;
        } else {
          // Small movement — prevent scroll to keep touch undecided
          e.preventDefault();
        }
      }
    };

    list.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => list.removeEventListener('touchmove', handleTouchMove);
  }, [cancelHold]);

  // Document-level move/up during drag
  useEffect(() => {
    if (dragId === null && !holdTimerRef.current) return;

    const handleMove = (e) => {
      if (!dragRef.current) return;
      const dy = e.clientY - dragRef.current.startY;

      if (dragId === null) {
        if (Math.abs(dy) > 8) cancelHold();
        return;
      }

      e.preventDefault();
      setDragOffset(dy);
    };

    const handleUp = () => {
      cancelHold();
      if (dragId === null || !dragRef.current) {
        dragRef.current = null;
        return;
      }

      const d = dragRef.current;
      const rawIndex = d.startIndex + Math.round(dragOffset / d.itemHeight);
      const finalIndex = Math.max(0, Math.min(presets.length - 1, rawIndex));

      if (finalIndex === d.startIndex) {
        // No movement — just clean up
        setDragId(null);
        setDragOffset(0);
        dragRef.current = null;
        setTimeout(() => { suppressClickRef.current = false; }, 50);
        return;
      }

      // Step 1: Animate dragged item to its target slot
      setDropping(true);
      setDragOffset((finalIndex - d.startIndex) * d.itemHeight);

      const savedPresets = [...presets];
      const savedStartIndex = d.startIndex;

      // Step 2: After snap animation, commit reorder with transitions disabled
      dropTimerRef.current = setTimeout(() => {
        // Kill transitions so the DOM reorder + transform clear is invisible
        setNoTransition(true);

        const newPresets = [...savedPresets];
        const [moved] = newPresets.splice(savedStartIndex, 1);
        newPresets.splice(finalIndex, 0, moved);
        onReorder(newPresets);

        setDragId(null);
        setDragOffset(0);
        setDropping(false);
        dragRef.current = null;

        // Re-enable transitions next frame
        requestAnimationFrame(() => {
          setNoTransition(false);
        });

        setTimeout(() => { suppressClickRef.current = false; }, 50);
      }, 150);
    };

    document.addEventListener('pointermove', handleMove, { passive: false });
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);

    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleUp);
    };
  }, [dragId, dragOffset, presets, onReorder, cancelHold]);

  const handleRowClick = useCallback((e, id) => {
    if (suppressClickRef.current) return;
    if (e.target.closest('button') || e.target.closest('input')) return;
    onSelect(id);
  }, [onSelect]);

  useEffect(() => {
    const handleEarlyUp = () => {
      if (holdTimerRef.current) {
        cancelHold();
        dragRef.current = null;
      }
    };
    document.addEventListener('pointerup', handleEarlyUp);
    return () => document.removeEventListener('pointerup', handleEarlyUp);
  }, [cancelHold]);

  useEffect(() => () => {
    cancelHold();
    if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
  }, [cancelHold]);

  // Compute visual positions during drag
  const sourceIndex = dragRef.current?.startIndex ?? -1;
  const targetIndex = dragId !== null && dragRef.current
    ? Math.max(0, Math.min(presets.length - 1,
        dragRef.current.startIndex + Math.round(dragOffset / dragRef.current.itemHeight)))
    : -1;

  const getItemTransform = (index) => {
    if (dragId === null || !dragRef.current) return 'none';
    if (presets[index].id === dragId) {
      return dropping
        ? `translateY(${dragOffset}px)`
        : `translateY(${dragOffset}px) scale(1.02)`;
    }
    const ih = dragRef.current.itemHeight;
    if (sourceIndex < targetIndex) {
      if (index > sourceIndex && index <= targetIndex) return `translateY(${-ih}px)`;
    } else if (sourceIndex > targetIndex) {
      if (index >= targetIndex && index < sourceIndex) return `translateY(${ih}px)`;
    }
    return 'none';
  };

  const getTransition = (isDragging) => {
    if (noTransition) return 'none';
    if (isDragging && !dropping) return 'box-shadow 0.15s, opacity 0.15s';
    return 'transform 0.15s ease-out, box-shadow 0.15s, opacity 0.15s';
  };

  return (
    <div style={{
      background: th.surface,
      border: `1px solid ${th.border}`,
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <style>{`
        @keyframes presetGlow {
          0%, 100% { box-shadow: 0 0 4px 0 ${th.accentSolid}66; }
          50% { box-shadow: 0 0 10px 3px ${th.accentSolid}44; }
        }
        @keyframes deleteCircleExpand {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
          80% { opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        @keyframes presetSlideIn {
          0% { max-height: 0; opacity: 0; transform: translateY(-16px) scaleY(0.6); }
          60% { max-height: 80px; opacity: 0.8; transform: translateY(2px) scaleY(1.02); }
          100% { max-height: 80px; opacity: 1; transform: translateY(0) scaleY(1); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px'
      }}>
        <h3 style={{
          margin: 0,
          color: th.accent,
          fontSize: '13px',
          letterSpacing: '2px',
          fontWeight: 400
        }}>{t('presets.title')}</h3>
        <button onClick={onAdd} style={{
          background: th.surfaceHover,
          border: `1px solid ${th.border}`,
          borderRadius: '8px',
          color: th.textDim,
          padding: '6px 14px',
          fontSize: '13px',
          fontFamily: "'Oswald', sans-serif",
          cursor: 'pointer',
          letterSpacing: '1px'
        }}>{t('presets.add')}</button>
      </div>

      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {presets.map((preset, index) => {
          const isActive = activePresetId === preset.id;
          const isAnimating = animatingId === preset.id;
          const isDragging = dragId === preset.id;
          return (
          <div key={preset.id} data-preset-row
            onPointerDown={(e) => handlePointerDown(e, preset.id)}
            onClick={(e) => handleRowClick(e, preset.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: isActive ? th.surfaceHover : 'transparent',
              border: `1px solid ${isActive ? th.borderActive : th.border}`,
              borderRadius: '10px',
              cursor: isDragging ? 'grabbing' : 'pointer',
              overflow: 'hidden',
              transformOrigin: 'top',
              animation: isAnimating ? 'presetSlideIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
              transform: getItemTransform(index),
              transition: getTransition(isDragging),
              zIndex: isDragging ? 10 : 1,
              boxShadow: isDragging && !dropping ? `0 4px 16px rgba(0,0,0,0.2)` : 'none',
              opacity: isDragging && !dropping ? 0.92 : 1,
              position: 'relative',
              userSelect: 'none'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: `2px solid ${isActive ? th.accentSolid : th.inputBorder}`,
              background: isActive ? th.accentSolid : 'transparent',
              flexShrink: 0,
              animation: isActive ? 'presetGlow 2s ease infinite' : 'none'
            }} />

            {editingId === preset.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${th.focusBorder}`,
                  borderRadius: '4px',
                  color: th.text,
                  padding: '4px 8px',
                  fontSize: '15px',
                  fontFamily: "'Oswald', sans-serif"
                }}
              />
            ) : (
              <span style={{
                flex: 1,
                fontFamily: "'Oswald', sans-serif",
                fontSize: '15px',
                color: isActive ? th.text : th.textDim
              }}>
                {preset.name}
              </span>
            )}

            <span style={{
              fontSize: '12px',
              color: th.textDim,
              fontFamily: "'Oswald', sans-serif"
            }}>
              {preset.rounds}{'\u00D7'}{formatTimeShort(preset.roundDuration)}
            </span>

            <button onClick={(e) => { e.stopPropagation(); startEdit(preset); }} style={{
              background: 'none',
              border: 'none',
              color: th.textDim,
              cursor: 'pointer',
              padding: '4px',
              fontSize: '14px'
            }}>{'\u270E'}</button>

            {presets.length > 1 && (() => {
              const isConfirming = confirmingDeleteId === preset.id;
              return (
              <button onClick={(e) => {
                e.stopPropagation();
                if (isConfirming) {
                  if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
                  confirmTimerRef.current = null;
                  setConfirmingDeleteId(null);
                  onDelete(preset.id);
                } else {
                  setConfirmingDeleteId(preset.id);
                  if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
                  confirmTimerRef.current = setTimeout(() => {
                    setConfirmingDeleteId(null);
                    confirmTimerRef.current = null;
                  }, 3000);
                }
              }} style={{
                position: 'relative',
                overflow: 'hidden',
                background: 'none',
                border: 'none',
                color: isConfirming ? 'rgba(255,80,80,0.9)' : 'rgba(255,100,100,0.6)',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '14px',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'color 0.2s ease'
              }}>
                {isConfirming && <span style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255,80,80,0.35)',
                  boxShadow: '0 0 6px rgba(255,80,80,0.3)',
                  animation: 'deleteCircleExpand 3s ease-out forwards',
                  pointerEvents: 'none'
                }} />}
                {'\u2715'}
              </button>
              );
            })()}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default PresetManager;
