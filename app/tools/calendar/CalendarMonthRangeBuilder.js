const FIRST_DAY_OF_MONTH = 1

const YEAR_DIGIT_COUNT = 4
const MONTH_DIGIT_COUNT = 2
const DAY_DIGIT_COUNT = 2

/**
 * One calendar month, and the two calendar dates that are its ends.
 *
 * Spec section 12 reads expenses a month at a time. The month reaches the database as a range over
 * `spentOn` — `{ [Op.between]: [firstCalendarDate, lastCalendarDate] }` — and this class is what
 * produces the two ends of it.
 *
 * **The range is why, not a preference.** Section 7 requires one member of staff's month to stay a
 * single indexed read, and section 9.3's index is the composite `(staff_member_id, spent_on)`. The
 * obvious alternative, `WHERE YEAR(spent_on) = ? AND MONTH(spent_on) = ?`, wraps the indexed column
 * in a function, which makes the predicate non-sargable and leaves the index unused — and SQLite
 * has no `YEAR()` / `MONTH()` at all, so the same query would need `strftime` there and not here.
 * A range over the bare column is the one predicate both dialects answer from the index.
 *
 * **This class takes no timezone, and that is deliberate.** Section 6 says a month is read in
 * `Asia/Tokyo`, so a reader arriving here will expect a zone and should be told why there is none.
 * `spentOn` is a Sequelize `DATEONLY` — a calendar date holding no instant and no zone — and the
 * first and last day of June 2026 are `2026-06-01` and `2026-06-30` in every timezone on earth. The
 * zone was already spent upstream, when `#expense-entry` chose a date from an instant. Holding one
 * here would change no output while implying a zone-dependence the data model does not have. Where
 * the zone genuinely still decides something is *which* month is the current one (section 12.2),
 * and `CalendarDateInspector#buildTodayCalendarDate()` answers that, in the right place.
 *
 * **Its own class rather than a member of `CalendarDateInspector`.** That class's one concept is a
 * single calendar date and the verdicts about it, and its `create()` requires a `calendarDate`. A
 * month range is about no single date, so reaching a method through it would mean inventing a date
 * the method then ignores. One class, one concept — and adding a class rather than widening one is
 * the charter's carve-on-a-slab principle.
 */
export default class CalendarMonthRangeBuilder {
  /**
   * Constructor.
   *
   * @param {CalendarMonthRangeBuilderParams} params - Parameters.
   */
  constructor ({
    year,
    month,
  }) {
    this.year = year
    this.month = month
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof CalendarMonthRangeBuilder ? X : never} T, X
   * @param {CalendarMonthRangeBuilderFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    year,
    month,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        year,
        month,
      })
    )
  }

  /**
   * Build the two ends of this calendar month.
   *
   * Both ends come from one call so that a caller cannot pair the first day of one month with the
   * last day of another.
   *
   * @returns {{
   *   firstCalendarDate: string
   *   lastCalendarDate: string
   * }} The first and the last day of this month, each as `YYYY-MM-DD`.
   * @public
   */
  buildCalendarDateRange () {
    const firstCalendarDate = this.generateFirstCalendarDate()
    const lastCalendarDate = this.generateLastCalendarDate()

    return {
      firstCalendarDate,
      lastCalendarDate,
    }
  }

  /**
   * Generate the first day of this calendar month.
   *
   * Every month begins on its first day, so no arithmetic is owed here.
   *
   * @returns {string} The first day of this month, as `YYYY-MM-DD`.
   * @public
   */
  generateFirstCalendarDate () {
    return this.generateCalendarDate({
      day: FIRST_DAY_OF_MONTH,
    })
  }

  /**
   * Generate the last day of this calendar month.
   *
   * @returns {string} The last day of this month, as `YYYY-MM-DD`.
   * @public
   */
  generateLastCalendarDate () {
    const day = this.generateLastDayOfMonth()

    return this.generateCalendarDate({
      day,
    })
  }

  /**
   * Generate the day number this calendar month ends on.
   *
   * `Date.UTC()` takes a zero-based month index, so handing it this month's one-based number
   * already names the month after this one; day `0` of that month then rolls back to the last day
   * of this one. The whole calculation is UTC arithmetic on a synthetic date rather than on an
   * instant, so no zone and no host clock can reach it. Leap years come out of the platform's own
   * Gregorian rules, which is why 2000 answers 29 and 1900 answers 28 — a hand-written `% 4` would
   * get one of those wrong.
   *
   * @returns {number} The last day of this month: 28, 29, 30 or 31.
   */
  generateLastDayOfMonth () {
    const rolledBackMilliseconds = Date.UTC(this.year, this.month, 0)
    const lastDateTime = new Date(rolledBackMilliseconds)

    return lastDateTime.getUTCDate()
  }

  /**
   * Generate a calendar date in this month.
   *
   * Every segment is zero-padded, because the value crosses the contract and reaches `spentOn` as
   * `YYYY-MM-DD` — a June that read `2026-6-1` would match nothing and sort wrongly against the
   * dates that are padded.
   *
   * @param {{
   *   day: number
   * }} params - Parameters.
   * @returns {string} The calendar date, as `YYYY-MM-DD`.
   */
  generateCalendarDate ({
    day,
  }) {
    const yearText = this.generateZeroPaddedText({
      value: this.year,
      digitCount: YEAR_DIGIT_COUNT,
    })
    const monthText = this.generateZeroPaddedText({
      value: this.month,
      digitCount: MONTH_DIGIT_COUNT,
    })
    const dayText = this.generateZeroPaddedText({
      value: day,
      digitCount: DAY_DIGIT_COUNT,
    })

    return [
      yearText,
      monthText,
      dayText,
    ].join('-')
  }

  /**
   * Generate the zero-padded text of a number.
   *
   * @param {{
   *   value: number
   *   digitCount: number
   * }} params - Parameters.
   * @returns {string} The number, padded with leading zeros to the given width.
   */
  generateZeroPaddedText ({
    value,
    digitCount,
  }) {
    return String(value)
      .padStart(digitCount, '0')
  }
}

/**
 * @typedef {{
 *   year: number
 *   month: number
 * }} CalendarMonthRangeBuilderParams
 */

/**
 * @typedef {CalendarMonthRangeBuilderParams} CalendarMonthRangeBuilderFactoryParams
 */
