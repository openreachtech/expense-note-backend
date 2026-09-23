import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import {
  RequestPagination,
} from '@openreachtech/renchan-sequelize'

import ExpensesInputValidator from '../../../../../../app/tools/validator/resolvers/staff/queries/ExpensesInputValidator.js'

import Expense from '../../../../../../sequelize/models/Expense.js'
import ExpenseCategory from '../../../../../../sequelize/models/ExpenseCategory.js'

/*
 * The order this operation answers in.
 *
 * **Newest `spentOn` first, and where two entries share a date, the more recently recorded
 * first.** Spec **section 6's `entry order` row** is where that clause lives — one sentence
 * covering section 11.2's screen and section 12.2's both, so two lists of the same rows can never
 * disagree about the same day — and section 9.3 carries the composite
 * `(staff_member_id, spent_on)` index that serves its first key beside exactly this `where`.
 *
 * **`id` is how this file delivers the second half, and section 6 names no column on purpose.**
 * The spec states the behaviour — the more recently recorded first — because `id` is what
 * happens to carry it today: the primary key, already indexed, minted ascending, so monotonic
 * with the order entries were recorded. A later column recording that moment more directly would
 * change this line and leave section 6 untouched. The spec owes the behaviour; the column is
 * this file's.
 *
 * Ordering by `id` or by `createdAt` **alone** would look right against most data and be wrong:
 * the development seeder deliberately scrambles `spent_on` against the id order, and the first
 * row of the first page differs under each.
 *
 * -------------------------------------------------------------------------------------------
 * This reverses an earlier decision, and that decision was right when it was taken
 * -------------------------------------------------------------------------------------------
 *
 * Until section 6 gained that row this constant held one key, under a paragraph explaining that
 * no tie-break followed it deliberately rather than by omission: `#expense-entry`'s checkpoint 1
 * had not decided one, the development seeder was built so as not to raise the question, and
 * settling it here would have been a resolver inventing a clause with no owner. **On a paginated
 * view of one member of staff's whole history the tie is rare**, so leaving it open cost little,
 * and writing spec text nobody had decided would have cost more.
 *
 * **What changed is the scope, not that reasoning.** Section 12 reads a single month, where a
 * train fare and a lunch on the same day is an ordinary working day rather than a rare
 * collision — and section 12's own use case has somebody reading down the same column twice
 * against a card statement. Two reads of one month that legitimately differ are what that person
 * meets.
 *
 * Raised as **Q61**, which set out the alternatives and what each cost, and decided by the user
 * over both of them: settled once, in section 6, for both screens — because one screen breaking
 * the tie while the other did not is the same disagreement arriving by another route.
 *
 * It is declared once, as a module constant, so that the clause this operation owes is a fact of
 * the file rather than a literal buried in a method.
 */
const EXPENSES_ORDER = [
  ['spentOn', 'DESC'],
  ['id', 'DESC'],
]

