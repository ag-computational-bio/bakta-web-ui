# Bakta Web UI

The web frontend of [Bakta Web](https://bakta.computational.bio), a free service for the rapid and standardized annotation of bacterial genomes, MAGs and plasmids with [Bakta](https://github.com/oschwengers/bakta).

The frontend is a Vue 3 single page application. It talks to the [Bakta Web backend](https://github.com/ag-computational-bio/bakta-web-backend), which runs the annotation jobs on a Kubernetes cluster.

## Features

- Submit jobs for three workflows:
  - Bakta genome annotation, optionally followed by Baktfold
  - standalone Baktfold for an existing Bakta result
  - Bakta Proteins for protein sequences
- Follow running jobs with their workflow steps and live logs.
- Keep a list of your own jobs in the browser. No account is needed.
- Explore results in the browser:
  - job statistics with clickable feature counts
  - an annotation table with a feature type filter
  - a genome viewer
  - a circular plot with SVG download
- Download all result files.
- Open Bakta JSON result files in the viewer. The file stays in your browser and is not uploaded.

## Configuration

The app reads the backend URL at startup from `config/config.json`, so one build works for every environment:

```json
{
  "api": "https://api.staging.bakta.computational.bio/api/v2"
}
```

For local development, `public/config/config.json` points to the staging backend.

### Admin area

The hidden admin area under `/admin` shows job statistics, the job list with details, and the Argo workflows with actions like retry, stop, delete and cleanup. It is not linked in the navigation. Admins sign in with Keycloak (Authorization Code flow with PKCE, public client `bakta-admin`), and the backend checks for the admin group. The API contract is `docs/admin-api.md` in the backend repository.

The optional `admin` key configures it:

```json
{
  "api": "https://api.bakta.computational.bio/api/v2",
  "admin": {
    "oidcAuthority": "https://auth.bakta.computational.bio/realms/bakta",
    "clientId": "bakta-admin"
  }
}
```

- `oidcAuthority`: the Keycloak realm issuer. Without it, the admin area shows that it is not configured.
- `clientId`: the Keycloak client, `bakta-admin` by default.
- `api`: the admin API URL. By default the version at the end of `api` is replaced, so `.../api/v2` becomes `.../api/admin`.
- `mock`: set `"mock": true` to use fake data generated in the browser and to skip the login. Use it only for development and previews, never in a deployed config.

## Development

```sh
npm install
npm run dev          # development server with hot reload
npm run build        # type check and production build
npm run lint         # ESLint
npm run format       # Prettier
npm run test:unit    # Vitest
npm run test:e2e     # Playwright, run `npx playwright install` once before
npm run storybook    # component stories
```

## Deployment

The `Dockerfile` builds the app and serves it with nginx. Pushes to `main` and version tags (`v*`) build and publish the image `harbor.computational.bio.uni-giessen.de/bakta/bakta-web-ui`.

## Citation

If you use Bakta Web, please cite:

Beyvers S., Jelonek L., Goesmann A., Schwengers O. (2025). Bakta Web – rapid and standardized genome annotation on scalable infrastructures. Nucleic Acids Research, gkaf335. [doi:10.1093/nar/gkaf335](https://doi.org/10.1093/nar/gkaf335)

## License

GPL-3.0, see [LICENSE](LICENSE).
