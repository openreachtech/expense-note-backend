import {
  IntegerValueInspector,
} from '@openreachtech/mentsu-value-inspector'

import BaseInputValidator from '../../../BaseInputValidator.js'

const FIRST_MONTH_OF_YEAR = 1
const LAST_MONTH_OF_YEAR = 12

const FIRST_CALENDAR_YEAR = 1
const LAST_CALENDAR_YEAR = 9999

/**
 * What `monthlyExpenses`' input must satisfy before the operation reads a row.
 *
 * The schema types both numbers `Int!` (004-monthly-summary.graphql), so GraphQL has already
 * refused a missing `year`, a missing `month`, and a value that is not an integer at all, before a
 * resolver runs. What is left is what `Int!` permits and **a calendar month cannot be**.
 *
 * -------------------------------------------------------------------------------------------
 * What is checked, and why each of the two is a malformed input rather than a policy
 * -------------------------------------------------------------------------------------------
 *
 * **`month` must be one of 1 to 12.** `Int!` permits `0`, `13` and `-1`, and none of them names a
 * month: this is what the word means, not a decision somebody owes. `#monthly-summary`'s
 * checkpoint 1 proposed no spec clause bounding it for exactly that reason, and this rule is that
 * reading rather than a rule invented here. Left unrefused, `13` does not fail -- which is the
 * point. `CalendarMonthRangeBuilder` would build the pair `2026-13-01` / `2026-13-31`, because
 * `Date.UTC(2026, 13, 0)` rolls forward into the following January and hands back its last day, and
 * the two strings would be compared against `spent_on` and match nothing. The caller would be told
 * their month was empty, about a month that does not exist.
 *
 * **`year` must be one a `YYYY-MM-DD` date can hold: 1 to 9999.** This is the same kind of
 * statement and not a second kind. `spent_on` is a Sequelize `DATEONLY` and the contract's dates
 * are `YYYY-MM-DD`, a four-digit year by construction, so a year outside that range cannot be
 * written as a calendar date **at all**. `String(-5).padStart(4, '0')` is `'00-5'`, so
 * `CalendarMonthRangeBuilder` would produce `'00-5-06-01'`, and `12345` would produce
 * `'12345-06-01'`; each is a malformed string silently compared, and each would come back as a
 * successful empty read of something that was never a month. The bound is the **date format's**,
 * and it moves only if `spentOn` stops being `YYYY-MM-DD` -- not if somebody decides which years a
 * member of staff may read.
 *
 * -------------------------------------------------------------------------------------------
 * What is deliberately NOT checked, and why leaving it out is the decision
 * -------------------------------------------------------------------------------------------
 *
 * **No minimum year.** Not the year the company was founded, not the seven years section 7 keeps an
 * expense for. Retention says how long a row is kept, not which months may be asked for, and a
 * member of staff reading 2019 and being told it is empty has been told the truth.
 *
 * **No maximum year, and no "not in the future" rule.** Section 11 refuses an expense *dated* after
 * today -- that is a rule about writing a row, enforced by `CalendarDateInspector` in the two write
 * validators, and it says nothing about reading a month. A future month holds nothing, so it reads
 * as an empty month with a total of zero, which is truthful and is section 12's third acceptance
 * criterion answered rather than avoided. A refusal here would also make section 12.2's month
 * navigation refuse where it should show an empty month.
 *
 * **No rule pairing `year` with `month`.** There is no month of a year this operation declines to
 * answer for, so there is nothing cross-field to check.
 *
 * Checkpoint 1 declined to propose a spec clause for any of these, and a validator is not the place
 * to acquire one quietly: a rule here that the spec does not carry is a product decision taken by
 * whoever was writing a predicate that afternoon.
 *
 * -------------------------------------------------------------------------------------------
 * The order of the two
 * -------------------------------------------------------------------------------------------
 *
 * `year` is answered before `month`, and the two are independent -- neither masks the other, and a
 * caller presenting both wrong is told about the year. The order is convention (the larger unit
 * first, as the input declares them) rather than necessity, which is why it is said here rather
 * than argued for in a method comment.
 *
 * @augments {BaseInputValidator<ErrorHash, MonthlyExpensesInput>}
 */
export default class MonthlyExpensesInputValidator extends BaseInputValidator {
  /**
   * Generate the rules this validator declares, in the order they are answered in.
   *
   * @override
   * @returns {Array<[() => boolean, RenchanGraphqlErrorCtor]>} One pair per rule.
   */
  generateValidationEntries () {
    return [
      [
        () => this.isValidYear(),
        this.errorHash.InvalidYear,
      ],
      [
        () => this.isValidMonth(),
        this.errorHash.InvalidMonth,
      ],
    ]
  }

  /**
   * Whether the presented year is a year a calendar date can name.
   *
   * The bound is the `YYYY-MM-DD` format's four digits, not a business rule about which years may
   * be read -- see the class comment for the difference and for why no minimum and no maximum of
   * the other kind is declared here.
   *
   * @returns {boolean} true: a whole number of years that a calendar date can be written in.
   */
  isValidYear () {
    const inspector = this.createYearInspector()

    if (!inspector.isIntegerLike()) {
      return false
    }

    const year = inspector.normalizeValue()

    return year >= FIRST_CALENDAR_YEAR
      && year <= LAST_CALENDAR_YEAR
  }

  /**
   * Create the inspector reading the presented year.
   *
   * A `year` that is not there at all yields an inspector over `undefined`, which fails every
   * predicate rather than throwing -- a predicate never throws, and GraphQL has already refused
   * that input in any case.
   *
   * @returns {IntegerValueInspector} Inspector over the presented year.
   */
  createYearInspector () {
    return IntegerValueInspector.create({
      value: this.input.year,
    })
  }

  /**
   * Whether the presented month is one of the twelve.
   *
   * @returns {boolean} true: a whole number naming one of the twelve months.
   */
  isValidMonth () {
    const inspector = this.createMonthInspector()

    if (!inspector.isIntegerLike()) {
      return false
    }

    const month = inspector.normalizeValue()

    return month >= FIRST_MONTH_OF_YEAR
      && month <= LAST_MONTH_OF_YEAR
  }

  /**
   * Create the inspector reading the presented month.
   *
   * @returns {IntegerValueInspector} Inspector over the presented month.
   */
  createMonthInspector () {
    return IntegerValueInspector.create({
      value: this.input.month,
    })
  }
}

/**
 * @typedef {{
 *   InvalidYear: RenchanGraphqlErrorCtor
 *   InvalidMonth: RenchanGraphqlErrorCtor
 * }} ErrorHash
 */

/**
 * @typedef {import('../../../BaseInputValidator.js').RenchanGraphqlErrorCtor} RenchanGraphqlErrorCtor
 */

/**
 * @typedef {server.graphql.staff.MonthlyExpensesInput} MonthlyExpensesInput
 */
