"use client";

import { useEffect, useState } from "react";

/** Zahlenfeld, das erst beim Verlassen (oder mit Enter) speichert. */
export function NumberInput({
  value,
  onCommit,
  min = -999,
  max = 999,
  disabled,
  className = "",
  ariaLabel,
  placeholder,
}: {
  value: number | undefined;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));

  useEffect(() => {
    setDraft(value === undefined ? "" : String(value));
  }, [value]);

  function commit() {
    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      setDraft(value === undefined ? "" : String(value));
      return;
    }
    const next = Math.min(max, Math.max(min, parsed));
    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={`field ${className}`}
    />
  );
}

/** Textfeld, das erst beim Verlassen (oder mit Enter) speichert. */
export function TextInput({
  value,
  onCommit,
  disabled,
  className = "",
  placeholder,
  ariaLabel,
  maxLength = 80,
}: {
  value: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    if (draft !== value) onCommit(draft);
  }

  return (
    <input
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      maxLength={maxLength}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={`field ${className}`}
    />
  );
}

/** Mehrzeiliges Textfeld, speichert beim Verlassen. */
export function TextArea({
  value,
  onCommit,
  disabled,
  className = "",
  placeholder,
  ariaLabel,
  rows = 5,
}: {
  value: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  rows?: number;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <textarea
      value={draft}
      rows={rows}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      maxLength={4000}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      className={`field resize-y ${className}`}
    />
  );
}
