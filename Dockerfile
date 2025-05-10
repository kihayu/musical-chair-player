FROM oven/bun:1.2.12 AS builder

WORKDIR /app

COPY package.json ./
COPY bun.lock ./

RUN bun install --frozen-lockfile

COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
COPY env.d.ts ./

COPY index.html ./

COPY public ./public
COPY src ./src

RUN bun run build

FROM nginx:1.28.0-alpine-slim AS server

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
