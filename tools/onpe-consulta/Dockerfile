# syntax=docker/dockerfile:1
#
# Imagen del robot ONPE (tools/onpe-consulta).
# Expone un servidor Express que usa Chromium (Playwright) para consultar
# https://consultaelectoral.onpe.gob.pe por DNI.
#
# Build:  docker build -t onpe-consulta ./tools/onpe-consulta
# Run:    docker run --rm -p 8787:8787 -e HOST=0.0.0.0 -e CONSULTA_TOKEN=xxx -e PROXY_URL=http://user:pass@host:port onpe-consulta
# Fly:    fly deploy (usa fly.toml). En producción define PROXY_URL (residencial sticky).

FROM node:20-slim

# Playwright necesita libc y fuentes; install --with-deps las resuelve.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala dependencias primero (mejor cache de capas).
COPY package.json package-lock.json* ./
RUN npm ci

# Instala Chromium + dependencias del sistema que coincidan con la versión
# de playwright del package.json (no asumir una imagen preconstruida).
# El cache de browsers queda en /root/.cache/ms-playwright (default) y
# Playwright lo encuentra solo en runtime.
RUN npx playwright install --with-deps chromium

ENV PLAYWRIGHT_NO_SANDBOX=1 \
    NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787

COPY . .

# tini reaps zombies (Chromium puede dejar procesos colgados).
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npm", "start"]
