import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import SessionClerk from '../../../../../../app/session/SessionClerk.js'

import StaffMemberAccessToken from '../../../../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberRefreshToken from '../../../../../../sequelize/models/StaffMemberRefreshToken.js'

import RefreshTokenExpressCookieClerk from '../../../../contexts/tools/RefreshTokenExpressCookieClerk.js'

/**
 * Actual resolver of the `signOut` mutation.
 *
 * The operation takes no argument. Spec section 10.1 declares `SignOutInput()` with no fields, and
 * the convention gives an operation with no input no argument at all — so there is no input type to
 * destructure, no input validator, and no `203.*` code here.
 *
 * **This resolver authenticates itself.** `signOut` names itself in the engine's
 * `schemasToSkipFiltering`, because spec section 7 has it authenticate by the refresh-token cookie
 * rather than by the access token: both it and `renewAccessToken` have to work once the access
 * token has expired. Skipping the filter removed the gate, not the requirement, so the credential
 * check is done below. `context.staffMember` is deliberately never read — on a call whose access
 * token has expired it is null, which is exactly the call this operation exists to serve.
 *
 * What it does, in order: read the cookie through `RefreshTokenExpressCookieClerk`, find the row
 * the presented token belongs to through `SessionClerk`, revoke the whole series it belongs to
 * (section 9.7 — "signing out revokes every row sharing it", which is what makes section 10's
 * "stops working the moment its holder signs out" true), then clear the cookie. Clearing it is
 * what makes the next visit ask for a sign-in rather than fail a renewal with a cookie the
 * database has already refused.
 *
 * Nothing here returns or logs a token, a digest or an address (section 7). The refusals below
 * carry no value, and no branch of this resolver writes a log line at all.
 *
 * @augments {BaseMutationResolver}
 */
