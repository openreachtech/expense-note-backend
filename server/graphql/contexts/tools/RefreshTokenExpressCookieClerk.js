import cookie from 'cookie'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Handles the refresh-token cookie for a GraphQL request.
 *
 * All cookie logic lives here rather than on the context, which stays a plain DTO. A resolver that
 * manages a session — sign-in, sign-out, renew access token — builds a clerk from the context it
 * receives in `resolve()` and drives the cookie through it; every other resolver never touches it.
 *
 * Cookie configuration (name, lifetime, `Secure`) is read from the engine config the context
 * carries, so it is changed in the Engine class alone.
 */
export default class RefreshTokenExpressCookieClerk {
  /**
   * Constructor.
   *
   * @param {RefreshTokenExpressCookieClerkParams} params - Parameters.
   */
  constructor ({
    context,
  }) {
    this.context = context
  }

  /**
   * Factory method.
   *
   * @param {RefreshTokenExpressCookieClerkParams} params - Parameters.
   * @returns {RefreshTokenExpressCookieClerk} - Instance.
   */
  static create ({
    context,
  }) {
    return new this({
      context,
    })
  }

  /**
   * get: Cookie library.
   *
   * @returns {import('cookie')} - The `cookie` library.
   */
  static get cookieClient () {
    return cookie
  }

  /**
   * get: Own class.
   *
   * @returns {typeof RefreshTokenExpressCookieClerk} - Own class.
   */
  get Ctor () {
    return /** @type {typeof RefreshTokenExpressCookieClerk} */ (this.constructor)
  }

  /**
   * get: Refresh-token cookie config, from the engine.
   *
   * @returns {RefreshTokenCookieConfig} - Cookie config.
   */
  get refreshTokenCookieConfig () {
    return this.context.config.refreshTokenCookie
  }

  /**
   * get: Name of the cookie that carries the refresh token.
   *
   * @returns {string} - Cookie name.
   */
  get refreshTokenCookieName () {
    return this.refreshTokenCookieConfig.name
  }

  /**
   * get: Path the refresh token cookie is scoped to.
   *
   * It is the endpoint the engine is mounted at, so the cookie stays off every other route.
   *
   * @returns {string} - Cookie path.
   */
  get refreshTokenCookiePath () {
    return this.context.config.graphqlEndpoint
  }

  /**
   * get: Lifetime of the refresh token cookie, in milliseconds.
   *
   * @returns {number} - Milliseconds.
   */
  get refreshTokenMaxAgeMilliseconds () {
    return this.refreshTokenCookieConfig.lifetimeDays
      * MILLISECONDS_PER_DAY
  }

  /**
   * Extract the refresh token presented by this request.
   *
   * **Calling this is not authenticating.** Only `renewAccessToken` and `signOut` may treat the
   * value as a credential.
   *
   * @returns {string | null} - Refresh token, or null when the cookie is absent.
   */
  extractRefreshToken () {
    return this.parseCookieHeader()
      ?.[this.refreshTokenCookieName]
      ?? null
  }

  /**
   * Parse the `Cookie` header of this request into a map.
   *
   * @returns {Record<string, string> | null} - Parsed cookies, or null when the header is absent.
   */
  parseCookieHeader () {
    if (!this.context.cookieHeader) {
      return null
    }

    return this.Ctor.cookieClient.parse(
      this.context.cookieHeader
    )
  }

  /**
   * Whether this request has anything to write a cookie to.
   *
   * **Why a caller has to ask.** `#saveRefreshTokenCookie()` below writes through an optional
   * call, so where there is no response it does nothing and says nothing — and a resolver that
   * minted a token pair would have thrown the refresh half away while answering with a working
   * access token, leaving a refresh row nobody can present and nobody can revoke until it
   * expires. A session operation therefore asks this **before** it commits a pair, and refuses
   * instead of minting one it cannot deliver.
   *
   * **This asks about a capability, not about a transport.** The engine's endpoint also carries a
   * WebSocket channel — `GraphqlServerBuilder#setupServer()` opens one for every audience, with no
   * configuration flag, and that channel is the framework's — and over it there is no express
   * response, so `BaseAppGraphqlContext#get:expressResponse` is null. That is the case this
   * answers today, but it is not what the question names: reading a protocol or a header would
   * stop being true the day the framework changed transports, whereas "is there a response to
   * write to" is the thing the write actually needs.
   *
   * Truthiness rather than `!== null`, because an optional call is refused by every nullish value
   * and `#get:expressResponse` is not the only way a context can be built.
   *
   * @returns {boolean} true: a cookie written now reaches the caller.
   */
  canSaveRefreshTokenCookie () {
    return Boolean(this.context.expressResponse)
  }

  /**
   * Hand a refresh token to the browser as an `HttpOnly` cookie.
   *
   * @param {{
   *   refreshToken: string
   * }} params - Parameters.
   * @returns {void}
   */
  saveRefreshTokenCookie ({
    refreshToken,
  }) {
    this.context.expressResponse
      ?.cookie(
        this.refreshTokenCookieName,
        refreshToken,
        this.buildRefreshTokenCookieOptionHash()
      )
  }

  /**
   * Remove the refresh token cookie from the browser.
   *
   * The options have to match the ones it was written with, or the browser keeps the original
   * cookie and the session appears to survive a sign-out.
   *
   * @returns {void}
   */
  clearRefreshTokenCookie () {
    this.context.expressResponse
      ?.clearCookie(
        this.refreshTokenCookieName,
        this.buildRefreshTokenCookieAttributeHash()
      )
  }

  /**
   * Build the option hash to write the refresh token cookie with — its attributes plus a lifetime.
   *
   * @returns {RefreshTokenCookieOptionHash} - Cookie options, including the lifetime.
   */
  buildRefreshTokenCookieOptionHash () {
    return {
      ...this.buildRefreshTokenCookieAttributeHash(),
      maxAge: this.refreshTokenMaxAgeMilliseconds,
    }
  }

  /**
   * Build the attribute hash that identifies the refresh token cookie — no lifetime.
   *
   * Writing and clearing share these attributes: clearing must present the same ones to target the
   * cookie, but must not carry a lifetime, or the browser re-establishes the cookie instead of
   * removing it.
   *
   * @returns {RefreshTokenCookieAttributeHash} - Cookie attributes, without a lifetime.
   */
  buildRefreshTokenCookieAttributeHash () {
    const {
      httpOnly,
      secure,
      sameSite,
    } = this.refreshTokenCookieConfig

    return {
      httpOnly,
      secure,
      sameSite,
      path: this.refreshTokenCookiePath,
    }
  }
}

/**
 * @typedef {{
 *   context: import('../BaseAppGraphqlContext.js').default
 * }} RefreshTokenExpressCookieClerkParams
 */

/**
 * @typedef {{
 *   name: string
 *   lifetimeDays: number
 *   secure: boolean
 *   sameSite: 'lax'
 *   httpOnly: boolean
 * }} RefreshTokenCookieConfig
 */

/**
 * @typedef {{
 *   httpOnly: boolean
 *   secure: boolean
 *   sameSite: 'lax'
 *   path: string
 *   maxAge: number
 * }} RefreshTokenCookieOptionHash
 */

/**
 * @typedef {{
 *   httpOnly: boolean
 *   secure: boolean
 *   sameSite: 'lax'
 *   path: string
 * }} RefreshTokenCookieAttributeHash
 */
