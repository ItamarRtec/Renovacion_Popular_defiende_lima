"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isPlaceholderVideoUrl, youtubeEmbedUrl } from "@/lib/youtube";
import type { VideoRow } from "@/lib/supabase/database.types";

type AdminVideosProps = {
  videos: VideoRow[];
};

export function AdminVideos({ videos }: AdminVideosProps) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [url, setUrl] = useState("");
  const [orden, setOrden] = useState(String((videos[0]?.orden ?? 0) + 1));
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const t = titulo.trim();
    const u = url.trim();
    const o = Number.parseInt(orden, 10);

    if (t.length < 2) {
      setError("El título es muy corto.");
      return;
    }
    if (!youtubeEmbedUrl(u) && !isPlaceholderVideoUrl(u)) {
      setError("Pega una URL de YouTube válida (youtube.com o youtu.be).");
      return;
    }
    if (!Number.isFinite(o) || o < 0) {
      setError("El orden debe ser un número ≥ 0.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: t,
          descripcion: descripcion.trim(),
          url: u,
          orden: o,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar el video.");
        return;
      }

      setTitulo("");
      setDescripcion("");
      setUrl("");
      setOrden(String(o + 1));
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el video.");
    } finally {
      setBusy(false);
    }
  }

  async function setActivo(id: string, activo: boolean) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, activo }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo actualizar el video.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el video.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeVideo(id: string) {
    if (!window.confirm("¿Eliminar este video del catálogo?")) return;
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo eliminar.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="dl-panel space-y-4 px-5 py-5">
        <p className="text-xs uppercase tracking-wider text-muted">
          Agregar video (YouTube)
        </p>
        <div>
          <label className="dl-label" htmlFor="video-titulo">
            Título
          </label>
          <input
            id="video-titulo"
            className="dl-input mt-1"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Bienvenida y rol del personero"
            required
          />
        </div>
        <div>
          <label className="dl-label" htmlFor="video-url">
            URL de YouTube
          </label>
          <input
            id="video-url"
            className="dl-input mt-1"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            required
          />
        </div>
        <div>
          <label className="dl-label" htmlFor="video-desc">
            Descripción
          </label>
          <textarea
            id="video-desc"
            className="dl-input mt-1 min-h-[4.5rem]"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Qué aprenderá el personero"
          />
        </div>
        <div>
          <label className="dl-label" htmlFor="video-orden">
            Orden
          </label>
          <input
            id="video-orden"
            className="dl-input mt-1 max-w-[8rem]"
            inputMode="numeric"
            value={orden}
            onChange={(e) => setOrden(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {error ? (
          <p className="text-sm text-[#c2410c]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="dl-btn dl-btn-primary"
          disabled={busy}
        >
          {busy ? "Guardando…" : "Publicar video"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={4}>
                  Aún no hay videos. Publica el primero arriba.
                </td>
              </tr>
            ) : (
              videos.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-border last:border-0 hover:bg-[var(--surface-muted)]"
                >
                  <td className="px-4 py-3 tabular-nums text-muted">
                    {v.orden}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0b2a36]">{v.titulo}</p>
                    <p className="mt-0.5 max-w-md truncate text-xs text-muted">
                      {v.url}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {v.activo ? (
                      <span className="text-[#1077A1]">Activo</span>
                    ) : (
                      <span className="text-muted">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-sm text-[#1077A1] hover:underline disabled:opacity-50"
                        disabled={busyId === v.id}
                        onClick={() => void setActivo(v.id, !v.activo)}
                      >
                        {v.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        className="text-sm text-[#c2410c] hover:underline disabled:opacity-50"
                        disabled={busyId === v.id}
                        onClick={() => void removeVideo(v.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
