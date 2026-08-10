# onpe-consulta

Herramienta **aislada** (no integrada al frontend ciudadano de Defiende Lima) que, dado
un DNI, consulta el lugar de votación de una persona en la ONPE y devuelve el **centro
de votación** y el **número de mesa** (entre otros datos).

> ⚠️ **Lee la sección "Riesgos y consideraciones legales" antes de usar esta herramienta.**
> Es un módulo separado del frontend ciudadano precisamente para contener el riesgo legal
> y técnico que conlleva consultar un servicio externo con datos personales.

## Cómo funciona

La página `https://consultaelectoral.onpe.gob.pe/inicio` es una app Angular protegida por
un challenge anti-bot (Cloudflare). La app llama internamente a una API JSON en **tres pasos**:

```
1) POST /v1/api/busqueda/dni       body { "numeroDocumento": "<8 dígitos>" }
   -> { success:true,  data:{ token } }            (el DNI existe en el padrón)
   -> { success:false, titulo:"DNI no encontrado" } (no existe / no participa)

2) POST /v1/api/consulta/definitiva   Authorization: Bearer <token>
   -> { success:true,  data:{ localVotacion, mesaSufragio, direccion, ... } }
   -> { success:false, message:"Consulta Definitiva no habilitada." }

3) POST /v1/api/consulta/provisional  Authorization: Bearer <token>
   -> { success:true, data:{ mesaSufragio, ubigeo, cargo, listaMiembros, ... } }
```

Para superar el anti-bot, esta herramienta abre la página con **Playwright** (un Chromium
real) y, ya dentro del contexto de la página (mismo origen + cookies de clearance de
Cloudflare), llama directamente a la API. Así se evita raspar el DOM y se usa el
contrato JSON limpio de la propia ONPE.

### Campos disponibles

| Campo            | Viene de         | Disponible ERM 2026 (provisional) |
|------------------|------------------|-----------------|
| `numeroMesa`     | `mesaSufragio`   | ✅ (provisional) |
| `ubigeo`         | `ubigeo`         | ✅ (provisional) |
| `nombres`/`apellidos` | —           | ✅ (provisional) |
| `cargo`          | `cargo`          | ✅ ("NO ERES MIEMBRO DE MESA" o el cargo) |
| `miembrosMesa`   | `listaMiembros`  | ✅ (provisional) |
| `centroVotacion` | `localVotacion`  | ❌ (solo si `definitiva` habilitada) |
| `direccion`      | `direccion`      | ❌ (solo si `definitiva` habilitada) |
| `pabellon`/`piso`/`aula`/`referencia` | — | ❌ (solo si `definitiva` habilitada) |

**Importante:** la página sirve hoy las **Elecciones Regionales y Municipales 2026** (ERM 2026,
fecha de cierre 04/10/2026 17:00). Con `APP.PUBLICACION_DEFINITIVA=false` (verificado en
runtime vía `/v1/api/configuracion/listar`), solo la consulta **PROVISIONAL** está
habilitada, por lo que el **centro de votación** (nombre del local) **no está disponible
todavía** — viene de la consulta DEFINITIVA (`localVotacion`), que la ONPE habilita
cerca de la elección. El **número de mesa**, ubigeo, cargo y miembros sí están disponibles
desde la provisional. Cuando `PUBLICACION_DEFINITIVA` pase a `true`, `centroVotacion` y
`direccion` se llenarán automáticamente.

## Requisitos

- Node 20+
- Playwright descarga su propio Chromium al instalar (`npx playwright install chromium`).

## Instalación

```bash
cd tools/onpe-consulta
npm install
npx playwright install chromium
```

## Uso

### CLI (una consulta puntual)

```bash
npm run cli -- 12345678
# o con navegador visible (útil para depurar el anti-bot):
HEADFUL=1 npm run cli -- 12345678
```

Salida:

```
DNI:                71216812
Encontrado:         sí
Centro de votación: — (no disponible: consulta definitiva no habilitada)
Número de mesa:     041768
Ubigeo:             LIMA / LIMA / CHORRILLOS
Nombre:             ITAMAR FRANCISCO PABLO PEREZ RYAN GUEVARA
Cargo:              NO ERES MIEMBRO DE MESA
Fuente:             datoProvisional
Definitiva:         no habilitada
Provisional:        habilitada
Miembros de la mesa (9):
  - 44815105  LIZBETH YOLANDA PAZ SANCHEZ  [PRESIDENTE]
  ...
```

