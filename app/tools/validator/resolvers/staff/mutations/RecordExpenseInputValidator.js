import {
  IntegerValueInspector,
  ValueInspector,
} from '@openreachtech/mentsu-value-inspector'

import CalendarDateInspector from '../../../../calendar/CalendarDateInspector.js'

import BaseInputValidator from '../../../BaseInputValidator.js'

/*
 * The longest memo the column that stores one can hold.
 *
 * **191 is not a policy, it is the column.** `expenses.memo` is `varchar(191)` (spec section 9.3),
 * so a memo longer than this has nowhere to go. Left unrefused it reaches MariaDB, which in strict
 * mode raises `Data too long` — an exception nothing on this path catches, so the caller receives
 * the framework's generic error instead of a refusal this operation names — and under a permissive
 * `sql_mode` truncates the memo instead, silently storing something other than what was typed.
 * SQLite, which development and every test run on, enforces neither, so nothing but this rule
 * makes the two behave alike.
 *
 * **A character count, not a byte count.** `varchar(191)` in MySQL and MariaDB bounds *characters*,
 * so a 191-character memo of multi-byte characters fits and must not be refused — and a memo is
 * exactly the field a member of staff writes Japanese into.
 *
 * Counted in code points rather than with `String#length`, because `String#length` counts UTF-16
 * code units: a character outside the basic multilingual plane counts twice there and once in the
 * database, so a length-based cap would refuse a memo the column would have accepted.
 *
 * `SignInInputValidator` caps an address the same way for the same reason; the two constants are
 * deliberately separate, because they are two columns and either may be widened without the other.
 */
const MAX_MEMO_CHARACTER_COUNT = 191

/**
 * What `recordExpense`'s input must satisfy before the operation writes a row.
 *
 * The schema types `spentOn` `String!`, `amount` and `expenseCategoryId` `Int!`, and `memo` a
 * nullable `String` (003-expense-entry.graphql), so GraphQL has already refused a missing required
 * field and a field of the wrong type before a resolver runs. What is left is what those types
 * permit and an expense may not be made of, and it is **eight rules**.
 *
 * -------------------------------------------------------------------------------------------
 * The three acceptance criteria this validator owns
 * -------------------------------------------------------------------------------------------
 *
 * **"An expense with no amount, an amount of zero, or a negative amount is refused"** (spec
 * section 11) is two rules here, not one: `#hasAmount()` answers "no amount" and `#isValidAmount()`
 * answers zero and negative. They are kept apart because a caller who sent nothing and a caller who
 * sent `-4500` have different things to correct — and because the presence rule has to be declared
 * first anyway, since only the first failing rule surfaces and a missing amount reported as an
 * invalid one sends somebody looking at what they typed rather than at what they left out.
 *
 * **"An expense dated after today is refused"** is `#isSpentOnAtLatestToday()`, and it is declared
 * *after* `#isValidSpentOnFormat()` deliberately. `CalendarDateInspector#isAfterToday()` answers
 * `false` for a string that is no calendar date at all — "this is not a date" is
 * `#isWellFormed()`'s verdict to give, not its own — so a malformed `spentOn` would pass the
 * future rule and be refused, or not, by whatever rule came next. Reading the format first is what
 * makes `'2026-9-15'` refused as malformed rather than accepted as a date in the past.
 *
 * **"The memo is optional"** is the rule that is *not* here: no presence rule reads `memo`, so an
 * input carrying none satisfies every rule below. `#isValidMemoCharacterCount()` bounds a memo that
 * was presented and says nothing about one that was not.
 *
 * -------------------------------------------------------------------------------------------
 * The clock
 * -------------------------------------------------------------------------------------------
 *
 * `readAt` is this validator's own property rather than something `CalendarDateInspector` defaults
 * for itself, and the resolver hands it `context.now`. Two reasons, and both matter: the request's
 * own instant is the clock the whole request should be answered against — every other rule of this
 * operation is a pure function of the input, and a rule reading a wall clock of its own would make
 * this one the exception — and an injected instant is what lets a test state "the day after this
 * one" as a value rather than by arithmetic against `new Date()`.
 *
 * The timezone is not this class's to choose. `CalendarDateInspector` reads it from
 * `constants/calendarConstants.cjs` (`Asia/Tokyo`, Q49), which is the one place it is written down.
 *
 * @augments {BaseInputValidator<ErrorHash, RecordExpenseInput>}
 */
export default class RecordExpenseInputValidator extends BaseInputValidator {
  /**
   * Constructor.
   *
   * @param {{
   *   input: RecordExpenseInput
   *   errorHash: ErrorHash
   *   readAt: Date
   * }} params - Parameters.
   */
  constructor ({
    readAt,
    ...remainingParams
  }) {
    super(remainingParams)

    this.readAt = readAt
  }

