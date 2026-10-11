FROM mcr.microsoft.com/playwright:v1.58.2-noble AS builder

WORKDIR /src
# install the dependencies first, so this layer is reused when only the source changes
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vitest --run
RUN npm run build

# the slim variant keeps the core modules nginx.conf needs (static files, proxy) and drops the rest
FROM nginx:stable-alpine-slim

LABEL org.opencontainers.image.authors="lukas.jelonek@computational.bio.uni-giessen.de"
LABEL org.opencontainers.image.url='https://github.com/ag-computational-bio/bakta-web-ui'
LABEL org.opencontainers.image.documentation='https://github.com/ag-computational-bio/bakta-web-ui/README.md'
LABEL org.opencontainers.image.title='Bakta Web Frontend'
LABEL org.opencontainers.image.description='Web frontend for bakta: Rapid & comprehensive annotation of bacterial genomes & plasmids'

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/dist /usr/share/nginx/html
