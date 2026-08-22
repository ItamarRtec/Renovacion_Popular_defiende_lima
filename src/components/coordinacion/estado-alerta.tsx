"use client";

import { useEffect, useId, useRef, useState } from "react";

export function EstadoAlerta({ alertas }: { alertas: string[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (alertas.length === 0) {
    return (
      <span className="inline-flex items-center gap-2 text-muted">
        <span
          aria-hidden
          className="inline-block h-3.5 w-3.5 shrink-0 rounded-full bg-[#16a34a]"
        />
        Sin alertas
      </span>
    );
  }

  function toggle() {
    const button = buttonRef.current;
    if (!open && button) {
      const rect = button.getBoundingClientRect();
      const width = 256;
      setPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - width - 12),
      });
    }
    setOpen((value) => !value);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        aria-controls={dialogId}
        aria-expanded={open}
        className="inline-flex items-center gap-2 text-[#ef4444]"
        type="button"
        onClick={toggle}
      >
        <span
          aria-hidden
          className="inline-block h-3.5 w-3.5 shrink-0 rounded-full bg-[#ef4444]"
        />
        Alerta
      </button>
      {open ? (
        <div
          className="fixed z-50 w-64 rounded-[var(--radius-lg)] border border-border bg-[var(--surface)] p-3 shadow-lg"
          id={dialogId}
          role="dialog"
          style={{ top: pos.top, left: pos.left }}
        >
          <p className="text-xs uppercase tracking-wider text-muted">Alertas</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-[#0b2a36]">
            {alertas.map((alerta) => (
              <li key={alerta}>{alerta}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
