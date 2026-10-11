import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'

/*
 * Keycloak login of the admin area: Authorization Code flow with PKCE and the
 * public client "bakta-admin". The tokens stay in the session storage of the tab.
 */

export type AdminAuth = {
  /** The current user, renewed with the refresh token when the access token expired. */
  user(): Promise<User | null>
  /** The access token, renewed first when `renew` is set, for example after a 401 answer. */
  accessToken(renew?: boolean): Promise<string | undefined>
  signIn(returnTo: string): Promise<void>
  completeSignIn(): Promise<string>
  signOut(): Promise<void>
  forget(): Promise<void>
}

export function createAdminAuth(authority: string, clientId: string): AdminAuth {
  const origin = window.location.origin
  const manager = new UserManager({
    authority,
    client_id: clientId,
    redirect_uri: `${origin}/admin/callback`,
    post_logout_redirect_uri: `${origin}/admin/`,
    response_type: 'code',
    scope: 'openid profile email',
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  })

  // one renewal at a time: with rotating refresh tokens a second parallel
  // renewal would use an old refresh token and fail
  let renewing: Promise<User | null> | undefined
  function renew(): Promise<User | null> {
    renewing ??= manager
      .signinSilent()
      .catch(() => null)
      .finally(() => (renewing = undefined))
    return renewing
  }

  async function user(): Promise<User | null> {
    if (renewing) return renewing
    const current = await manager.getUser()
    if (current == null || !current.expired) return current
    // the access token expired: try the refresh token before asking for a new login
    return renew()
  }

  return {
    user,
    async accessToken(force = false) {
      return (await (force ? renew() : user()))?.access_token
    },
    signIn(returnTo: string) {
      return manager.signinRedirect({ state: { returnTo } })
    },
    async completeSignIn() {
      const signedIn = await manager.signinRedirectCallback()
      const state = signedIn.state as { returnTo?: string } | undefined
      return state?.returnTo ?? '/admin'
    },
    signOut() {
      return manager.signoutRedirect()
    },
    forget() {
      return manager.removeUser()
    },
  }
}
