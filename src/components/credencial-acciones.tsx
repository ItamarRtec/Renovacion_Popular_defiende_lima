"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CredencialPersonero } from "@/components/credencial-personero";
import type { CredencialData } from "@/lib/credencial";

export function CredencialAcciones({
  data,
  qrToken,
  qrDataUrl: qrDataUrlProp,
}: {
  data: CredencialData;
  qrToken?: string | null;
  qrDataUrl?: string | null;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(qrDataUrlProp ?? null);

  useEffect(() => {
    if (qrDataUrlProp) {
      setQrDataUrl(qrDataUrlProp);
      return;
    }
    if (!qrToken) return;
    let cancelled = false;
    void QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [qrToken, qrDataUrlProp]);

  return (
    <div className="credencial-wrap overflow-x-auto">
      <style>{`
        .credencial-sheet {
          width: min(100%, 210mm);
          padding: 16mm 14mm;
          box-sizing: border-box;
        }
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          html, body { background: #fff !important; }
          .credencial-actions, .dl-nav, header, aside, nav, .no-print {
            display: none !important;
          }
          main { padding: 0 !important; }
          .credencial-wrap { padding: 0 !important; }
          .credencial-sheet {
            width: 100% !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <CredencialPersonero data={data} qrDataUrl={qrDataUrl} />
      <div className="credencial-actions no-print mx-auto mt-6 flex max-w-md flex-col gap-3">
        <button
          className="dl-btn dl-btn-primary w-full"
          type="button"
          onClick={() => window.print()}
        >
          Descargar / imprimir credencial
        </button>
        <p className="text-center text-xs text-muted">
          En el diálogo elige “Guardar como PDF” para descargarla.
        </p>
      </div>
    </div>
  );
}
