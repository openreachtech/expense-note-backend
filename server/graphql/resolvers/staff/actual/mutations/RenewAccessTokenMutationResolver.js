import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import SessionClerk from '../../../../../../app/session/SessionClerk.js'

import AccessTokenRenewalRateLimit from '../../../../../../app/tools/rateLimit/limits/AccessTokenRenewalRateLimit.js'

import StaffMemberAccessToken from '../../../../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberRefreshToken from '../../../../../../sequelize/models/StaffMemberRefreshToken.js'

import RefreshTokenExpressCookieClerk from '../../../../contexts/tools/RefreshTokenExpressCookieClerk.js'

/**
 * Resolver of the `renewAccessToken` mutation.
 *
 * Spends the refresh token the request presents as a cookie, issues the next pair in the same
 * series, hands the new refresh token back as an httpOnly cookie and returns the fresh access
 * token in the body (spec sections 10.1 and 9.7). The refresh token itself never appears in a
 * response body, and nothing here returns or logs a token, a digest, a session key or an address
 * (section 7).
 *
 * **This operation authenticates itself.** It names itself in the engine's
 * `schemasToSkipFiltering`, because it is what re-establishes a session and so has to work once
 * the access token has expired — so no authentication filter runs, `context.staffMember` is null
 * as a matter of course, and the cookie is the only credential there is.
 *
 * **One refusal for four states.** A refresh-token cookie that is absent, or that matches no row,
 * or that is expired, revoked or already spent is refused as `RefreshTokenUnavailable` and
 * nothing else: section 10 requires the refusal to reveal which it was in none of them. The
 * single code is what makes that true here, and `SessionClerk#spendRefreshToken()`'s guard — the
 * model's own `#isAvailable()` written as a `where` clause — is what makes it true one layer
 * down, where the three live states all land on one branch. Neither layer branches on which of
 * them it was, and no message names one.
 *
 * **A rate-limit refusal is the one refusal that legitimately differs**, and carries a code of
 * its own. Section 10 requires the four *credential* states be indistinguishable from each other;
 * "too frequent" is not one of them, and a caller learning they are rate-limited learns nothing
 * about whose sessions exist.
 *
 * **No transaction of its own.** The only write of the request is the session, so
 * `SessionClerk#rotateSession()` is called without a transaction and self-resolves one
 * (`#invokeRotateSession()`), which is where the rollback question already has its answer:
 * `RotatingSessionResult#shouldRollBack()`, never `#hasError()`. The refusal of a token that is
 * no longer presentable *is itself a write* — the whole series revoked — and a wrapper rolling
 * back on `#hasError()` would discard it and leave a stolen cookie's series live. `#hasError()`
 * is read below only to name the refusal, which is the resolver's job and not a rollback
 * decision.
 *
 * @augments {BaseMutationResolver}
 */