  /**
   * Factory method.
   *
   * Declared here rather than inherited, because the base builds its instance from `input` and
   * `errorHash` alone and this validator holds a third property.
   *
   * @template {X extends typeof RecordExpenseInputValidator ? X : never} T, X
   * @override
   * @param {{
   *   input: RecordExpenseInput
   *   errorHash: ErrorHash
   *   readAt: Date
   * }} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    input,
    errorHash,
    readAt,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        input,
        errorHash,
        readAt,
      })
    )
  }

  /**
   * Generate the rules this validator declares, in the order they are answered in.
   *
   * Presence first, for all three required fields, so that a field left out is never reported as a
   * field of the wrong shape. Then the shape of each value, then the one rule that consults a
   * clock, then the one that bounds the optional field.
   *
   * @override
   * @returns {Array<[() => boolean, RenchanGraphqlErrorCtor]>} One pair per rule.
   */
  generateValidationEntries () {
    return [
      [
        () => this.hasSpentOn(),
        this.errorHash.MissingSpentOn,
      ],
      [
        () => this.hasAmount(),
        this.errorHash.MissingAmount,
      ],
      [
        () => this.hasExpenseCategoryId(),
        this.errorHash.MissingExpenseCategoryId,
      ],
      [
        () => this.isValidSpentOnFormat(),
        this.errorHash.MalformedSpentOn,
      ],
      [
        () => this.isValidAmount(),
        this.errorHash.InvalidAmount,
      ],
      [
        () => this.isValidExpenseCategoryId(),
        this.errorHash.InvalidExpenseCategoryId,
      ],
      [
        () => this.isSpentOnAtLatestToday(),
        this.errorHash.FutureSpentOn,
      ],
      [
        () => this.isValidMemoCharacterCount(),
        this.errorHash.TooLongMemo,
      ],
    ]
  }

  /**
   * Whether a date was presented at all.
   *
   * @returns {boolean} true: a date was presented, whatever it turns out to say.
   */
  hasSpentOn () {
    const inspector = this.createSpentOnPresenceInspector()

    return inspector.isPresent()
  }

  /**
   * Create the inspector answering whether a date was presented.
   *
   * @returns {ValueInspector} Inspector over the presented date.
   */
  createSpentOnPresenceInspector () {
    return ValueInspector.create({
      value: this.input.spentOn,
    })
  }

  /**
   * Whether an amount was presented at all.
   *
   * **This is the "an expense with no amount" half of section 11's first criterion.** Zero and a
   * negative amount are the other half and belong to `#isValidAmount()`; this rule is satisfied by
   * both of them, because both were presented.
   *
   * @returns {boolean} true: an amount was presented, whatever it turns out to be.
   */
  hasAmount () {
    const inspector = this.createAmountPresenceInspector()

    return inspector.isPresent()
  }

  /**
   * Create the inspector answering whether an amount was presented.
   *
   * @returns {ValueInspector} Inspector over the presented amount.
   */
  createAmountPresenceInspector () {
    return ValueInspector.create({
      value: this.input.amount,
    })
  }

  /**
   * Whether a category was named at all.
   *
   * @returns {boolean} true: a category was named, whatever it turns out to be.
   */
  hasExpenseCategoryId () {
    const inspector = this.createExpenseCategoryIdPresenceInspector()

    return inspector.isPresent()
  }

  /**
   * Create the inspector answering whether a category was named.
   *
   * @returns {ValueInspector} Inspector over the named category.
   */
  createExpenseCategoryIdPresenceInspector () {
    return ValueInspector.create({
      value: this.input.expenseCategoryId,
    })
  }

  /**
   * Whether the presented date is a calendar date at all.
   *
   * The inspector's verdict rather than a regular expression written here, so a day a month does
   * not have is refused as well as a shape a date does not take: `2024-02-30` and `2026-9-15` are
   * both refused, and `2024-02-29` is not.
   *
   * @returns {boolean} true: the value reads as `YYYY-MM-DD`, and names a day that exists.
   */
  isValidSpentOnFormat () {
    const inspector = this.createCalendarDateInspector()

    return inspector.isWellFormed()
  }

