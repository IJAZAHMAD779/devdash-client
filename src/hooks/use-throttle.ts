"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * Custom hook to throttle expensive repeated callback events (e.g. window resize, scroll, fast keybinds).
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  limit: number = 250
): (...args: Parameters<T>) => void {
  const lastRun = useRef<number>(Date.now());
  const timer = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= limit) {
        callbackRef.current(...args);
        lastRun.current = now;
      } else {
        if (timer.current) {
          clearTimeout(timer.current);
        }
        timer.current = setTimeout(() => {
          callbackRef.current(...args);
          lastRun.current = Date.now();
        }, limit - (now - lastRun.current));
      }
    },
    [limit]
  );
}