export default class RenewAccessTokenMutationResolver extends BaseMutationResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'renewAccessToken'
  }

  /**
   * get: Error code hash.
   *
   * Both codes sit in the `204` family: this project's refusals of a credential the database did
   * not yield are database errors, and a policy refusal has no family of its own in the
   * convention, so it takes the nearest fit with a sequence number and a name of its own.
   *
   * `M003` is this operation's id in `server/graphql/resolver-id-hash-staff.js`.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,

      // Database errors
      // One code for every dead credential state — absent, unknown, expired, revoked, spent.
      RefreshTokenUnavailable: '204.M003.001',

      // Policy refusals
      // Section 7: sixty renewals per hour for one refresh-token series.
      TooFrequentRenewal: '204.M003.002',
    }
  }

  /**
   * get: AccessTokenRenewalRateLimit class — a seam so tests can substitute it.
   *
   * @returns {typeof AccessTokenRenewalRateLimit} The class.
   */
  static get AccessTokenRenewalRateLimitCtor () {
    return AccessTokenRenewalRateLimit
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
   * Resolve the operation.
   *
   * The operation takes no argument: spec section 10.1 declares `RenewAccessTokenInput()` with no
   * fields, and the convention gives an operation with no input no argument at all. So there is
   * no input to validate, and no `203.*` code.
   *
   * **The order of the three steps is the security-relevant part.** The lookup comes first
   * because the rate limit is keyed on the series, and the series is only known once the
   * presented token has been found. The limit comes before the rotation because a rotation mints
   * a row and a refusal revokes a series, and both are writes an unbounded caller must not be
   * able to ask for freely.
   *
   * A token found here is deliberately **not** pre-checked for liveness. The guard inside
   * `SessionClerk#spendRefreshToken()` is evaluated by the database at the moment of the write,
   * so it cannot be raced; a pre-check would be a second answer to one question, and refusing
   * here would skip the series revocation that a reuse has to cost.
   *
   * @override
   * @param {{
   *   context: StaffGraphqlContext
   * }} params - Parameters.
   * @returns {Promise<server.graphql.staff.RenewAccessTokenResult>} The freshly issued access token.
   * @throws {GraphqlType.Error} The presented refresh token is not one that can be spent, or the series renewed too often.
   * @public
   */
  async resolve ({
    context,
  }) {
    const cookieClerk = this.createRefreshTokenCookieClerk({
      context,
    })
    const presentedRefreshToken = cookieClerk.extractRefreshToken()

    const sessionClerk = this.createSessionClerk()
    const refreshTokenEntity = await sessionClerk.findRefreshToken({
      refreshToken: presentedRefreshToken,
    })

    if (!refreshTokenEntity) {
      throw this.errorHash.RefreshTokenUnavailable.create()
    }

    const hasRenewedTooOften = await this.hasReachedRenewalLimit({
      sessionKey: refreshTokenEntity.sessionKey,
      pointsAt: context.now,
    })

    if (hasRenewedTooOften) {
      throw this.errorHash.TooFrequentRenewal.create()
    }

    const rotatingResult = await sessionClerk.rotateSession({
      refreshTokenEntity,
      now: context.now,
    })

    if (rotatingResult.hasError()) {
      throw this.errorHash.RefreshTokenUnavailable.create()
    }

    const {
      credentialPair,
    } = rotatingResult

    cookieClerk.saveRefreshTokenCookie({
      refreshToken: credentialPair.refreshToken,
    })

    return this.formatResponse({
      accessTokenEntity: credentialPair.accessTokenEntity,
    })
  }

  /**
   * Create the clerk that reads and writes the refresh-token cookie of this request.
   *
   * Built from the context rather than injected: the cookie belongs to the request, and only the
   * session operations may touch it.
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
   * Create the session clerk this operation reads and rotates sessions through.
   *
   * Both token models are handed over, because the clerk is audience-neutral and holds the pair.
   *
   * @returns {SessionClerk} Session clerk over the staff token tables.
   */
  createSessionClerk () {
    return this.Ctor.SessionClerkCtor.create({
      AccessTokenModel: this.Ctor.StaffMemberAccessTokenCtor,
      RefreshTokenModel: this.Ctor.StaffMemberRefreshTokenCtor,
    })
  }

  /**
   * Whether this series has already renewed as often as one hour allows.
   *
   * The window and the count of sixty are the limit's own (spec section 7), read from it rather
   * than restated here.
   *
   * @param {{
   *   sessionKey: string
   *   pointsAt: Date
   * }} params - Parameters.
   * @returns {Promise<boolean>} true: this series may renew no further inside the window.
   */
  async hasReachedRenewalLimit ({
    sessionKey,
    pointsAt,
  }) {
    const rateLimit = this.createAccessTokenRenewalRateLimit({
      pointsAt,
    })

    return rateLimit.hasReachedMaxEventCount({
      key: sessionKey,
    })
  }

  /**
   * Create the renewal rate limit, ending its window at this request's own instant.
   *
   * @param {{
   *   pointsAt: Date
   * }} params - Parameters.
   * @returns {AccessTokenRenewalRateLimit} Renewal rate limit.
   */
  createAccessTokenRenewalRateLimit ({
    pointsAt,
  }) {
    return this.Ctor.AccessTokenRenewalRateLimitCtor.create({
      pointsAt,
    })
  }

  /**
   * Format the response — the freshly issued access token, and nothing else.
   *
   * The new refresh token is not here and never will be: it reaches the browser as an httpOnly
   * cookie alone (spec sections 9.7 and 10.1).
   *
   * @param {{
   *   accessTokenEntity: import('../../../../../../app/session/SessionClerk.js').AccessTokenEntity
   * }} params - Parameters.
   * @returns {server.graphql.staff.RenewAccessTokenResult} The freshly issued access token.
   */
  formatResponse ({
    accessTokenEntity,
  }) {
    return {
      accessToken: accessTokenEntity.accessToken,
    }
  }
}

/**
 * @typedef {import('../../../../contexts/StaffGraphqlContext.js').default} StaffGraphqlContext
 */