  /**
   * Whether the presented amount is an amount an expense can carry.
   *
   * **Zero and a negative amount are refused here** — spec section 11's first criterion — and so is
   * a fractional one, because the yen has no minor unit and the column is an `int`.
   *
   * `#isPositiveNumberLike()` answers both halves at once: `0` is not greater than zero and neither
   * is `-4500`. `NumberValueInspector#isZero()` would name the zero case on its own, and it is
   * deliberately not used — it compares strictly (`value === 0`), so it would miss the `'0'` a
   * string-coercible input can arrive as, and refusing zero twice under one error code would make
   * the rule read as if the two values needed different answers. They do not: both are refused,
   * both under `InvalidAmount`.
   *
   * @returns {boolean} true: a positive whole number of yen was presented.
   */
  isValidAmount () {
    const inspector = this.createAmountInspector()

    return inspector.isIntegerLike()
      && inspector.isPositiveNumberLike()
  }

  /**
   * Create the inspector reading the presented amount.
   *
   * @returns {IntegerValueInspector} Inspector over the presented amount.
   */
  createAmountInspector () {
    return IntegerValueInspector.create({
      value: this.input.amount,
    })
  }

  /**
   * Whether the named category is a value a category id can take.
   *
   * Whether a category of that id **exists** is not asked here and cannot be: a validator reads the
   * input and nothing else, and existence is a row. The resolver answers that, under a `204` code
   * of its own.
   *
   * @returns {boolean} true: a positive whole number was named.
   */
  isValidExpenseCategoryId () {
    const inspector = this.createExpenseCategoryIdInspector()

    return inspector.isIntegerLike()
      && inspector.isPositiveNumberLike()
  }

  /**
   * Create the inspector reading the named category.
   *
   * @returns {IntegerValueInspector} Inspector over the named category.
   */
  createExpenseCategoryIdInspector () {
    return IntegerValueInspector.create({
      value: this.input.expenseCategoryId,
    })
  }

  /**
   * Whether the presented date falls no later than today.
   *
   * **This is section 11's "an expense dated after today is refused".** Today itself passes: a
   * member of staff recording this evening's train fare is the ordinary case this feature exists
   * for, so the boundary is "after", never "on or after".
   *
   * A malformed date satisfies this rule rather than failing it, because
   * `CalendarDateInspector#isAfterToday()` answers `false` for a string that is no date — the
   * format rule above owns that verdict and is declared first, so nothing reaches here unrefused.
   *
   * @returns {boolean} true: the money was paid today or before it.
   */
  isSpentOnAtLatestToday () {
    const inspector = this.createCalendarDateInspector()

    return !inspector.isAfterToday()
  }

  /**
   * Create the inspector reading the presented date against this request's instant.
   *
   * `readAt` is handed over rather than defaulted, so the day this operation calls "today" is the
   * instant the request arrived at. The timezone is left to the inspector, which reads the one
   * named constant.
   *
   * @returns {CalendarDateInspector} Inspector over the presented date.
   */
  createCalendarDateInspector () {
    return CalendarDateInspector.create({
      calendarDate: this.input.spentOn,
      readAt: this.readAt,
    })
  }

  /**
   * Whether the presented memo is short enough for the column that has to hold it.
   *
   * **A memo that was not presented satisfies this rule**, which is the memo being optional: `null`
   * and an absent field are both nothing to measure, not a refusal. So is a value that is not a
   * string — GraphQL has already refused one, and measuring a non-string means stringifying it
   * silently first.
   *
   * Measured in code points, which is what `varchar(191)` counts — see `MAX_MEMO_CHARACTER_COUNT`.
   *
   * @returns {boolean} true: the memo fits in the column that has to hold it.
   */
  isValidMemoCharacterCount () {
    const {
      memo,
    } = this.input

    if (typeof memo !== 'string') {
      return true
    }

    const memoCharacterCount = Array.from(memo).length

    return memoCharacterCount <= MAX_MEMO_CHARACTER_COUNT
  }
}

/**
 * @typedef {{
 *   MissingSpentOn: RenchanGraphqlErrorCtor
 *   MissingAmount: RenchanGraphqlErrorCtor
 *   MissingExpenseCategoryId: RenchanGraphqlErrorCtor
 *   MalformedSpentOn: RenchanGraphqlErrorCtor
 *   InvalidAmount: RenchanGraphqlErrorCtor
 *   InvalidExpenseCategoryId: RenchanGraphqlErrorCtor
 *   FutureSpentOn: RenchanGraphqlErrorCtor
 *   TooLongMemo: RenchanGraphqlErrorCtor
 * }} ErrorHash
 */

/**
 * @typedef {import('../../../BaseInputValidator.js').RenchanGraphqlErrorCtor} RenchanGraphqlErrorCtor
 */

/**
 * @typedef {server.graphql.staff.RecordExpenseInput} RecordExpenseInput
 */
