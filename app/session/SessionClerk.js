import {
  Op,
} from 'sequelize'

import SessionCredentialGenerator from './SessionCredentialGenerator.js'
import SavingSessionResult from './SavingSessionResult.js'
import RotatingSessionResult from './RotatingSessionResult.js'
import RevokingSessionResult from './RevokingSessionResult.js'

/*
 * One message for all three ways a presented refresh token can be dead — already spent, revoked,
 * expired. It names none of them on purpose: spec section 10 refuses the three identically, and
 * "the refusal reveals which of the three it was in none of them".
 */
const UNAVAILABLE_REFRESH_TOKEN_MESSAGE = 'The refresh token could not be spent'

/**
 * The single window for a session's data — every find / save / update / delete across the tables a
 * session is made of (access tokens + refresh tokens). Callers depend only on this class and never
 * touch the tables themselves.
 *
 * The tables are injected, not imported, so both audiences share one implementation. Each public
 * write opens its own transaction and reports the outcome as `{ error, … }`: the saving logic is
 * throwable, so a throw rolls the transaction back and is handed back as `error` (null on success)
 * — callers read `error` and never have the exception thrown at them. Error-naming is left to the
 * resolver.
 */
export default class SessionClerk {
  /**
   * Constructor.
   *
   * @param {SessionClerkParams} params - Parameters.
   */
  constructor ({
    AccessTokenModel,
    RefreshTokenModel,
    credentialGenerator,
  }) {
    this.AccessTokenModel = AccessTokenModel
    this.RefreshTokenModel = RefreshTokenModel
    this.credentialGenerator = credentialGenerator
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof SessionClerk ? X : never} T, X
   * @param {SessionClerkFactoryParams} params - Parameters.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   */
  static create ({
    AccessTokenModel,
    RefreshTokenModel,
    credentialGenerator = this.createCredentialGenerator(),
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        AccessTokenModel,
        RefreshTokenModel,
        credentialGenerator,
      })
    )
  }

  /**
   * get: RevokingSessionResult class — a seam so tests can substitute it.
   *
   * @returns {typeof RevokingSessionResult} The class.
   */
  static get RevokingSessionResultCtor () {
    return RevokingSessionResult
  }

  /**
   * get: RotatingSessionResult class — a seam so tests can substitute it.
   *
   * @returns {typeof RotatingSessionResult} The class.
   */
  static get RotatingSessionResultCtor () {
    return RotatingSessionResult
  }

  /**
   * get: SavingSessionResult class — a seam so tests can substitute it.
   *
   * @returns {typeof SavingSessionResult} The class.
   */
  static get SavingSessionResultCtor () {
    return SavingSessionResult
  }

  /**
   * get: SessionCredentialGenerator class — a seam so tests can substitute it.
   *
   * @returns {typeof SessionCredentialGenerator} The class.
   */
  static get SessionCredentialGeneratorCtor () {
    return SessionCredentialGenerator
  }

  /**
   * Create session credential clerk.
   *
   * @returns {SessionCredentialGenerator} Session credential clerk.
   */
  static createCredentialGenerator () {
    return this.SessionCredentialGeneratorCtor.create()
  }

  /**
   * Create a revoking-session result.
   *
   * @param {{
   *   response?: import('./RevokingSessionResult.js').SessionRevocationCounts | null
   *   error?: Error | null
   * }} params - Parameters.
   * @returns {RevokingSessionResult} The revoking-session result.
   */
  static createRevokingSessionResult ({
    response = null,
    error = null,
  }) {
    return this.RevokingSessionResultCtor.create({
      response,
      error,
    })
  }

  /**
   * Create a rotating-session result.
   *
   * @param {{
   *   response?: SessionCredentialPair | null
   *   error?: Error | null
   *   revocation?: import('./RevokingSessionResult.js').SessionRevocationCounts | null
   * }} params - Parameters.
   * @returns {RotatingSessionResult} The rotating-session result.
   */
  static createRotatingSessionResult ({
    response = null,
    error = null,
    revocation = null,
  }) {
    return this.RotatingSessionResultCtor.create({
      response,
      error,
      revocation,
    })
  }

  /**
   * Create a saving-session result.
   *
   * @param {{
   *   response?: SessionCredentialPair | null
   *   error?: Error | null
   * }} params - Parameters.
   * @returns {SavingSessionResult} The saving-session result.
   */
  static createSavingSessionResult ({
    response = null,
    error = null,
  }) {
    return this.SavingSessionResultCtor.create({
      response,
      error,
    })
  }

  /**
   * get: Class itself — reach own statics through the instance.
   *
   * @returns {typeof SessionClerk} The class.
   */
  get Ctor () {
    return /** @type {typeof SessionClerk} */ (this.constructor)
  }

  /**
   * Start a session's token pair, in a series of its own. Never throws — the outcome is always a
   * `SavingSessionResult`. Pass a `transaction` to join an outer one (the caller then decides
   * rollback via `result.hasError()`); omit it to self-resolve a transaction here.
   *
   * @param {{
   *   userId: number
   *   now: Date
   *   sessionKey?: string
   *   transaction?: Transaction | null
   * }} params - Parameters.
   * @returns {Promise<SavingSessionResult>} The error (null on success) and the saved pair.
   * @public
   */
  async saveSession ({
    userId,
    now,
    sessionKey = this.credentialGenerator.generateSessionKey(),
    transaction = null,
  }) {
    if (!transaction) {
      return this.invokeSaveSession({
        userId,
        sessionKey,
        now,
      })
    }

    try {
      const credentialPair = await this.saveTokenPair({
        userId,
        sessionKey,
        now,
        transaction,
      })

      return this.Ctor.createSavingSessionResult({
        response: credentialPair,
      })
    } catch (error) {
      return this.Ctor.createSavingSessionResult({
        error,
      })
    }
  }

  /**
   * Invoke `saveSession` inside a transaction resolved here, rolling back on a reported error.
   *
   * @param {{
   *   userId: number
   *   sessionKey: string
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<SavingSessionResult>} The error (null on success) and the saved pair.
   */
  async invokeSaveSession ({
    userId,
    sessionKey,
    now,
  }) {
    try {
      return await this.AccessTokenModel
        .beginTransaction(async transaction => {
          const result = await this.saveSession({
            userId,
            sessionKey,
            now,
            transaction,
          })

          if (result.hasError()) {
            throw result.error
          }

          return result
        })
    } catch (error) {
      return this.Ctor.createSavingSessionResult({
        error,
      })
    }
  }

  /**
   * Save both halves of a pair within a series. Throwable; runs inside a caller-opened transaction.
   *
   * @param {{
   *   userId: number
   *   sessionKey: string
   *   now: Date
   *   transaction: Transaction
   * }} params - Parameters.
   * @returns {Promise<SessionCredentialPair>} The saved pair, plus the plain refresh token.
   */
  async saveTokenPair ({
    userId,
    sessionKey,
    now,
    transaction,
  }) {
    const refreshToken = this.credentialGenerator.generateToken()

    const accessTokenEntity = await this.saveAccessToken({
      userId,
      sessionKey,
      now,
      transaction,
    })

    const refreshTokenEntity = await this.saveRefreshToken({
      userId,
      sessionKey,
      refreshToken,
      now,
      transaction,
    })

    return {
      accessTokenEntity,
      refreshTokenEntity,
      refreshToken,
    }
  }

  /**
   * Save the access token half of a pair.
   *
   * @param {{
   *   userId: number
   *   sessionKey: string
   *   now: Date
   *   transaction: Transaction
   * }} params - Parameters.
   * @returns {Promise<AccessTokenEntity>} The saved access token entity.
   */
  async saveAccessToken ({
    userId,
    sessionKey,
    now,
    transaction,
  }) {
    const accessTokenEntity = this.AccessTokenModel.buildWithGeneratedAttributes({
      userId,
      sessionKey,
      generatedAt: now,
    })

    return /** @type {Promise<AccessTokenEntity>} */ (
      accessTokenEntity.save({
        transaction,
      })
    )
  }

  /**
   * Save the refresh token half of a pair.
   *
   * @param {{
   *   userId: number
   *   sessionKey: string
   *   refreshToken: string
   *   now: Date
   *   transaction: Transaction
   * }} params - Parameters.
   * @returns {Promise<RefreshTokenEntity>} The saved refresh token entity.
   */
  async saveRefreshToken ({
    userId,
    sessionKey,
    refreshToken,
    now,
    transaction,
  }) {
    const refreshTokenEntity = this.RefreshTokenModel.buildWithGeneratedAttributes({
      userId,
      sessionKey,
      refreshToken,
      generatedAt: now,
    })

    return /** @type {Promise<RefreshTokenEntity>} */ (
      refreshTokenEntity.save({
        transaction,
      })
    )
  }

  /**
   * Find the row a presented access token may authenticate as, refusing one that is no longer
   * live.
   *
   * The presented value is matched as it arrives, because §9.6 stores the token in the clear
   * under a unique index. The asymmetry with `#findRefreshToken()`, which hashes first, is the
   * design and not an oversight: fifteen minutes of life is what earns it.
   *
   * The liveness rule is not restated here — the row answers it, through
   * `#isAvailable({ pointsAt })` on the access token model. A lookup that handed the row back
   * without asking would authenticate every token ever issued, forever.
   *
   * @param {{
   *   accessToken: string | null
   *   pointsAt: Date
   * }} params - Parameters.
   * @returns {Promise<AccessTokenEntity | null>} Access token row, or null when it matches nothing or is no longer live.
   * @public
   */
  async findAvailableAccessToken ({
    accessToken,
    pointsAt,
  }) {
    const entity = await this.findAccessToken({
      accessToken,
    })

    if (!entity) {
      return null
    }

    if (
      !entity.isAvailable({
        pointsAt,
      })
    ) {
      return null
    }

    return entity
  }

  /**
   * Find the row a presented access token belongs to, live or expired.
   *
   * Reads the table and nothing more, so the liveness check above has a seam under it and this
   * one method holds the only query on `staff_member_access_tokens`.
   *
   * @param {{
   *   accessToken: string | null
   * }} params - Parameters.
   * @returns {Promise<AccessTokenEntity | null>} Access token row, or null when it matches nothing.
   */
  async findAccessToken ({
    accessToken,
  }) {
    if (!accessToken) {
      return null
    }

    const entity = /** @type {AccessTokenEntity | null} */ (
      await this.AccessTokenModel.findOne({
        where: {
          accessToken,
        },
      })
    )

    return entity
      ?? null
  }

  /**
   * Find the row a presented refresh token belongs to.
   *
   * The presented value is hashed before the lookup, because the table stores digests.
   *
   * @param {{
   *   refreshToken: string | null
   * }} params - Parameters.
   * @returns {Promise<RefreshTokenEntity | null>} Refresh token entity, or null when it matches nothing.
   * @public
   */
  async findRefreshToken ({
    refreshToken,
  }) {
    if (!refreshToken) {
      return null
    }

    const entity = /** @type {RefreshTokenEntity | null} */ (
      await this.RefreshTokenModel.findOne({
        where: {
          tokenHash: this.RefreshTokenModel.hashToken({
            token: refreshToken,
          }),
        },
      })
    )

    return entity
      ?? null
  }

  /**
   * Rotate a session: spend the presented refresh token and issue the next pair in the same series.
   * Never throws — the outcome is always a `RotatingSessionResult`, which is a
   * `SavingSessionResult` with one extra fact on it. Pass a `transaction` to join an outer one;
   * omit it to self-resolve.
   *
   * A presented token that is no longer presentable — already spent, revoked, or expired — is
   * refused, and the three are refused identically (section 10). Nothing dead is ever rotated
   * into a live session: `#spendRefreshToken()`'s guard is what decides that, at the moment of the
   * write, so a caller needs no pre-check of its own to be safe.
   *
   * **A caller that supplies a transaction decides rollback by `result.shouldRollBack()`, not by
   * `result.hasError()`.** That refusal takes the whole series down, and the revocation is written
   * into this very transaction — so rolling back on `hasError()` alone would discard it and leave
   * a stolen cookie's series live.
   *
   * @param {{
   *   refreshTokenEntity: RefreshTokenEntity
   *   now: Date
   *   transaction?: Transaction | null
   * }} params - Parameters.
   * @returns {Promise<RotatingSessionResult>} The error (null on success), the next pair, and the revocation a refusal wrote.
   * @public
   */
  async rotateSession ({
    refreshTokenEntity,
    now,
    transaction = null,
  }) {
    if (!transaction) {
      return this.invokeRotateSession({
        refreshTokenEntity,
        now,
      })
    }

    try {
      const [updatedCount] = await this.spendRefreshToken({
        tokenHash: refreshTokenEntity.tokenHash,
        now,
        transaction,
      })

      if (updatedCount === 0) {
        return this.revokeUnavailableSeries({
          sessionKey: refreshTokenEntity.sessionKey,
          now,
          transaction,
        })
      }

      const credentialPair = await this.saveTokenPair({
        userId: refreshTokenEntity.extractUserId(),
        sessionKey: refreshTokenEntity.sessionKey,
        now,
        transaction,
      })

      return this.Ctor.createRotatingSessionResult({
        response: credentialPair,
      })
    } catch (error) {
      return this.Ctor.createRotatingSessionResult({
        error,
      })
    }
  }

  /**
   * Invoke `rotateSession` inside a transaction resolved here, rolling back on an error that
   * wrote nothing worth keeping.
   *
   * **Rollback is decided by `#shouldRollBack()`, never by `#hasError()`.** The refusal of a
   * refresh token that is no longer presentable reports an error and revokes the series in the
   * same breath, inside this transaction; throwing on it would roll the revocation back, and the
   * series would read as revoked in the returned result while staying live in the database. That
   * refusal therefore commits, and is handed back as the error it is.
   *
   * @param {{
   *   refreshTokenEntity: RefreshTokenEntity
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<RotatingSessionResult>} The error (null on success), the next pair, and the revocation a refusal wrote.
   */
  async invokeRotateSession ({
    refreshTokenEntity,
    now,
  }) {
    try {
      return await this.AccessTokenModel
        .beginTransaction(async transaction => {
          const result = await this.rotateSession({
            refreshTokenEntity,
            now,
            transaction,
          })

          if (result.shouldRollBack()) {
            throw result.error
          }

          return result
        })
    } catch (error) {
      return this.Ctor.createRotatingSessionResult({
        error,
      })
    }
  }

  /**
   * Mark a refresh token spent, so presenting it again is detectable. Keyed on the unique token
   * digest, and guarded so that **only a row that is still presentable can be marked** — it is
   * `usedAt: null` that makes a reuse detectable, and the other two conditions that keep a dead
   * token from being rotated into a live session at all. Throwable; runs inside a caller-opened
   * transaction.
   *
   * The three conditions are `StaffMemberRefreshToken#isAvailable()` written as a `where` clause,
   * and they are here rather than in a caller's pre-check for two reasons. A pre-check reads a row
   * loaded earlier, so two presentations of one cookie can both pass it; this clause is evaluated
   * by the database at the moment of the write. And the class that claims to be the single window
   * on session data cannot leave "is this session still alive" to whoever happens to call it.
   *
   * `expiredAt` is bounded with `Op.gt` rather than `Op.gte` so the instant a token expires counts
   * as expired — the same boundary the model draws, and never two answers to one question.
   *
   * Nothing distinguishes the three in the result: a spent, a revoked and an expired row all
   * update nothing and arrive at the same refusal, which is how section 10's identical refusals
   * hold by construction instead of by three code paths agreeing.
   *
   * @param {{
   *   tokenHash: string
   *   now: Date
   *   transaction: Transaction
   * }} params - Parameters.
   * @returns {Promise<[number]>} Sequelize bulk-update result: [number of rows marked spent].
   */
  async spendRefreshToken ({
    tokenHash,
    now,
    transaction,
  }) {
    return this.RefreshTokenModel.update(
      {
        usedAt: now,
      },
      {
        where: {
          tokenHash,
          usedAt: null,
          revokedAt: null,
          expiredAt: {
            [Op.gt]: now,
          },
        },
        transaction,
      }
    )
  }

  /**
   * Revoke the series whose refresh token turned out not to be presentable, and report the
   * refusal.
   *
   * Reached when `#spendRefreshToken()` marked nothing, which means the presented token was
   * already spent, or revoked, or expired. The name says *unavailable* rather than *reused*
   * because the branch cannot tell the three apart, and section 10 requires that it not.
   *
   * All three take the series down, and that is deliberate rather than incidental. A token
   * presented after it was spent is a leak, and the series it belongs to is what a leak costs —
   * neither the stolen cookie nor the session it was stolen from works again. The other two are
   * already dead: revoking a revoked series updates nothing, and a series whose refresh token has
   * expired has nothing left to protect, which is exactly what section 9.7's `revoked_at` is for.
   *
   * The revocation is written into the transaction that detected the refusal, and the returned
   * refusal carries it, so `#shouldRollBack()` answers false and that transaction commits. This
   * is the whole reason the refusal is not a bare error: an error alone would be thrown by
   * `#invokeRotateSession()`, and the throw would roll the revocation back.
   *
   * A revocation that itself fails is reported as a plain error with nothing carried, so the
   * transaction rolls back and the presented token stays refused on the next attempt too.
   *
   * @param {{
   *   sessionKey: string
   *   now: Date
   *   transaction: Transaction
   * }} params - Parameters.
   * @returns {Promise<RotatingSessionResult>} The refusal, carrying the revocation it wrote.
   */
  async revokeUnavailableSeries ({
    sessionKey,
    now,
    transaction,
  }) {
    const revokingResult = await this.revokeSession({
      sessionKey,
      now,
      transaction,
    })

    if (revokingResult.hasError()) {
      return this.Ctor.createRotatingSessionResult({
        error: revokingResult.error,
      })
    }

    return this.Ctor.createRotatingSessionResult({
      error: new Error(UNAVAILABLE_REFRESH_TOKEN_MESSAGE),
      revocation: revokingResult.revocation,
    })
  }

  /**
   * Revoke a whole session — every refresh token in it, and every access token it handed out.
   * Never throws — the outcome is always a `RevokingSessionResult`. Pass a `transaction` to join
   * an outer one (the caller then decides rollback via `result.hasError()`); omit it to self-resolve.
   *
   * @param {{
   *   sessionKey: string
   *   now: Date
   *   transaction?: Transaction | null
   * }} params - Parameters.
   * @returns {Promise<RevokingSessionResult>} The error (null on success) and the counts.
   * @public
   */
  async revokeSession ({
    sessionKey,
    now,
    transaction = null,
  }) {
    if (!transaction) {
      return this.invokeRevokeSession({
        sessionKey,
        now,
      })
    }

    try {
      const [revokedRefreshTokenCount] = await this.revokeAllRefreshTokens({
        sessionKey,
        now,
        transaction,
      })

      const deletedAccessTokenCount = await this.deleteAllAccessTokens({
        sessionKey,
        transaction,
      })

      const revocation = {
        revokedRefreshTokenCount,
        deletedAccessTokenCount,
      }

      return this.Ctor.createRevokingSessionResult({
        response: revocation,
      })
    } catch (error) {
      return this.Ctor.createRevokingSessionResult({
        error,
      })
    }
  }

  /**
   * Invoke `revokeSession` inside a transaction resolved here, rolling back on a reported error.
   *
   * @param {{
   *   sessionKey: string
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<RevokingSessionResult>} The error (null on success) and the counts.
   */
  async invokeRevokeSession ({
    sessionKey,
    now,
  }) {
    try {
      return await this.AccessTokenModel
        .beginTransaction(async transaction => {
          const result = await this.revokeSession({
            sessionKey,
            now,
            transaction,
          })

          if (result.hasError()) {
            throw result.error
          }

          return result
        })
    } catch (error) {
      return this.Ctor.createRevokingSessionResult({
        error,
      })
    }
  }

  /**
   * Revoke every refresh token still live in a session. Throwable; runs inside a caller-opened
   * transaction.
   *
   * @param {{
   *   sessionKey: string
   *   now: Date
   *   transaction: Transaction
   * }} params - Parameters.
   * @returns {Promise<[number]>} Sequelize bulk-update result: [number of refresh tokens revoked].
   */
  async revokeAllRefreshTokens ({
    sessionKey,
    now,
    transaction,
  }) {
    return this.RefreshTokenModel.update(
      {
        revokedAt: now,
      },
      {
        where: {
          sessionKey,
          revokedAt: null,
        },
        transaction,
      }
    )
  }

  /**
   * Delete every access token handed out by a session. Throwable; runs inside a caller-opened
   * transaction.
   *
   * Deleted rather than flagged — the row's absence already says it, with no extra column read on
   * the auth hot path.
   *
   * @param {{
   *   sessionKey: string
   *   transaction: Transaction
   * }} params - Parameters.
   * @returns {Promise<number>} Number of access token rows deleted.
   */
  async deleteAllAccessTokens ({
    sessionKey,
    transaction,
  }) {
    return this.AccessTokenModel.destroy({
      where: {
        sessionKey,
      },
      transaction,
    })
  }
}

