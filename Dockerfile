FROM node:lts-alpine as builder

COPY . /src
WORKDIR /src
RUN apk update && apk add git
RUN npm i
RUN npm run build

FROM nginx:stable-alpine

LABEL org.opencontainers.image.authors="lukas.jelonek@computational.bio.uni-giessen.de"
LABEL org.opencontainers.image.url='https://github.com/ag-computational-bio/bakta-web-ui'
LABEL org.opencontainers.image.documentation='https://github.com/ag-computational-bio/bakta-web-ui/README.md'
LABEL org.opencontainers.image.title='Bakta Web Frontend'
LABEL org.opencontainers.image.description='Web frontend for bakta: Rapid & comprehensive annotation of bacterial genomes & plasmids'

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/dist /usr/share/nginx/html