### Servidor HTTP (para integrar con el frontend)

```bash
npm start
# onpe-consulta escuchando en http://127.0.0.1:8787
```

Endpoints:

- `GET /health` → `{ "ok": true }`
- `POST /consultar` con body `{ "dni": "12345678" }`

Respuestas:

- `200` — encontrado:
  ```json
  {
    "encontrado": true,
    "dni": "71216812",
    "centroVotacion": null,
    "numeroMesa": "041768",
    "direccion": null,
    "centroPoblado": null,
    "ubigeo": "LIMA / LIMA / CHORRILLOS",
    "nombres": "ITAMAR FRANCISCO PABLO",
    "apellidos": "PEREZ RYAN GUEVARA",
    "cargo": "NO ERES MIEMBRO DE MESA",
    "definitivaHabilitada": false,
    "provisionalHabilitada": true,
    "mensajeDefinitiva": "Consulta Definitiva no habilitada.",
    "miembrosMesa": [ { "dni": "...", "cargo": "PRESIDENTE", ... } ],
    "fuente": "datoProvisional",
    "raw": { "busqueda": {...}, "definitiva": {...}, "provisional": {...} }
  }
  ```
- `404` — no encontrado (`encontrado: false`).
- `400` — DNI inválido.
- `502` — bloqueo anti-bot / error de la ONPE.
- `504` — timeout.

El servidor reutiliza una sola instancia de Playwright entre peticiones (mucho más rápido
que arrancar el navegador en cada consulta).

### Seguridad del servidor

- Escucha en `127.0.0.1` por defecto (solo local). **No exponer a internet sin protección.**
- Si necesitas exponerlo, define `CONSULTA_TOKEN` y envía el header `x-consulta-token`.
- Variables de entorno: `PORT`, `HOST`, `CONSULTA_TOKEN`, `HEADFUL`, `PROXY_URL`.

## Integración con el frontend de Defiende Lima

Esta herramienta **no** se importa directamente en el frontend Next.js. El flujo recomendado:

1. Corre el servidor en el mismo host que el frontend: `npm start` (puerto 8787).
2. Desde el frontend, llama a `POST http://127.0.0.1:8787/consultar` con el DNI.
3. Si `encontrado` es `true`, autocompleta los campos `centro_votacion` y `numero_mesa`
   del formulario de inscripción (`src/components/registro-form.tsx`).

Ejemplo de llamada desde el frontend (Client Component):

```ts
async function consultarOnpe(dni: string) {
  const res = await fetch("http://127.0.0.1:8787/consultar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dni }),
  });
  if (!res.ok && res.status !== 404) throw new Error("Error al consultar la ONPE");
  return (await res.json()) as {
    encontrado: boolean;
    centroVotacion: string | null;
    numeroMesa: string | null;
  };
}
```

> Recuerda: el usuario debe consentir la consulta de su propio DNI. No consultes DNIs
> de terceros sin autorización.

## Deploy en Fly.io (producción)

El bot vive en **este mismo repositorio** (`tools/onpe-consulta/`, junto al frontend Next.js en la raíz).
No puede ir en Vercel (serverless, sin Chromium). Se despliega como contenedor siempre-on en Fly.io;
el frontend (Vercel) lo llama por HTTPS con token.

### 1. Crear y desplegar la app

```bash
cd tools/onpe-consulta   # desde la raíz del repo (donde está package.json de Next.js)
fly auth login
fly launch --no-deploy   # genera el app name; responde NO a sobrescribir Dockerfile/fly.toml
fly secrets set CONSULTA_TOKEN="<genera un secreto largo y aleatorio>"
fly deploy
```

`fly.toml` ya está configurado: región `gru` (São Paulo; `scl` Santiago está deprecada en Fly), `internal_port 8787`,
healthcheck en `/health`, 1 GB de RAM (Chromium lo necesita), `auto_stop_machines=false`
(para evitar cold starts de ~10s en cada registro).

**CI (opcional):** `.github/workflows/fly-onpe-consulta.yml` despliega en cada push a `main` que
toque `tools/onpe-consulta/`. Agrega en GitHub → Settings → Secrets → `FLY_API_TOKEN`
(`fly tokens create deploy -a onpe-consulta`). `CONSULTA_TOKEN` sigue en Fly secrets, no en GitHub.

### 2. Secrets en Fly