/**
 * @typedef {import('sequelize').Transaction} Transaction
 */

/*
 * SessionClerk is a general module: it depends on the `RenchanModel` base plus the few custom members
 * it calls — not on any concrete app model. Existing base members (`save` / `findOne` / `update` /
 * `destroy` / `beginTransaction`) come from `RenchanModel` and are never re-declared here.
 */

/**
 * @typedef {import('@openreachtech/renchan-sequelize').RenchanModel & {
 *   accessToken: string
 *   sessionKey: string
 *   extractUserId: () => number
 *   isAvailable: (params: {
 *     pointsAt: Date
 *   }) => boolean
 * }} AccessTokenEntity
 */

/**
 * @typedef {import('@openreachtech/renchan-sequelize').RenchanModel & {
 *   tokenHash: string
 *   sessionKey: string
 *   extractUserId: () => number
 * }} RefreshTokenEntity
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-sequelize').RenchanModel & {
 *   buildWithGeneratedAttributes: (params: {
 *     userId: number
 *     sessionKey: string
 *     generatedAt: Date
 *   }) => AccessTokenEntity
 * }} AccessTokenModelClass
 */

/**
 * @typedef {typeof import('@openreachtech/renchan-sequelize').RenchanModel & {
 *   buildWithGeneratedAttributes: (params: {
 *     userId: number
 *     sessionKey: string
 *     refreshToken: string
 *     generatedAt: Date
 *   }) => RefreshTokenEntity
 *   hashToken: (params: {
 *     token: string
 *   }) => string
 * }} RefreshTokenModelClass
 */

/**
 * @typedef {{
 *   AccessTokenModel: AccessTokenModelClass
 *   RefreshTokenModel: RefreshTokenModelClass
 *   credentialGenerator: SessionCredentialGenerator
 * }} SessionClerkParams
 */

/**
 * @typedef {{
 *   AccessTokenModel: AccessTokenModelClass
 *   RefreshTokenModel: RefreshTokenModelClass
 *   credentialGenerator?: SessionCredentialGenerator
 * }} SessionClerkFactoryParams
 */

/**
 * The saved token records of one pair, plus the plain refresh token — the plaintext is not on the
 * record (only its digest is stored), so it is handed back alongside for the caller to set as a
 * cookie.
 *
 * @typedef {{
 *   accessTokenEntity: AccessTokenEntity
 *   refreshTokenEntity: RefreshTokenEntity
 *   refreshToken: string
 * }} SessionCredentialPair
 */
