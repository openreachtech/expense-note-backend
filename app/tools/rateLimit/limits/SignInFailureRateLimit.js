import BaseRateLimit from '../BaseRateLimit.js'

import SignInAttempt from '../../../../sequelize/models/SignInAttempt.js'

import RATE_LIMIT_CONSTANT_HASH from '../../../constants/rateLimitConstants.js'

const {
  RATE_LIMIT,
} = RATE_LIMIT_CONSTANT_HASH

/**
 * The sign-in limit: ten failed attempts per fifteen minutes for one email address (spec
 * section 7). The key is the address, not the caller's IP address, because the staff sit behind
 * one office address and an IP-keyed limit would let one person's wrong password lock out
 * everybody.
 *
 * **A successful sign-in counts for nothing, and no rule here says so.** The count reads
 * `sign_in_attempts`, and that table holds failed attempts only (spec section 10.3) — so there is
 * no "was it successful" to branch on, and adding one would invent a distinction the table does
 * not carry.
 *
 * The address is normalized before the query, through the same function the table's own write
 * hook uses. `SignInAttempt` normalizes on the way in and a hook cannot normalize a read, so a
 * count taken on the address as typed would count against a value no row holds:
 * `Anna@example.com` and `anna@example.com` would each get their own ten attempts.
 *
 * @augments {BaseRateLimit}
 */
export default class SignInFailureRateLimit extends BaseRateLimit {
  /**
   * get: Model whose rows this limit counts.
   *
   * @override
   * @returns {typeof SignInAttempt} Model declaration.
   */
  get EventModel () {
    return SignInAttempt
  }

  /**
   * get: Name of the attribute the counted key matches.
   *
   * @override
   * @returns {string} Attribute name.
   */
  get keyFieldName () {
    return 'email'
  }

  /**
   * get: Name of the attribute carrying the instant a counted event happened.
   *
   * @override
   * @returns {string} Attribute name.
   */
  get timestampFieldName () {
    return 'attemptedAt'
  }

  /**
   * get: Length of the window, in milliseconds.
   *
   * @override
   * @returns {number} Milliseconds.
   */
  get windowMilliseconds () {
    return RATE_LIMIT.SIGN_IN_FAILURE.WINDOW_MILLISECONDS
  }

  /**
   * get: Number of failed attempts one address may accumulate inside one window.
   *
   * @override
   * @returns {number} Number of events.
   */
  get maxEventCount () {
    return RATE_LIMIT.SIGN_IN_FAILURE.MAX_EVENT_COUNT
  }

  /**
   * get: Model defining what an address's normalized form is.
   *
   * Reached through the counted model's own seam rather than imported here, so the read and the
   * write cannot come to disagree about what one address is: if they did, this limit would count
   * nothing.
   *
   * @returns {typeof import('../../../../sequelize/models/StaffMemberSecret.js').default} Model declaration.
   */
  get StaffMemberSecretModel () {
    return this.EventModel.StaffMemberSecretModel
  }

  /**
   * Generate the stored form of an email address.
   *
   * @override
   * @param {{
   *   key: string
   * }} params - Parameters.
   * @returns {string} The address as `sign_in_attempts` holds it.
   */
  generateStoredKey ({
    key,
  }) {
    return this.StaffMemberSecretModel.generateNormalizedEmail({
      email: key,
    })
  }
}