/**
 * Resolver of the `expenses` query.
 *
 * Answers one page of the **caller's own** recorded expenses, newest `spentOn` first and,
 * where two share a date, the more recently recorded first (spec section 6, `entry order`).
 *
 * -------------------------------------------------------------------------------------------
 * Whose rows come back
 * -------------------------------------------------------------------------------------------
 *
 * `context.staffMemberId` — the id the framework resolved from the request's access token — is
 * the only thing the `where` narrows by, and it is never taken from the input: there is no
 * `staffMemberId` field in `ExpensesInput` to take it from, which is what makes "nobody sees
 * anybody else's" a property of the contract rather than of a check. Another member of staff's
 * entry is not refused here, it is simply never selected, so the operation cannot even report
 * that one exists.
 *
 * **The refusal of a caller with no session is the engine's, not this method's.** `expenses` is
 * deliberately absent from `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, so the
 * authentication filter refuses a tokenless caller before `resolve()` is entered. The null guard
 * below is the second line and defence in depth only, for the case where that hand-maintained
 * list is wrong — the same shape `SignedInStaffMemberQueryResolver` uses, and for the same
 * reason. Unguarded, a misconfiguration would answer with somebody's rows or crash; guarded, it
 * refuses with a code that names nobody.
 *
 * -------------------------------------------------------------------------------------------
 * How the page and its total are taken
 * -------------------------------------------------------------------------------------------
 *
 * Through `PaginationMixinModel`, composed onto `Expense` at checkpoint 5 and reached as
 * `Expense.$.findAllWithPagination()` — the mixin's statics land on the handler, so
 * `Expense.findAllWithPagination` is `undefined` and the `$` is not decorative.
 *
 * **`createFindOptions()` is deliberately not called here, and the `options` this file builds
 * carry no `limit` and no `offset`.** The mixin runs `count(options)` first and only then a
 * `findAll(options)` on a model scoped with the pagination, and it is that scope — not `options`
 * — that calls `RequestPagination#createFindOptions()`. Putting the limit into `options` would
 * therefore have `count()` count the page rather than the table, and every `totalRecords` this
 * operation reports would be a plausible wrong number with no error beside it. So `options`
 * carries `where`, `include` and `order`, and nothing else.
 *
 * `count()` receives that same `include`. Both of `Expense`'s associations are `belongsTo`, so
 * each expense joins at most one row of each and no `distinct: true` is needed; the model's own
 * tests pin that.
 *
 * The value object the mixin answers with exposes `totalNumber`, where the contract's field is
 * `totalRecords`. `#formatPagination()` is where the two are reconciled.
 *
 * -------------------------------------------------------------------------------------------
 * The sort clause the caller may present
 * -------------------------------------------------------------------------------------------
 *
 * **It is read back and never honoured.** `PaginationInput` carries a `sort` because the
 * audience's pagination shape carries one, and the pinned contract states in writing that no
 * operation in 1.0.0 lets the caller choose a sort. So the `RequestPagination` this file builds
 * is created from the limit and the offset **only** — the sort is never handed to it, which is
 * what keeps it out of the scope's `createFindOptions()` and so out of the query's ordering
 * entirely. Nothing about it is inspected, refused or reinterpreted on the way past.
 *
 * Echoing it into the response is reading a field, not applying it, and it is what the stub at
 * `stub/queries/ExpensesQueryResolver.js` already does — so the frontend, which builds against
 * that stub until checkpoint 16, sees the same `pagination` block before and after the swap.
 *
 * Nothing is written: this is a query, so it takes no transaction and calls no `create` /
 * `update`, per the CQRS rule.
 *
 * @augments {BaseQueryResolver}
 */
