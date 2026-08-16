"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useId, useRef, useState, useTransition } from "react";

type CheckInResult = {
  ok: boolean;
  already: boolean;
  asistencia: {
    llegada_at: string;
    metodo: string;
  };
  personero: {
    nombres: string;
    apellidos: string;
    dni: string;
    numero_mesa: string | null;
    centro_votacion: string | null;
    distrito: string | null;
  };
};

type TeamPersonero = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  numero_mesa: string | null;
};

type CheckInScannerProps = {
  team: TeamPersonero[];
  eventoId?: string;
  eventoNombre?: string;
};

function formatHora(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function CheckInScanner({
  team,
  eventoId,
  eventoNombre,
}: CheckInScannerProps) {
  const scannerDomId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [dni, setDni] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop().catch(() => undefined);
        s.clear();
      }
    };
  }, []);

  async function postCheckIn(body: {
    token?: string;
    registroId?: string;
    metodo: "qr" | "manual";
  }) {
    setError(null);
    const res = await fetch("/api/asistencia/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        ...(eventoId ? { eventoId } : {}),
      }),
    });
    const data = (await res.json()) as CheckInResult & { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "No se pudo registrar.");
    }
    setResult(data);
  }

  async function onScanSuccess(decoded: string) {
    if (handlingRef.current) return;
    handlingRef.current = true;
    try {
      await stopCamera();
      await postCheckIn({ token: decoded.trim(), metodo: "qr" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar.");
    } finally {
      handlingRef.current = false;
    }
  }

  async function startCamera() {
    setCameraError(null);
    setError(null);
    setResult(null);
    try {
      const scanner = new Html5Qrcode(scannerDomId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (text) => {
          void onScanSuccess(text);
        },
        () => undefined,
      );
      setScanning(true);
    } catch {
      setCameraError(
        "No se pudo abrir la cámara. Usa el ingreso manual por DNI.",
      );
      setScanning(false);
      scannerRef.current = null;
    }
  }

  async function stopCamera() {
    const s = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!s) return;
    try {
      await s.stop();
      s.clear();
    } catch {
      // ignore
    }
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const digits = dni.replace(/\D/g, "");
    const match = team.find((p) => p.dni === digits);
    if (!match) {
      setError("No hay personero con ese DNI en tu equipo.");
      return;
    }
    startTransition(async () => {
      try {
        setResult(null);
        await stopCamera();
        await postCheckIn({ registroId: match.id, metodo: "manual" });
        setDni("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al registrar.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="dl-kicker">Asistencia</p>
      <h1 className="dl-title mt-3 text-3xl">Registrar llegada</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {eventoNombre
          ? `Escanea el QR o marca el DNI para “${eventoNombre}”.`
          : "Escanea el QR del personero o marca llegada por DNI."}{" "}
        Queda la hora exacta.
      </p>

      {result ? (
        <div className="dl-panel mt-8 px-5 py-5 text-left">
          <p className="text-xs uppercase tracking-wider text-muted">
            {result.already ? "Ya estaba registrado" : "Asistencia OK"}
          </p>
          <p className="mt-2 text-lg font-medium text-[#0b2a36]">
            {result.personero.apellidos}, {result.personero.nombres}
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">DNI</dt>
              <dd className="font-[family-name:var(--font-data)] tabular-nums">
                {result.personero.dni}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Mesa</dt>
              <dd className="font-[family-name:var(--font-data)] tabular-nums text-[#1077A1]">
                {result.personero.numero_mesa?.trim() || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Llegada</dt>
              <dd className="tabular-nums">
                {formatHora(result.asistencia.llegada_at)}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            className="dl-btn dl-btn-primary mt-6 w-full"
            onClick={() => {
              setResult(null);
              setError(null);
            }}
          >
            Escanear otro
          </button>
        </div>
      ) : (
        <>
          <div className="dl-panel mt-8 overflow-hidden px-3 py-3">
            <div
              id={scannerDomId}
              className="mx-auto min-h-[220px] overflow-hidden rounded-lg bg-[#0b2a36]/6"
            />
            <div className="mt-3 flex gap-2">
              {scanning ? (
                <button
                  type="button"
                  className="dl-btn dl-btn-secondary w-full"
                  onClick={() => void stopCamera()}
                >
                  Detener cámara
                </button>
              ) : (
                <button
                  type="button"
                  className="dl-btn dl-btn-primary w-full"
                  onClick={() => void startCamera()}
                >
                  Abrir cámara
                </button>
              )}
            </div>
            {cameraError ? (
              <p className="mt-3 text-sm text-[#ef4444]">{cameraError}</p>
            ) : null}
          </div>

          <form onSubmit={submitManual} className="dl-panel mt-4 px-5 py-5">
            <p className="text-xs uppercase tracking-wider text-muted">
              Fallback manual
            </p>
            <label className="dl-label mt-3" htmlFor="checkin-dni">
              DNI del personero
            </label>
            <input
              id="checkin-dni"
              className="dl-input mt-1"
              inputMode="numeric"
              maxLength={8}
              placeholder="8 dígitos"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
            />
            <button
              type="submit"
              className="dl-btn dl-btn-secondary mt-4 w-full"
              disabled={pending || dni.length !== 8}
            >
              {pending ? "Registrando…" : "Marcar llegada"}
            </button>
          </form>
        </>
      )}

      {error ? (
        <p className="mt-4 text-center text-sm text-[#ef4444]">{error}</p>
      ) : null}
    </div>
  );
}
