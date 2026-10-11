import { reactive } from 'vue'
import { AdminApiError, createHttpAdminApi, type AdminApi, type AdminUser } from './admin-api'
import type { AdminAuth } from './admin-auth'
import { useAdminConfig } from './admin-config'

/*
 * The login state of the admin area. In mock mode the fake API is used and the
 * login is skipped. The OIDC library and the mock are loaded only when needed.
 */

export type SessionStatus =
  | 'loading'
  | 'signed-out'
  | 'forbidden'
  | 'not-configured'
  | 'error'
  | 'ready'

export const session = reactive<{
  status: SessionStatus
  user?: AdminUser
  error?: string
  mock: boolean
}>({ status: 'loading', mock: false })

let api: AdminApi | undefined
let auth: AdminAuth | undefined
let started: Promise<void> | undefined

async function loadAuth(): Promise<AdminAuth | undefined> {
  const config = useAdminConfig()
  if (!config.oidcAuthority) return undefined
  if (auth == undefined) {
    const { createAdminAuth } = await import('./admin-auth')
    auth = createAdminAuth(config.oidcAuthority, config.clientId)
  }
  return auth
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/**
 * Turns an error of an admin API call into a message. A lost login or a
 * missing admin group switches the whole admin area to the matching page.
 */
export function handleAdminError(error: unknown): string {
  if (error instanceof AdminApiError) {
    if (error.status === 401) session.status = 'signed-out'
    if (error.status === 403) session.status = 'forbidden'
  }
  return errorMessage(error)
}

async function start(): Promise<void> {
  const config = useAdminConfig()
  session.mock = config.mock
  if (config.mock) {
    const { createMockAdminApi } = await import('./admin-mock')
    api = createMockAdminApi()
  } else {
    const oidc = await loadAuth()
    if (oidc == undefined) {
      session.status = 'not-configured'
      return
    }
    if ((await oidc.user()) == null) {
      session.status = 'signed-out'
      return
    }
    api = createHttpAdminApi(config.api, (renew) => oidc.accessToken(renew))
  }
  try {
    session.user = await api.me()
    session.status = 'ready'
  } catch (error) {
    session.error = handleAdminError(error)
    if (session.status === 'loading') session.status = 'error'
  }
}

/**
 * Starts the session once. Call it again after an error to retry.
 */
export function startSession(retry = false): Promise<void> {
  if (started == undefined || retry) {
    session.status = 'loading'
    session.error = undefined
    started = start().catch((error) => {
      session.status = 'error'
      session.error = errorMessage(error)
    })
  }
  return started
}

export function useAdminApi(): AdminApi {
  if (api == undefined) throw 'Admin API is not ready'
  return api
}

// only paths of the admin area are allowed as targets after the login
function safeReturnPath(path: string | undefined): string {
  return path && path.startsWith('/admin') && !path.startsWith('/admin/callback') ? path : '/admin'
}

export async function signIn(returnTo: string): Promise<void> {
  const oidc = await loadAuth()
  if (oidc) await oidc.signIn(safeReturnPath(returnTo))
}

/**
 * Finishes the login after the redirect back from Keycloak and returns the page to open.
 */
export async function completeSignIn(): Promise<string> {
  const oidc = await loadAuth()
  if (oidc == undefined) return '/admin'
  const returnTo = await oidc.completeSignIn()
  started = undefined
  return safeReturnPath(returnTo)
}

export async function signOut(): Promise<void> {
  const oidc = await loadAuth()
  if (oidc == undefined) return
  try {
    await oidc.signOut()
  } catch {
    // Keycloak cannot be reached: forget the tokens at least
    await oidc.forget()
    session.status = 'signed-out'
  }
}