```bash
fly secrets set CONSULTA_TOKEN="<genera un secreto largo y aleatorio>"

# REQUERIDO en Fly: Cloudflare bloquea IPs de datacenter. Usa un proxy
# residencial sticky (PE o BR), p. ej. IPRoyal / Webshare:
#   http://user:pass@host:port
fly secrets set PROXY_URL="http://user:pass@proxy-host:port"

# HOST y PORT ya vienen en el Dockerfile (0.0.0.0:8787)
```

Sin `PROXY_URL`, el healthcheck pasa pero `/consultar` suele responder
`ANTIBOT_BLOQUEO` / `TIMEOUT` (challenge de Cloudflare). El proxy debe ser
**sticky** (misma IP durante la sesión) para que la cookie `cf_clearance` siga válida.

El servidor **se niega a arrancar** si se expone fuera de loopback sin `CONSULTA_TOKEN`
(fail-closed en `src/server.ts`).

### 3. Verificar

```bash
curl -s https://renovacion-popular-defiende-lima-r6z3yw.fly.dev/health
# -> {"ok":true}

curl -s -m 90 -X POST https://renovacion-popular-defiende-lima-r6z3yw.fly.dev/consultar \
  -H "x-consulta-token: <tu secreto>" \
  -H "Content-Type: application/json" \
  -d '{"dni":"71216812"}'
# -> encontrado, numeroMesa, ubigeo, ...
```

### 4. Variables en Vercel (frontend)

En el proyecto del frontend (Vercel → Settings → Environment Variables):

| Variable | Valor |
|---|---|
| `ONPE_CONSULTA_URL` | `https://renovacion-popular-defiende-lima-r6z3yw.fly.dev` |
| `ONPE_CONSULTA_TOKEN` | `<el mismo CONSULTA_TOKEN de Fly>` |

Tras setearlas, redeploy del frontend. La ruta `POST /api/registro` empezará a rellenar
`numero_mesa`, `region`, `provincia`, `distrito` (y `centro_votacion` cuando la ONPE
habilite la consulta definitiva).

### Notas de costo

- Fly `shared-cpu-1x` + 1 GB siempre-on: **~USD 3–5/mes**.
- Proxy residencial sticky (bajo volumen de registros): **~USD 5–15/mes**.

El bot solo recibe tráfico cuando alguien se registra, pero debe estar despierto para
responder rápido.

## Riesgos y consideraciones legales

1. **Datos personales**: el DNI es un dato personal sensible según la Ley 29733 (Protección
   de Datos Personales del Perú). Procesar DNIs de terceros sin consentimiento expreso tiene
   implicaciones legales. Usa esta herramienta solo para que cada ciudadano consulte **su
   propio** DNI, o con consentimiento explícito.
2. **Términos de la ONPE**: revisa los términos de uso y la política de robots del sitio de la
   ONPE antes de usar esto en producción. El acceso automatizado podría estar prohibido.
3. **Fragilidad técnica**: la ONPE puede (a) cambiar el challenge anti-bot, (b) modificar el
   contrato de la API, (c) banear la IP por uso intensivo, o (d) añadir CAPTCHAs. Esta
   herramienta puede romperse en cualquier momento sin previo aviso.
4. **Rate limiting**: la ONPE no publica límites. No la bombardees con consultas masivas;
   usa consultas puntuales y con backoff. Considera cachear resultados (por DNI) si vas a
   consultar repetidamente.
5. **Proceso electoral**: la página sirve hoy las **Elecciones Regionales y Municipales
   2026** (ERM 2026, cierre 04/10/2026). La ONPE puede conmutar la consulta a otro proceso
   o cambiar la URL/API; si lo hace, hay que re-apuntar `ONPE_URL` y los endpoints en
   `src/consultar.ts`. Hoy `APP.PUBLICACION_DEFINITIVA=false`, así que solo la consulta
   PROVISIONAL entrega datos (número de mesa, ubigeo, cargo, miembros); el **centro de
   votación** (nombre del local) llega desde la DEFINITIVA y se llenará solo cuando la
   ONPE la habilite, cerca de la elección.

## Estructura

```
tools/onpe-consulta/
├── package.json
├── package-lock.json
├── tsconfig.json
├── eslint.config.cjs
├── .gitignore
├── .dockerignore
├── Dockerfile          # imagen con Chromium + Express (Fly.io / Docker)
├── fly.toml            # config de deploy Fly.io
└── src/
    ├── consultar.ts   # núcleo: OnpeConsultor + consultarDni()
    ├── cli.ts         # CLI puntual
    └── server.ts      # servidor HTTP Express
```
