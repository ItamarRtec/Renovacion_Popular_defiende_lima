import { consultarDni, ConsultaError } from "./consultar.js";

function print(resultado: Awaited<ReturnType<typeof consultarDni>>) {
  const r = resultado;
  console.log("");
  console.log(`DNI:                ${r.dni}`);
  console.log(`Encontrado:         ${r.encontrado ? "sí" : "no"}`);
  if (r.mensaje) console.log(`Mensaje ONPE:       ${r.mensaje}`);
  if (r.encontrado) {
    console.log(`Centro de votación: ${r.centroVotacion ?? "— (no disponible: consulta definitiva no habilitada)"}`);
    console.log(`Número de mesa:     ${r.numeroMesa ?? "—"}`);
    console.log(`Dirección:          ${r.direccion ?? "—"}`);
    console.log(`Centro poblado:     ${r.centroPoblado ?? "—"}`);
    console.log(`Ubigeo:             ${r.ubigeo ?? "—"}`);
    const loc = [r.pabellon, r.piso, r.aula, r.referencia]
      .filter((x): x is string => Boolean(x))
      .join(" · ");
    if (loc) console.log(`Localización:       ${loc}`);
    console.log(`Nombre:             ${[r.nombres, r.apellidos].filter(Boolean).join(" ") || "—"}`);
    console.log(`Cargo:              ${r.cargo ?? "—"}`);
    console.log(`Fuente:             ${r.fuente ?? "—"}`);
    console.log(`Definitiva:         ${r.definitivaHabilitada ? "habilitada" : "no habilitada"}`);
    console.log(`Provisional:        ${r.provisionalHabilitada ? "habilitada" : "no habilitada"}`);
    if (r.mensajeDefinitiva) console.log(`Msg definitiva:     ${r.mensajeDefinitiva}`);
    if (r.miembrosMesa.length) {
      console.log(`Miembros de la mesa (${r.miembrosMesa.length}):`);
      for (const m of r.miembrosMesa) {
        const nombre = [m.nombres, m.apellidoPaterno, m.apellidoMaterno].filter(Boolean).join(" ");
        console.log(`  - ${m.dni ?? "—"}  ${nombre || "—"}  [${m.cargo ?? "—"}]`);
      }
    }
  }
  console.log("");
}

async function main() {
  const dni = process.argv[2];
  if (!dni) {
    console.error("Uso: npm run cli -- <DNI de 8 dígitos>");
    console.error("Ej:  npm run cli -- 12345678");
    process.exit(2);
  }
  const headless = process.env.HEADFUL === "1" ? false : true;
  try {
    const resultado = await consultarDni(dni, { headless });
    print(resultado);
    process.exit(resultado.encontrado ? 0 : 1);
  } catch (err) {
    if (err instanceof ConsultaError) {
      console.error(`Error [${err.code}]: ${err.message}`);
    } else {
      console.error("Error inesperado:", err);
    }
    process.exit(1);
  }
}

main();
