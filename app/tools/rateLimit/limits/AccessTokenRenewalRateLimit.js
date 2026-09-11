import BaseRateLimit from '../BaseRateLimit.js'

import StaffMemberRefreshToken from '../../../../sequelize/models/StaffMemberRefreshToken.js'

import RATE_LIMIT_CONSTANT_HASH from '../../../constants/rateLimitConstants.js'

const {
  RATE_LIMIT,
} = RATE_LIMIT_CONSTANT_HASH

/**
 * The renewal limit: sixty renewals per hour for one refresh-token series (spec section 7) —
 * roughly fifteen times normal use, which is one renewal per fifteen-minute access token.
 *
 * **This limit needs no table of its own, and that is deliberate.** Every rotation inserts a
 * refresh-token row carrying `sessionKey` and `generatedAt`, so a series' rows inside the last
 * hour already *are* its renewal count. The row `signIn` itself mints is one of them, which is one
 * out of sixty and is the honest count of what the series cost.
 *
 * The key needs no normalization: a session key is minted hex (`SessionCredentialGenerator`),
 * never anything a caller typed, so the value queried is the value stored.
 *
 * @augments {BaseRateLimit}
 */
export default class AccessTokenRenewalRateLimit extends BaseRateLimit {
  /**
   * get: Model whose rows this limit counts.
   *
   * @override
   * @returns {typeof StaffMemberRefreshToken} Model declaration.
   */
  get EventModel () {
    return StaffMemberRefreshToken
  }

  /**
   * get: Name of the attribute the counted key matches.
   *
   * @override
   * @returns {string} Attribute name.
   */
  get keyFieldName () {
    return 'sessionKey'
  }

  /**
   * get: Name of the attribute carrying the instant a counted event happened.
   *
   * @override
   * @returns {string} Attribute name.
   */
  get timestampFieldName () {
    return 'generatedAt'
  }

  /**
   * get: Length of the window, in milliseconds.
   *
   * @override
   * @returns {number} Milliseconds.
   */
  get windowMilliseconds () {
    return RATE_LIMIT.ACCESS_TOKEN_RENEWAL.WINDOW_MILLISECONDS
  }

  /**
   * get: Number of renewals one series may accumulate inside one window.
   *
   * @override
   * @returns {number} Number of events.
   */
  get maxEventCount () {
    return RATE_LIMIT.ACCESS_TOKEN_RENEWAL.MAX_EVENT_COUNT
  }
}
