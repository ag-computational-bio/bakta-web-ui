import { z } from 'zod'

/**
 * Settings for the hidden admin area. They come from the optional "admin" key
 * of config/config.json. This module stays small, because the main bundle
 * loads it at startup.
 */
export const AdminConfigSchema = z.object({
  // Keycloak realm issuer, e.g. https://auth.bakta.computational.bio/realms/bakta
  oidcAuthority: z.string().optional(),
  clientId: z.string().optional(),
  // base URL of the admin API, by default derived from the "api" key
  api: z.string().optional(),
  // fake data generated in the browser, without login, for development only
  mock: z.boolean().optional(),
})
export type AdminConfig = z.infer<typeof AdminConfigSchema>

export type AdminSettings = {
  api: string
  oidcAuthority?: string
  clientId: string
  mock: boolean
}

let settings: AdminSettings | undefined

/**
 * Turns the URL of the user API (".../api/v2") into the URL of the admin API (".../api/admin").
 */
export function adminApiUrl(api: string): string {
  return api.replace(/\/v\d+\/?$/, '') + '/admin'
}

export function initAdminConfig(api: string, config?: AdminConfig): void {
  settings = {
    api: config?.api ?? adminApiUrl(api),
    oidcAuthority: config?.oidcAuthority,
    clientId: config?.clientId ?? 'bakta-admin',
    mock: config?.mock ?? false,
  }
}

export function useAdminConfig(): AdminSettings {
  if (settings == undefined) throw 'Admin config is not initialized'
  return settings
}
