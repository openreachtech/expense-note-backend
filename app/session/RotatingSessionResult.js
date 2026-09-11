import SavingSessionResult from './SavingSessionResult.js'

/**
 * The outcome of rotating a session — a saving result that also carries whether the series was
 * revoked on the way out.
 *
 * A rotation has three outcomes where saving has two. It succeeds; it fails with nothing
 * written; or it **refuses a refresh token that is no longer presentable — already spent, revoked
 * or expired — and that refusal is itself a write**: every token in the series revoked.
 * `#hasError()` cannot tell the last two apart, so a transaction wrapper that reads it alone rolls
 * the revocation back with the very error that reports it: the series then reads as revoked in the
 * result and is still live in the database. `#shouldRollBack()` is the question a wrapper asks
 * instead.
 *
 * It extends `SavingSessionResult` rather than the base, so a caller reading `#credentialPair` /
 * `#hasError()` / `#extractErrorMessage()` off a rotation needs to know nothing about this class.
 *
 * @augments {SavingSessionResult}
 */
export default class RotatingSessionResult extends SavingSessionResult {
  /**
   * Constructor.
   *
   * @param {RotatingSessionResultParams} params - Parameters.
   */
  constructor ({
    response,
    error,
    revocation,
  }) {
    super({
      response,
      error,
    })

    this.revocation = revocation
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof RotatingSessionResult ? X : never} T, X
   * @param {RotatingSessionResultFactoryParams} params - Parameters.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   */
  static create ({
    response = null,
    error = null,
    revocation = null,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        response,
        error,
        revocation,
      })
    )
  }

  /**
   * Check whether this rotation took the series down with it.
   *
   * @returns {boolean} true: the series was revoked, and the revocation is written.
   * @public
   */
  hasRevokedSeries () {
    return this.revocation !== null
  }

  /**
   * Check whether the transaction this rotation ran in must be rolled back.
   *
   * A reported error is a reason to roll back only while the rotation wrote nothing worth
   * keeping. The refusal of a reused token is the one error whose write must survive it.
   *
   * @returns {boolean} true: roll the transaction back.
   * @public
   */
  shouldRollBack () {
    return this.hasError()
      && !this.hasRevokedSeries()
  }
}

/**
 * @typedef {{
 *   response: SessionCredentialPair | null
 *   error: Error | null
 *   revocation: SessionRevocationCounts | null
 * }} RotatingSessionResultParams
 */

/**
 * @typedef {{
 *   response?: SessionCredentialPair | null
 *   error?: Error | null
 *   revocation?: SessionRevocationCounts | null
 * }} RotatingSessionResultFactoryParams
 */

/**
 * @typedef {import('./SessionClerk.js').SessionCredentialPair} SessionCredentialPair
 */

/**
 * @typedef {import('./RevokingSessionResult.js').SessionRevocationCounts} SessionRevocationCounts
 */
