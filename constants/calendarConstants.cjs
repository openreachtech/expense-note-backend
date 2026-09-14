'use strict'

/*
 * The timezone every calendar date in this product is read in.
 *
 * A `spent_on` date crosses the contract as a `YYYY-MM-DD` string, while the clock a resolver
 * holds is an instant. Deciding whether an expense "is dated after today" (spec section 11) means
 * reading that instant as a calendar date, and the zones disagree for part of every day: at
 * `2026-09-14T22:00:00.000Z` it is already the 15th in Tokyo and still the 14th in UTC. Read in
 * UTC, a member of staff recording this morning's train fare is told the date is in the future —
 * for the first nine hours of every working day.
 *
 * `Asia/Tokyo` is **Q49's recommended reading, not a decision the user has confirmed.** The spec
 * names no zone, and neither does `.env.development`, `.env.live` or `sequelize/config.cjs`. If
 * the answer comes back different, this value changes and nothing else does: the comparison lives
 * in `app/tools/calendar/CalendarDateInspector.js`, which reads the zone from here rather than
 * naming one of its own.
 *
 * `#monthly-summary` inherits the same choice. Section 6 defines a month as the calendar month an
 * expense's date falls in, which means one thing only once a zone is fixed — so the month boundary
 * reads the zone from here too. Answering it differently there would let an expense's month
 * disagree with its own acceptance.
 */
module.exports = {
  CALENDAR: {
    TIMEZONE: 'Asia/Tokyo',
  },
}