export default class SignOutMutationResolver extends BaseMutationResolver {
  /**
   * Constructor.
   *
   * @param {SignOutMutationResolverParams} params - Parameters.
   */
  constructor ({
    sessionClerk,
    ...remainingParams
  }) {
    super(remainingParams)

    this.sessionClerk = sessionClerk
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof SignOutMutationResolver ? X : never} T, X
   * @override
   * @param {SignOutMutationResolverFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    sessionClerk = this.createSessionClerk(),
    errorCodeHash = this.errorCodeHash,
  } = {}) {
    const errorHash = this.buildErrorHash({
      errorCodeHash,
    })

    return /** @type {InstanceType<T>} */ (
      new this({
        sessionClerk,
        errorHash,
      })
    )
  }

  /**
   * get: RefreshTokenExpressCookieClerk class — a seam so tests can substitute it.
   *
   * @returns {typeof RefreshTokenExpressCookieClerk} The class.
   */
  static get RefreshTokenExpressCookieClerkCtor () {
    return RefreshTokenExpressCookieClerk
  }

  /**
   * get: SessionClerk class — a seam so tests can substitute it.
   *
   * @returns {typeof SessionClerk} The class.
   */
  static get SessionClerkCtor () {
    return SessionClerk
  }

  /**
   * get: StaffMemberAccessToken model — a seam so tests can substitute it.
   *
   * @returns {typeof StaffMemberAccessToken} The model.
   */
  static get StaffMemberAccessTokenCtor () {
    return StaffMemberAccessToken
  }

  /**
   * get: StaffMemberRefreshToken model — a seam so tests can substitute it.
   *
   * @returns {typeof StaffMemberRefreshToken} The model.
   */
  static get StaffMemberRefreshTokenCtor () {
    return StaffMemberRefreshToken
  }

  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'signOut'
  }

  /**
   * get: Error code hash.
   *
   * **One code covers every way the presented credential can fail**: no cookie at all, a cookie
   * whose token matches no row, and a cookie whose token is spent, revoked or expired. Section 10's
   * standing requirement across this feature is that a refusal not say which of several states it
   * hit, and one code is how that holds by construction rather than by several code paths agreeing.
   * `SessionNotFound` is named for what is true in all of them — no live session was presented —
   * rather than for any one of them, which would be a lie in the other cases.
   *
   * `FailedToRevokeSession` is a second code because it is not one of those states. It is
   * reachable only after a live token has already been found, so it tells a caller nothing about
   * its own credential; it exists because answering `signedOut: true` when the revocation did not
   * land would be a lie, and the series would still be live.
   *
   * Both sit in the `204` family: this project's ruling is that `204` carries this feature's
   * refusals and `205` stays external-only. `M002` is this operation's id in
   * `server/graphql/resolver-id-hash-staff.js`.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,

      // Database / state errors
      SessionNotFound: '204.M002.001',
      FailedToRevokeSession: '204.M002.002',
    }
  }

  /**
   * Create the session clerk this resolver revokes through.
   *
   * Both token models are handed over, not only the refresh-token one: the clerk is
   * audience-neutral and holds the pair, and revoking a session deletes the access token rows of
   * the series as well as revoking its refresh tokens.
   *
   * @returns {SessionClerk} Session clerk over the staff token tables.
   */
  static createSessionClerk () {
    return this.SessionClerkCtor.create({
      AccessTokenModel: this.StaffMemberAccessTokenCtor,
      RefreshTokenModel: this.StaffMemberRefreshTokenCtor,
    })
  }

  /**
   * get: Class itself — reach own statics through the instance.
   *
   * @returns {typeof SignOutMutationResolver} The class.
   */
  get Ctor () {
    return /** @type {typeof SignOutMutationResolver} */ (this.constructor)
  }

  /**
   * Resolve the operation.
   *
   * No transaction is opened here. The whole write is the session, so
   * `SessionClerk#revokeSession()` is called without one and self-resolves its own — the shape the
   * convention gives a resolver whose only write is the session. The cookie is not part of any
   * transaction either, so it is cleared after the revocation has committed.
   *
   * @override
   * @param {{
   *   context: StaffGraphqlContext
   * }} params - Parameters.
   * @returns {Promise<server.graphql.staff.SignOutResult>} Whether the caller was signed out.
   * @throws {Error} No live session was presented, or the revocation did not land.
   * @public
   */
  async resolve ({
    context,
  }) {
    const cookieClerk = this.createRefreshTokenCookieClerk({
      context,
    })

    const refreshToken = cookieClerk.extractRefreshToken()

    const refreshTokenEntity = await this.findRefreshToken({
      refreshToken,
    })

    // No cookie was presented, or the one presented matches no row.
    if (!refreshTokenEntity) {
      throw this.errorHash.SessionNotFound.create()
    }

    // The row is there but is spent, revoked or expired. The model answers all three in one call,
    // and the refusal is the same one above, so the caller cannot tell the four cases apart.
    if (
      !refreshTokenEntity.isAvailable({
        pointsAt: context.now,
      })
    ) {
      throw this.errorHash.SessionNotFound.create()
    }

    const revokingResult = await this.revokeSession({
      sessionKey: refreshTokenEntity.sessionKey,
      now: context.now,
    })

    if (revokingResult.hasError()) {
      throw this.errorHash.FailedToRevokeSession.create()
    }

    cookieClerk.clearRefreshTokenCookie()

    return this.formatResponse()
  }

  /**
   * Create the cookie clerk this request's refresh-token cookie is driven through.
   *
   * Built from the context rather than injected: a resolver that manages a session receives the
   * context in `resolve()` and drives the cookie through a clerk built from it.
   *
   * @param {{
   *   context: StaffGraphqlContext
   * }} params - Parameters.
   * @returns {RefreshTokenExpressCookieClerk} Cookie clerk of this request.
   */
  createRefreshTokenCookieClerk ({
    context,
  }) {
    return this.Ctor.RefreshTokenExpressCookieClerkCtor.create({
      context,
    })
  }

  /**
   * Find the refresh token row a presented token belongs to, live or not.
   *
   * The presented value is never hashed or matched here — `SessionClerk` is this project's single
   * window on session data, and the digest the table stores is its business alone.
   *
   * @param {{
   *   refreshToken: string | null
   * }} params - Parameters.
   * @returns {Promise<StaffMemberRefreshToken | null>} Refresh token row, or null when the token matches nothing.
   */
  async findRefreshToken ({
    refreshToken,
  }) {
    return /** @type {*} */ (
      this.sessionClerk.findRefreshToken({
        refreshToken,
      })
    )
  }

  /**
   * Revoke a whole session — every refresh token of the series, and every access token it handed
   * out.
   *
   * Reports rather than throws: the outcome is read off the returned result.
   *
   * @param {{
   *   sessionKey: string
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<RevokingSessionResult>} The error (null on success) and the counts.
   */
  async revokeSession ({
    sessionKey,
    now,
  }) {
    return this.sessionClerk.revokeSession({
      sessionKey,
      now,
    })
  }

  /**
   * Format the response.
   *
   * **`signedOut` is always `true`, and the operation has no false case.** Every refusal above
   * throws, so a caller that receives a result at all has had its series revoked and its cookie
   * cleared. The field is a `Boolean!` because the pinned contract types it so and because a
   * GraphQL result type cannot be empty — not because there is a second answer to give.
   *
   * @returns {server.graphql.staff.SignOutResult} Whether the caller was signed out.
   */
  formatResponse () {
    return {
      signedOut: true,
    }
  }
}

/**
 * @typedef {import('../../../../contexts/StaffGraphqlContext.js').default} StaffGraphqlContext
 */

/**
 * @typedef {import('../../../../../../app/session/RevokingSessionResult.js').default} RevokingSessionResult
 */

/**
 * @typedef {{
 *   sessionClerk: SessionClerk
 *   errorHash: Record<string, typeof import('@openreachtech/renchan').RenchanGraphqlError>
 * }} SignOutMutationResolverParams
 */

/**
 * @typedef {{
 *   sessionClerk?: SessionClerk
 *   errorCodeHash?: Record<string, string>
 * }} SignOutMutationResolverFactoryParams
 */
