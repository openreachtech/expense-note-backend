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
 * `Asia/Tokyo` is **Q49's answer, decided by a person rather than assumed.** It was put as its own
 * question and answered as itself, not waved through on a standing approval — which matters,
 * because a zone nobody chose is exactly what this constant exists to prevent.
 *
 * **Who decided it is worth keeping here rather than flattening to "decided".** The answer came
 * back through the peer session driving this work, from *that* session's user. The session holding
 * this repository never put Q49 to its own user, so a reader tracing the decision should look
 * there and not assume the two are the same person. The value was already `Asia/Tokyo` as the
 * recommended reading, so nothing observable changed when the answer arrived — only its standing.
 *
 * **The spec still does not say it.** Neither `.env.development`, `.env.live` nor
 * `sequelize/config.cjs` names a zone either, so this file remains the only place it is written
 * down. That gap is proposed as its own pull request against `specs/`, because a business rule
 * living only in a backend constant is how the next reader learns the product's timezone from a
 * comparison operator. Until it merges, this comment is the record.
 *
 * If it were ever to change, this value changes and nothing else does: the comparison lives in
 * `app/tools/calendar/CalendarDateInspector.js`, which reads the zone from here rather than naming
 * one of its own — with the one exception that the test asserting the default carries the literal
 * too, deliberately, since a test reading the value under test would assert nothing.
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
