import {
  IntegerValueInspector,
} from '@openreachtech/mentsu-value-inspector'

import BaseInputValidator from '../../../BaseInputValidator.js'

import PAGINATION_CONSTANT_HASH from '../../../../../constants/paginationConstants.js'

const {
  PAGINATION: {
    MAXIMUM_LIMIT,
  },
} = PAGINATION_CONSTANT_HASH

/**
 * What `expenses`' input must satisfy before the operation reads a row.
 *
 * The schema types both numbers `Int!` inside a `PaginationInput!` (001-common.graphql), so
 * GraphQL has already refused a missing `pagination`, a missing `limit` or `offset`, and a value
 * that is not an integer at all, before a resolver runs. What is left is what `Int!` permits and a
 * page cannot be made of, and it is **two values carrying three rules**:
 *
 * 1. a `limit` that is not a positive whole number — `0` and `-5` are both `Int!`
 * 2. a `limit` past `PAGINATION.MAXIMUM_LIMIT` — `Int!` permits a hundred thousand
 * 3. an `offset` that is negative — `Int!` permits it, and no page starts before the first row
 *
 * **`offset: 0` is legitimate and must pass.** It is the first page, which is what a screen asks
 * for on open, so the offset rule asks for "not negative" rather than for "positive". That is why
 * it is written as `isIntegerLike()` and not `isNegativeNumberLike()` rather than reusing the
 * limit's `isPositiveNumberLike()`: the two bounds genuinely differ by one value.
 *
 * **`limit` IS capped from above, at `PAGINATION.MAXIMUM_LIMIT`, and `isWithinMaximumLimit()` is
 * the rule that does it.** A caller asking for `101` is refused. Whoever reads this next should
 * know that the cap is deliberate and load-bearing rather than an invention to be tidied away:
 * uncapped, one `expenses` call reads as many joined rows as the caller names, and a single
 * sixteen-kilobyte document may hold ten such calls
 * (`server/graphql/StaffGraphqlServerEngine.js`, and `constants/graphqlDocumentConstants.cjs` for
 * why ten). Deleting this rule reopens that multiplication at its other end.
 *
 * **The number itself is still Q50's chosen value, and is not yet confirmed by the user.** Spec
 * section 11 fixes no maximum page size and no operation of this version declares one, so `100` is
 * an implementation choice rather than a rule the specification carries. Its reasoning, who
 * proposed it and why a peer could not settle it are all in `constants/paginationConstants.cjs`.
 * What is settled is that there is a cap; what is open is the number. **If Q50 comes back with a
 * different one, that constant changes and this rule does not.**
 *
 * **`sort` is not validated, because it is not read.** The pinned contract says in writing that
 * no operation in 1.0.0 lets the caller choose a sort, and the resolver never hands it to the
 * query — so there is no sort key to be valid or invalid against, and a rule refusing one would
 * imply the field does something.
 *
 * **The order of the three is one part convention and one part necessity.** The two limit rules
 * come ahead of the offset rule only because a page is asked for by size first; they are
 * independent of it and neither masks it. But `isValidLimit()` ahead of `isWithinMaximumLimit()`
 * is necessary rather than conventional — a caller presenting `-5` is told the size is invalid
 * rather than that it is too large, and the method's own comment says why.
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
        () => this.isWithinMaximumLimit(),
        this.errorHash.ExcessiveLimit,
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
   * Whether the presented page size is one this version will serve.
   *
   * Asked AFTER `isValidLimit()`, so a caller presenting nonsense is told the size is invalid
   * rather than that it is too large -- the more specific complaint is the earlier one, and a
   * negative limit is not "over the maximum" in any sense a reader would accept.
   *
   * `MAXIMUM_LIMIT` is Q50's chosen value and is not yet confirmed by the user; see
   * `constants/paginationConstants.cjs`, which carries the reasoning and its standing.
   *
   * @returns {boolean} true: the page asked for is no larger than the maximum.
   */
  isWithinMaximumLimit () {
    const inspector = this.createLimitInspector()

    return inspector.isIntegerLike()
      && Number(this.input.pagination?.limit) <= MAXIMUM_LIMIT
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
 *   ExcessiveLimit: RenchanGraphqlErrorCtor
 *   InvalidOffset: RenchanGraphqlErrorCtor
 * }} ErrorHash
 */

/**
 * @typedef {import('../../../BaseInputValidator.js').RenchanGraphqlErrorCtor} RenchanGraphqlErrorCtor
 */

/**
 * @typedef {server.graphql.staff.ExpensesInput} ExpensesInput
 */
