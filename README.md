# Defiende Lima — Frontend

Iniciativa ciudadana para coordinar **personeros**, **miembros de mesa** y **ciudadanos** en las elecciones de Lima 2026, con el objetivo de que cada voto sea contado.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4

## Arranque

```bash
cd front_end
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) — página de **paleta / design system**.

## Estructura actual

| Ruta / archivo | Propósito |
|----------------|-----------|
| `/` | Landing — hero (estilo x.ai) |
| `/design-system` | Paleta visual y tokens |
| `src/components/hero.tsx` | Hero de la landing |
| `src/components/site-header.tsx` | Nav tipo x.ai |
| `src/app/globals.css` | Tokens `--dl-*` y clases `.dl-*` |
| `.cursor/rules/frontend.mdc` | Estándares de desarrollo |

## Design tokens (resumen)

**Visual north star: [https://x.ai](https://x.ai)**

- **Black / zinc** — canvas y superficies
- **White / muted (#888)** — tipografía y jerarquía
- **New (#FF6B00)** — tag de anuncio
- **Accent gradient** — underline de palabra clave en headline
- **Pills** — botones, inputs y badges
- Tipografía: **Geist** + **Geist Mono** (datos electorales)

## Próximos pasos de producto

1. Landing pública (hero brand-first).
2. Flujos por rol: registro personero / miembro de mesa / ciudadano.
3. Panel de mesa: conteo, actas, incidencias.
4. Extraer componentes reutilizables desde las clases `.dl-*`.

Consultar siempre la paleta y `.cursor/rules/frontend.mdc` antes de implementar UI nueva.
