'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface BackendStatusContextType {
  isReady: boolean;
  isChecking: boolean;
  elapsedSeconds: number;
  showReadyToast: boolean;
  lastChecked: Date | null;
}

const BackendStatusContext = createContext<BackendStatusContextType>({
  isReady: true,
  isChecking: false,
  elapsedSeconds: 0,
  showReadyToast: false,
  lastChecked: null,
});

const BACKOFF_SCHEDULE = [0, 2000, 3000, 5000, 5000]; // Exponential backoff intervals in ms

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showReadyToast, setShowReadyToast] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const isMountedRef = useRef(true);
  const wasUnreadyRef = useRef(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    isMountedRef.current = true;

    // Timer tracking total elapsed seconds
    intervalIdRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    const checkHealth = async () => {
      if (!isMountedRef.current) return;

      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(`${apiHost}/health`, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
        });

        clearTimeout(timeoutId);

        if (response.ok && isMountedRef.current) {
          setLastChecked(new Date());
          setIsReady(true);
          setIsChecking(false);

          // If it was previously unready, trigger temporary ready toast
          if (wasUnreadyRef.current) {
            setShowReadyToast(true);
            setTimeout(() => {
              if (isMountedRef.current) {
                setShowReadyToast(false);
              }
            }, 3000);
          }
          return; // Stop polling immediately once ready!
        }
      } catch (err) {
        clearTimeout(timeoutId);
      }

      // If check failed or backend is still waking up:
      if (isMountedRef.current) {
        wasUnreadyRef.current = true;
        setLastChecked(new Date());
        setIsChecking(true);

        // Calculate next retry delay using exponential backoff
        const nextDelay =
          BACKOFF_SCHEDULE[Math.min(retryCountRef.current, BACKOFF_SCHEDULE.length - 1)];
        retryCountRef.current += 1;

        timeoutIdRef.current = setTimeout(checkHealth, nextDelay);
      }
    };

    checkHealth();

    return () => {
      isMountedRef.current = false;
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, []);

  return (
    <BackendStatusContext.Provider
      value={{
        isReady,
        isChecking,
        elapsedSeconds,
        showReadyToast,
        lastChecked,
      }}
    >
      {children}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}
