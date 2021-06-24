# bakta-web-ui

UI for Bakta web app

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Configure api endpoint in container

Replace the config file at `/usr/share/nginx/html/config/config.json` with your own configuration file.

Config structure:

```json
{
  "api": "url to api",
  "token": "apikey token, null or completely skip this entry when no authentication is required"
}
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
