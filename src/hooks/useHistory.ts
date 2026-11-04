import { useState, useCallback, useEffect, useRef } from 'react';

export interface HistoryHook<T> {
  state: T;
  set: (action: T | ((prev: T) => T), recordHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export function useHistory<T>(initialPresent: T, maxHistory: number = 50): HistoryHook<T> {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialPresent);
  const [future, setFuture] = useState<T[]>([]);

  // Ref tracks the latest value synchronously between queued updates.
  const presentRef = useRef<T>(initialPresent);
  useEffect(() => {
    presentRef.current = present;
  }, [present]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);
      const current = presentRef.current;

      setFuture((prevFuture) => [current, ...prevFuture]);
      presentRef.current = previous;
      setPresent(previous);
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);
      const current = presentRef.current;

      setPast((prevPast) => [...prevPast, current]);
      presentRef.current = next;
      setPresent(next);
      return newFuture;
    });
  }, []);

  const set = useCallback(
    (action: T | ((prev: T) => T), recordHistory: boolean = true) => {
      const newPresent = typeof action === 'function' ? (action as (prev: T) => T)(presentRef.current) : action;

      if (recordHistory) {
        setPast((prevPast) => {
          const updated = [...prevPast, presentRef.current];
          if (updated.length > maxHistory) {
            return updated.slice(updated.length - maxHistory);
          }
          return updated;
        });
        setFuture([]);
      }

      presentRef.current = newPresent;
      setPresent(newPresent);
    },
    [maxHistory]
  );

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    state: present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}
