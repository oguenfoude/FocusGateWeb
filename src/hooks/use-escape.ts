'use client';

import { useEffect } from 'react';

/**
 * Calls the handler when the user presses Escape.
 * Used by modals to provide keyboard dismissal.
 */
export function useEscape(handler: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler, enabled]);
}
