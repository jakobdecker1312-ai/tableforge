"use client";

import { useEffect, useState } from "react";

/** useState, das sich im localStorage dieses Browsers merkt (privat, nur auf diesem Gerät). */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // localStorage nicht verfügbar – ignorieren
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [key, value]);

  return [value, setValue] as const;
}
