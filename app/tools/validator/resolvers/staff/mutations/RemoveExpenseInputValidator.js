import {
  IntegerValueInspector,
  ValueInspector,
} from '@openreachtech/mentsu-value-inspector'

import BaseInputValidator from '../../../BaseInputValidator.js'

/**
 * What `removeExpense`'s input must satisfy before the operation deletes a row.
 *
 * -------------------------------------------------------------------------------------------
 * Two rules, because the input carries one field
 * -------------------------------------------------------------------------------------------
 *
 * `RemoveExpenseInput` declares `expenseId` and nothing else (003-expense-entry.graphql), so this
 * is `CorrectExpenseInputValidator` with the eight rules that read a correction's other fields
 * taken away. The entry is asked about twice — whether it was named at all, and whether what was
 * named is a value an identifier can take — for the same reason it is there: only the first
 * failing rule surfaces, so a caller who named nothing and a caller who named `'seven'` have
 * different things to correct.
 *
 * -------------------------------------------------------------------------------------------
 * What this class deliberately cannot answer, and why that is the security property
 * -------------------------------------------------------------------------------------------
 *
 * Whether an entry of that id **exists**, whether it **belongs to the caller**, and whether it was
 * **already removed** are three rows — or three absences of one — and a validator reads the input
 * and nothing else. All three are the resolver's, and it answers all three with **one** code. See
 * `RemoveExpenseMutationResolver`: an entry this caller removed a moment ago, an entry another
 * member of staff holds, and an id no row ever held are indistinguishable to a caller, which is
 * spec section 11's criterion and the reason nothing here tries to tell them apart.
 *
 * A value is not a row, so a plausible identifier passing every rule below says nothing at all
 * about whether anything of that id is there.
 *
 * -------------------------------------------------------------------------------------------
 * No clock
 * -------------------------------------------------------------------------------------------
 *
 * `CorrectExpenseInputValidator` and `RecordExpenseInputValidator` both hold a `readAt` property,
 * because both decide "dated after today" against the request's own instant. A removal presents no
 * date, so this class has no clock to read and declares neither a constructor nor a factory method
 * of its own: the base builds its instance from `input` and `errorHash`, which is all there is.
 *
 * @augments {BaseInputValidator<ErrorHash, RemoveExpenseInput>}
 */
export default class RemoveExpenseInputValidator extends BaseInputValidator {
  /**
   * Generate the rules this validator declares, in the order they are answered in.
   *
   * Presence first, so that an entry left out is never reported as an entry of the wrong shape.
   *
   * @override
   * @returns {Array<[() => boolean, RenchanGraphqlErrorCtor]>} One pair per rule.
   */
  generateValidationEntries () {
    return [
      [
        () => this.hasExpenseId(),
        this.errorHash.MissingExpenseId,
      ],
      [
        () => this.isValidExpenseId(),
        this.errorHash.InvalidExpenseId,
      ],
    ]
  }

  /**
   * Whether an entry was named at all.
   *
   * @returns {boolean} true: an entry was named, whatever it turns out to be.
   */
  hasExpenseId () {
    const inspector = this.createExpenseIdPresenceInspector()

    return inspector.isPresent()
  }

  /**
   * Create the inspector answering whether an entry was named.
   *
   * A plain `ValueInspector` and not the integer one, because presence and shape are two rules
   * with two codes: this one answers only whether anything was named at all.
   *
   * @returns {ValueInspector} Inspector over the named entry.
   */
  createExpenseIdPresenceInspector () {
    return ValueInspector.create({
      value: this.input.expenseId,
    })
  }

  /**
   * Whether the named entry is a value an entry identifier can take.
   *
   * Whether an entry of that id **exists**, **belongs to the caller**, or was **already removed**
   * is none of them asked here and none of them can be: a validator reads the input and nothing
   * else, and all three are a row. The resolver answers all three, under a single `204` code that
   * cannot tell them apart — which is the security property spec sections 7 and 11 ask for.
   *
   * @returns {boolean} true: a positive whole number was named.
   */
  isValidExpenseId () {
    const inspector = this.createExpenseIdInspector()

    return inspector.isIntegerLike()
      && inspector.isPositiveNumberLike()
  }

  /**
   * Create the inspector reading the named entry.
   *
   * @returns {IntegerValueInspector} Inspector over the named entry.
   */
  createExpenseIdInspector () {
    return IntegerValueInspector.create({
      value: this.input.expenseId,
    })
  }
}

/**
 * @typedef {{
 *   MissingExpenseId: RenchanGraphqlErrorCtor
 *   InvalidExpenseId: RenchanGraphqlErrorCtor
 * }} ErrorHash
 */

/**
 * @typedef {import('../../../BaseInputValidator.js').RenchanGraphqlErrorCtor} RenchanGraphqlErrorCtor
 */

/**
 * @typedef {server.graphql.staff.RemoveExpenseInput} RemoveExpenseInput
 */
