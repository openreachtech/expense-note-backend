import {
  DateToDateonlyValueConverter,
  DateonlyToDateValueConverter,
} from '@openreachtech/mentsu-deep-value-converter'

import CALENDAR_CONSTANT_HASH from '../../constants/calendarConstants.js'

const {
  CALENDAR,
} = CALENDAR_CONSTANT_HASH

/**
 * One calendar date, and whether it is readable at all and whether it falls after today.
 *
 * Spec section 11 refuses "an expense dated after today". Two operations enforce that —
 * `recordExpense` and `correctExpense` — so the decision lives here once rather than twice in
 * their validators, and both import the same answer.
 *
 * **A calendar date and an instant are not the same thing.** `spentOn` crosses the contract as a
 * `YYYY-MM-DD` string; the clock a resolver holds is `context.now`, an instant. Turning that
 * instant into "today" needs a timezone, and the zones disagree for part of every day — which is
 * why `timezone` is a stated property rather than whatever zone the host happens to run in. Its
 * default is the one named constant, so an answer to Q49 changes one value and no code. A
 * deployment must never be able to decide this by accident.
 *
 * The comparison itself is a string comparison, which is exact here and nowhere else: both sides
 * are zero-padded `YYYY-MM-DD`, so their lexicographic order is their chronological order.
 *
 * Today itself is not after today. A member of staff recording this evening's train fare is the
 * ordinary case this feature exists for, so the boundary is "after", never "on or after".
 */
export default class CalendarDateInspector {
  /**
   * Constructor.
   *
   * @param {CalendarDateInspectorParams} params - Parameters.
   */
  constructor ({
    calendarDate,
    readAt,
    timezone,
  }) {
    this.calendarDate = calendarDate
    this.readAt = readAt
    this.timezone = timezone
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof CalendarDateInspector ? X : never} T, X
   * @param {CalendarDateInspectorFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    calendarDate,
    readAt = this.generateCurrentDateTime(),
    timezone = CALENDAR.TIMEZONE,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        calendarDate,
        readAt,
        timezone,
      })
    )
  }

  /**
   * get: Converter turning an instant into the calendar date it falls on.
   *
   * Behind a getter so this class names its dependency on the package in one place, and so a test
   * can substitute it.
   *
   * @returns {typeof DateToDateonlyValueConverter} Converter declaration.
   */
  static get DateToDateonlyValueConverterCtor () {
    return DateToDateonlyValueConverter
  }

  /**
   * get: Converter turning a calendar date into an instant.
   *
   * Used here for its verdict on whether a string is a calendar date at all, never for the instant
   * it would produce.
   *
   * @returns {typeof DateonlyToDateValueConverter} Converter declaration.
   */
  static get DateonlyToDateValueConverterCtor () {
    return DateonlyToDateValueConverter
  }

  /**
   * Generate the instant today is read from when the caller states none.
   *
   * A request that already knows its own instant hands it in — a resolver has `context.now` — so
   * this stands in only where nothing upstream carries one.
   *
   * @returns {Date} The current instant.
   */
  static generateCurrentDateTime () {
    return new Date()
  }

  /**
   * get: Constructor of this class.
   *
   * @returns {typeof CalendarDateInspector} Constructor of this class.
   */
  get Ctor () {
    return /** @type {typeof CalendarDateInspector} */ (this.constructor)
  }

  /**
   * Whether this calendar date falls after the day the instant lands on.
   *
   * True is the answer spec section 11 refuses on. A string that is no calendar date answers
   * false, because "this is not a date" is the verdict `#isWellFormed()` exists to give — this
   * method would otherwise refuse garbage for the wrong stated reason.
   *
   * @returns {boolean} true: the date falls after today.
   * @public
   */
  isAfterToday () {
    if (!this.isWellFormed()) {
      return false
    }

    const todayCalendarDate = this.buildTodayCalendarDate()

    return this.calendarDate > todayCalendarDate
  }

  /**
   * Whether this calendar date is a calendar date at all.
   *
   * The package's own verdict rather than a regular expression written here, so a day a month does
   * not have is refused as well as a shape a date does not take: `2024-02-30` is rejected, and
   * `2024-02-29` is not.
   *
   * @returns {boolean} true: the value reads as `YYYY-MM-DD`, and names a day that exists.
   * @public
   */
  isWellFormed () {
    const converter = this.createCalendarDateConverter()

    return converter.canConvertValue()
  }

  /**
   * Create the converter reading this calendar date.
   *
   * Bound to this inspector's zone even though the verdict it is asked for does not consult one:
   * an unbound converter falls back to UTC, and nothing in this class may pick a zone nobody
   * chose.
   *
   * @returns {DateonlyToDateValueConverter} Converter holding this calendar date.
   */
  createCalendarDateConverter () {
    const BoundConverterCtor = this.Ctor.DateonlyToDateValueConverterCtor.by({
      timezone: this.timezone,
    })

    return BoundConverterCtor.create({
      sourceValue: this.calendarDate,
    })
  }

  /**
   * Build the calendar date the instant lands on, in this inspector's zone.
   *
   * @returns {string} Today, as `YYYY-MM-DD`.
   * @throws {Error} The instant is no instant, so there is no day to read.
   * @public
   */
  buildTodayCalendarDate () {
    const converter = this.createInstantConverter()
    const todayCalendarDate = converter.convertValue()

    if (todayCalendarDate === null) {
      throw new Error(`${this.Ctor.name}#buildTodayCalendarDate() cannot read a calendar date from readAt`)
    }

    return todayCalendarDate
  }

  /**
   * Create the converter reading this inspector's instant.
   *
   * @returns {DateToDateonlyValueConverter} Converter holding the instant.
   */
  createInstantConverter () {
    const BoundConverterCtor = this.Ctor.DateToDateonlyValueConverterCtor.by({
      timezone: this.timezone,
    })

    return BoundConverterCtor.create({
      sourceValue: this.readAt,
    })
  }
}

/**
 * @typedef {{
 *   calendarDate: string
 *   readAt: Date
 *   timezone: string
 * }} CalendarDateInspectorParams
 */

/**
 * @typedef {{
 *   calendarDate: string
 *   readAt?: Date
 *   timezone?: string
 * }} CalendarDateInspectorFactoryParams
 */
