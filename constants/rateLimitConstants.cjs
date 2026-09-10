'use strict'

const MILLISECONDS_PER_MINUTE = 60000

/*
 * Window and threshold of each rate limit spec section 7 declares.
 *
 * `SIGN_IN_FAILURE` counts **failed** sign-ins for one email address — keyed on the address
 * rather than the caller's address, because the staff sit behind one office address and an
 * IP-keyed limit would let one person's wrong password lock out everybody. A successful sign-in
 * counts for nothing, which needs no rule here: the count reads `sign_in_attempts`, and that
 * table holds failures only (spec section 10.3).
 *
 * `ACCESS_TOKEN_RENEWAL` counts renewals of one refresh-token series — roughly fifteen times
 * normal use, which is one renewal per fifteen-minute access token.
 *
 * The two are the only operations reachable without a session, and the only two limited at 1.0.0.
 * A limit added later adds a key here rather than a literal at a call site.
 */
module.exports = {
  RATE_LIMIT: {
    SIGN_IN_FAILURE: {
      WINDOW_MILLISECONDS: 15 * MILLISECONDS_PER_MINUTE,
      MAX_EVENT_COUNT: 10,
    },
    ACCESS_TOKEN_RENEWAL: {
      WINDOW_MILLISECONDS: 60 * MILLISECONDS_PER_MINUTE,
      MAX_EVENT_COUNT: 60,
    },
  },
}