export default class ExpensesQueryResolver extends BaseQueryResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'expenses'
  }

  /**
   * get: Error code hash.
   *
   * `Q002` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
   *
   * The two `203` codes are the validator's, one per rule `ExpensesInputValidator` declares, and
   * the names are the ones it reads off `this.errorHash` — a name changed here refuses nothing
   * and throws on an undefined constructor instead. They are kept apart rather than merged
   * because a caller who asked for a page of zero rows and one who asked to start before the
   * first row have different things to correct, and neither reveals anything about anybody.
   *
   * The single `204` is the session guard, and it names nobody: not the caller, not a row, not a
   * count.
   *
   * **There is no "not found" code, because this operation cannot produce one.** A member of
   * staff who has recorded nothing is answered with an empty list and a total of zero — an empty
   * page is a successful read, not a refusal — and somebody else's entry is never selected in the
   * first place.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,

      // Invalid input errors — one per rule ExpensesInputValidator declares.
      InvalidLimit: '203.Q002.001',
      InvalidOffset: '203.Q002.002',

      // Q50, chosen and not yet confirmed -- see constants/paginationConstants.cjs
      ExcessiveLimit: '203.Q002.003',

      // Database / state errors
      StaffMemberNotFound: '204.Q002.001',
    }
  }

  /**
   * get: ExpensesInputValidator class — a seam so tests can substitute it.
   *
   * @returns {typeof ExpensesInputValidator} The class.
   */
  static get ExpensesInputValidatorCtor () {
    return ExpensesInputValidator
  }

  /**
   * get: RequestPagination class — a seam so tests can substitute it.
   *
   * @returns {typeof RequestPagination} The class.
   */
  static get RequestPaginationCtor () {
    return RequestPagination
  }

  /**
   * get: Expense model — a seam so tests can substitute it.
   *
   * @returns {typeof Expense} Model declaration.
   */
  get ExpenseModel () {
    return Expense
  }

  /**
   * get: ExpenseCategory model — a seam so tests can substitute it.
   *
   * @returns {typeof ExpenseCategory} Model declaration.
   */
  get ExpenseCategoryModel () {
    return ExpenseCategory
  }

  /**
   * Resolve the operation.
   *
   * The session guard is answered before the input is looked at, so a caller with no session is
   * refused without this operation reporting anything about what they asked for.
   *
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.ExpensesInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.ExpensesResult>} One page of the caller's own entries, newest `spentOn` first and the more recently recorded first within a date.
   * @throws {GraphqlType.Error} Refusal of a caller with no session, or of a page nobody could be served.
   * @public
   */
  async resolve ({
    variables: {
      input,
    },
    context,
  }) {
    const {
      staffMemberId,
    } = context

    if (!staffMemberId) {
      throw this.errorHash.StaffMemberNotFound.create()
    }

    const validationError = this.validateInput({
      input,
    })

    if (validationError) {
      throw validationError
    }

    const {
      limit,
      offset,
    } = input.pagination

    const expensesPage = await this.findExpensesPage({
      staffMemberId,
      limit,
      offset,
    })

    const sort = input.pagination.sort
      ?? null

    return this.formatResponse({
      expenseEntities: expensesPage.records,
      responsePagination: expensesPage.pagination,
      sort,
    })
  }

  /**
   * Validate the input against every rule `ExpensesInputValidator` declares.
   *
   * The validator returns the error rather than throwing it, so the `throw` of this operation
   * sits in one place beside every other reason it refuses.
   *
   * @param {{
   *   input: server.graphql.staff.ExpensesInput
   * }} params - Parameters.
   * @returns {import('@openreachtech/renchan').RenchanGraphqlError | null} The error of the first rule the input fails. null: the input satisfies every rule.
   */
  validateInput ({
    input,
  }) {
    const inputValidator = this.createInputValidator({
      input,
    })

    return inputValidator.validateInput()
  }

  /**
   * Create the validator holding this operation's input rules.
   *
   * The resolver's own `errorHash` is handed over, which is what makes each rule refuse with this
   * resolver's `203.Q002.*` code rather than with an error of the validator's own.
   *
   * @param {{
   *   input: server.graphql.staff.ExpensesInput
   * }} params - Parameters.
   * @returns {ExpensesInputValidator} Input validator over this request's input.
   */
  createInputValidator ({
    input,
  }) {
    return this.Ctor.ExpensesInputValidatorCtor.create({
      input,
      errorHash: this.errorHash,
    })
  }

  /**
   * Find one page of the entries a member of staff recorded, and the size of the whole set.
   *
   * The `where` names the owner and nothing else, so the rows of every other member of staff are
   * outside the query rather than filtered out of its result. The category is eager-loaded, which
   * is what keeps one page one pair of queries instead of one query per row.
   *
   * The ordering is `EXPENSES_ORDER`, whose two keys and their provenance are set out beside it.
   *
   * `options` carries no `limit` and no `offset` on purpose — see the class comment.
   *
   * @param {{
   *   staffMemberId: number
   *   limit: number
   *   offset: number
   * }} params - Parameters.
   * @returns {Promise<{
   *   pagination: import('@openreachtech/renchan-sequelize').ResponsePagination
   *   records: Array<model.Expense>
   * }>} The page in section 6's entry order, and the pagination describing the whole set it came from.
   */
  async findExpensesPage ({
    staffMemberId,
    limit,
    offset,
  }) {
    const pagination = this.createRequestPagination({
      limit,
      offset,
    })

    return /** @type {*} */ (
      this.ExpenseModel.$.findAllWithPagination({
        pagination,
        options: {
          where: {
            StaffMemberId: staffMemberId,
          },
          include: [
            this.ExpenseCategoryModel,
          ],
          order: EXPENSES_ORDER,
        },
      })
    )
  }

  /**
   * Create the pagination the page is taken with.
   *
   * **Built from the limit and the offset alone.** No sort is handed over, which is precisely how
   * the caller's sort clause is kept out of the query's ordering: `RequestPagination` defaults it
   * to an empty `RequestSort`, whose `orderOption` is `[]`, so the scope contributes no ordering
   * and the `order` this file declares is the only one there is.
   *
   * @param {{
   *   limit: number
   *   offset: number
   * }} params - Parameters.
   * @returns {RequestPagination} Pagination over the caller's own entries.
   */
  createRequestPagination ({
    limit,
    offset,
  }) {
    return this.Ctor.RequestPaginationCtor.create({
      limit,
      offset,
    })
  }

  /**
   * Format the response.
   *
   * @param {{
   *   expenseEntities: Array<model.Expense>
   *   responsePagination: import('@openreachtech/renchan-sequelize').ResponsePagination
   *   sort: server.graphql.staff.Sort | null
   * }} params - Parameters.
   * @returns {server.graphql.staff.ExpensesResult} One page of entries, and the pagination of the whole set.
   */
  formatResponse ({
    expenseEntities,
    responsePagination,
    sort,
  }) {
    const expenses = expenseEntities
      .map(expenseEntity =>
        this.formatExpense({
          expenseEntity,
        })
      )

    const pagination = this.formatPagination({
      responsePagination,
      sort,
    })

    return {
      expenses,
      pagination,
    }
  }

  /**
   * Format one entry into the shape the contract declares.
   *
   * `memo` is handed on as it was read, null included: it is the one genuinely optional field,
   * `String` rather than `String!` in the schema, and a row carrying none must read back empty
   * rather than fail.
   *
   * `spentOn` arrives from a `DATEONLY` column as the ISO `YYYY-MM-DD` string the contract asks
   * for, so nothing formats it. `createdAt` and `updatedAt` are handed on as `Date`s, which is
   * what the `DateTime` scalar serializes.
   *
   * @param {{
   *   expenseEntity: model.Expense
   * }} params - Parameters.
   * @returns {server.graphql.staff.Expense} One recorded entry.
   */
  formatExpense ({
    expenseEntity,
  }) {
    const {
      id,
      spentOn,
      amount,
      memo,
      status,
      createdAt,
      updatedAt,
    } = expenseEntity

    const expenseCategoryEntity = expenseEntity.ExpenseCategory

    const expenseCategory = this.formatExpenseCategory({
      expenseCategoryEntity,
    })

    return {
      id,
      spentOn,
      amount,
      memo,
      status,
      expenseCategory,
      createdAt,
      updatedAt,
    }
  }

  /**
   * Format the category an entry belongs to.
   *
   * @param {{
   *   expenseCategoryEntity: model.ExpenseCategory
   * }} params - Parameters.
   * @returns {server.graphql.staff.ExpenseCategory} The category of one entry.
   */
  formatExpenseCategory ({
    expenseCategoryEntity,
  }) {
    const {
      id,
      name,
      displayOrder,
    } = expenseCategoryEntity

    return {
      id,
      name,
      displayOrder,
    }
  }

  /**
   * Format the pagination block of the response.
   *
   * **This is where `totalNumber` becomes `totalRecords`.** The mixin's response value object
   * names it one way and the contract names it the other, and the rename lives in exactly one
   * place so that neither name leaks into the other's side.
   *
   * The total is of the whole set, not of the page — see the class comment for why that holds
   * only while `options` carries no `limit`.
   *
   * @param {{
   *   responsePagination: import('@openreachtech/renchan-sequelize').ResponsePagination
   *   sort: server.graphql.staff.Sort | null
   * }} params - Parameters.
   * @returns {server.graphql.staff.Pagination} The pagination of the whole set this page came from.
   */
  formatPagination ({
    responsePagination,
    sort,
  }) {
    const {
      limit,
      offset,
    } = responsePagination

    const totalRecords = responsePagination.totalNumber

    return {
      limit,
      offset,
      sort,
      totalRecords,
    }
  }
}
