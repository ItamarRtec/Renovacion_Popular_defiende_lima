"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ACTA_TIPO_LABEL, type ActaTipo } from "@/lib/actas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type ActaView = {
  id: string;
  storage_path: string;
  created_at: string;
  signedUrl: string | null;
};

export function ActaUpload({
  registroId,
  tipo,
  numeroMesa,
  initialActa,
}: {
  registroId: string;
  tipo: ActaTipo;
  numeroMesa: string;
  initialActa: ActaView | null;
}) {
  const [acta, setActa] = useState(initialActa);
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const label = ACTA_TIPO_LABEL[tipo];

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  async function openCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador no permite abrir la cámara. Usa Subir foto.");
      return;
    }
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setError(
        "No pudimos abrir la cámara. Acepta el permiso o usa Subir foto.",
      );
    }
  }

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraOpen || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
  }, [cameraOpen]);

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth < 2) {
      setError("La cámara aún no está lista. Espera un segundo.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("No pudimos tomar la foto. Intenta de nuevo.");
      return;
    }
    ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    stopCamera();
    if (!blob) {
      setError("No pudimos tomar la foto. Intenta de nuevo.");
      return;
    }
    await uploadFile(new File([blob], "acta.jpg", { type: "image/jpeg" }));
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadFile(file);
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Sube una imagen (JPG, PNG o WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen debe pesar menos de 10 MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${registroId}/${tipo}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("actas")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error(uploadError);
        setError("No pudimos subir la foto. Intenta de nuevo.");
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("actas")
        .upsert(
          {
            registro_id: registroId,
            storage_path: path,
            origen: "web",
            tipo,
            numero_mesa: numeroMesa,
          },
          { onConflict: "registro_id,tipo,numero_mesa" },
        )
        .select("id, storage_path, created_at")
        .single();

      if (insertError || !inserted) {
        console.error(insertError);
        await supabase.storage.from("actas").remove([path]);
        setError("No pudimos registrar la foto. Intenta de nuevo.");
        return;
      }

      if (acta?.storage_path && acta.storage_path !== path) {
        await supabase.storage.from("actas").remove([acta.storage_path]);
      }

      const { data: signed } = await supabase.storage
        .from("actas")
        .createSignedUrl(path, 300);

      setActa({
        id: inserted.id,
        storage_path: inserted.storage_path,
        created_at: inserted.created_at,
        signedUrl: signed?.signedUrl ?? null,
      });
    } catch (err) {
      console.error(err);
      setError("No pudimos subir la foto. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="dl-panel space-y-5 px-5 py-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">Acta</p>
        <h2 className="mt-1 text-lg font-medium text-[#0b2a36]">{label}</h2>
      </div>

      {cameraOpen ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            className="max-h-[22rem] w-full object-cover"
            muted
            playsInline
          />
        </div>
      ) : acta?.signedUrl ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={label}
            className="max-h-[22rem] w-full object-contain bg-black"
            src={acta.signedUrl}
          />
        </div>
      ) : (
        <div className="flex min-h-36 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border px-6 text-center text-sm text-muted">
          Aún no hay foto de esta acta.
        </div>
      )}

      <div>
        {cameraOpen ? (
          <div className="flex flex-wrap gap-3">
            <button
              className="dl-btn dl-btn-primary"
              disabled={uploading}
              type="button"
              onClick={() => void capturePhoto()}
            >
              Capturar
            </button>
            <button
              className="dl-btn dl-btn-secondary"
              disabled={uploading}
              type="button"
              onClick={stopCamera}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              className="dl-btn dl-btn-primary"
              disabled={uploading}
              type="button"
              onClick={() => void openCamera()}
            >
              {uploading ? "Subiendo…" : "Tomar foto"}
            </button>
            <label className="dl-btn dl-btn-secondary inline-flex cursor-pointer">
              {uploading ? "Subiendo…" : acta ? "Subir otra" : "Subir foto"}
              <input
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="sr-only"
                disabled={uploading}
                type="file"
                onChange={handleFile}
              />
            </label>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          JPG, PNG o WEBP · máximo 10 MB.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-[var(--dl-danger-500)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
