import {
  IntegerValueInspector,
} from '@openreachtech/mentsu-value-inspector'

import BaseInputValidator from '../../../BaseInputValidator.js'

/**
 * What `expenses`' input must satisfy before the operation reads a row.
 *
 * The schema types both numbers `Int!` inside a `PaginationInput!` (001-common.graphql), so
 * GraphQL has already refused a missing `pagination`, a missing `limit` or `offset`, and a value
 * that is not an integer at all, before a resolver runs. What is left is what `Int!` permits and a
 * page cannot be made of, and it is **two values, so two rules**:
 *
 * 1. a `limit` that is not a positive whole number — `0` and `-5` are both `Int!`
 * 2. an `offset` that is negative — `Int!` permits it, and no page starts before the first row
 *
 * **`offset: 0` is legitimate and must pass.** It is the first page, which is what a screen asks
 * for on open, so the offset rule asks for "not negative" rather than for "positive". That is why
 * it is written as `isIntegerLike()` and not `isNegativeNumberLike()` rather than reusing the
 * limit's `isPositiveNumberLike()`: the two bounds genuinely differ by one value.
 *
 * **Neither rule caps `limit` from above, and nothing here should be read as deciding that it
 * may not be capped.** Spec section 11 fixes no maximum page size and no operation of this
 * version declares one, so a ceiling written here would be a policy invented by a validator
 * rather than a rule the spec carries. A caller may therefore ask for a very large page. It is
 * recorded rather than papered over: the value to cap it at is a decision, and this is not the
 * place that decision gets made.
 *
 * **`sort` is not validated, because it is not read.** The pinned contract says in writing that
 * no operation in 1.0.0 lets the caller choose a sort, and the resolver never hands it to the
 * query — so there is no sort key to be valid or invalid against, and a rule refusing one would
 * imply the field does something.
 *
 * The limit rule is declared ahead of the offset rule only because a page is asked for by size
 * first; the two are independent and neither masks the other.
 *
 * @augments {BaseInputValidator<ErrorHash, ExpensesInput>}
 */
export default class ExpensesInputValidator extends BaseInputValidator {
  /**
   * Generate the rules this validator declares, in the order they are answered in.
   *
   * @override
   * @returns {Array<[() => boolean, RenchanGraphqlErrorCtor]>} One pair per rule.
   */
  generateValidationEntries () {
    return [
      [
        () => this.isValidLimit(),
        this.errorHash.InvalidLimit,
      ],
      [
        () => this.isValidOffset(),
        this.errorHash.InvalidOffset,
      ],
    ]
  }

  /**
   * Whether the presented page size is a size a page can have.
   *
   * @returns {boolean} true: a positive whole number of rows was asked for.
   */
  isValidLimit () {
    const inspector = this.createLimitInspector()

    return inspector.isIntegerLike()
      && inspector.isPositiveNumberLike()
  }

  /**
   * Create the inspector reading the presented page size.
   *
   * A `pagination` that is not there at all yields an inspector over `undefined`, which fails
   * every predicate rather than throwing — a predicate never throws, and GraphQL has already
   * refused that input in any case.
   *
   * @returns {IntegerValueInspector} Inspector over the presented limit.
   */
  createLimitInspector () {
    return IntegerValueInspector.create({
      value: this.input.pagination?.limit,
    })
  }

  /**
   * Whether the presented offset names a row the page can start at.
   *
   * Zero passes: it is the first page. A negative offset does not, because no page starts before
   * the first row — and left unrefused it reaches `RequestPagination#resolveOffset()`, which
   * quietly answers `0` for it, so the caller would be served the first page and told they were
   * served theirs.
   *
   * @returns {boolean} true: a whole number of rows, none of them before the first, was skipped.
   */
  isValidOffset () {
    const inspector = this.createOffsetInspector()

    return inspector.isIntegerLike()
      && !inspector.isNegativeNumberLike()
  }

  /**
   * Create the inspector reading the presented offset.
   *
   * @returns {IntegerValueInspector} Inspector over the presented offset.
   */
  createOffsetInspector () {
    return IntegerValueInspector.create({
      value: this.input.pagination?.offset,
    })
  }
}

/**
 * @typedef {{
 *   InvalidLimit: RenchanGraphqlErrorCtor
 *   InvalidOffset: RenchanGraphqlErrorCtor
 * }} ErrorHash
 */

/**
 * @typedef {import('../../../BaseInputValidator.js').RenchanGraphqlErrorCtor} RenchanGraphqlErrorCtor
 */

/**
 * @typedef {server.graphql.staff.ExpensesInput} ExpensesInput
 */
