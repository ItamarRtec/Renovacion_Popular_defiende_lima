"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { mesaKey, type MesaColgarOpcion } from "@/lib/actas";

export function MesaActaSearch({
  initialMesa = "",
  mesas,
}: {
  initialMesa?: string;
  mesas: MesaColgarOpcion[];
}) {
  const router = useRouter();
  const [mesa, setMesa] = useState(mesaKey(initialMesa));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numero = mesa.replace(/\D/g, "");
    if (!numero) return;
    router.push(`/coordinacion/actas?mesa=${encodeURIComponent(numero)}`);
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      {mesas.length > 0 ? (
        <div>
          <label className="dl-label" htmlFor="mesa-colgar-lista">
            Mesas de tu equipo
          </label>
          <select
            className="dl-input mt-1.5"
            id="mesa-colgar-lista"
            value={mesa}
            onChange={(event) => setMesa(event.target.value)}
          >
            <option value="">Elige una mesa o escríbela abajo</option>
            {mesas.map((m) => (
              <option key={m.key} value={m.key}>
                Mesa {m.numero}
                {m.suplente ? " (suplente)" : ""} — {m.personero}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label className="dl-label" htmlFor="mesa-colgar">
          Mesa que estás colgando
        </label>
        <input
          className="dl-input mt-1.5"
          id="mesa-colgar"
          inputMode="numeric"
          pattern="[0-9]+"
          placeholder="Número de mesa"
          required
          value={mesa}
          onChange={(event) => setMesa(event.target.value.replace(/\D/g, ""))}
        />
        <p className="mt-2 text-xs text-muted">
          {mesas.length > 0
            ? "Tienes que elegir o escribir la mesa antes de colgar las fotos."
            : "Escribe el número de mesa. Si falta el personero, las fotos quedan a tu cargo."}
        </p>
      </div>
      <button className="dl-btn dl-btn-primary" disabled={!mesa} type="submit">
        Colgar esta mesa
      </button>
    </form>
  );
}
