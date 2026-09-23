import {
  Op,
} from 'sequelize'

import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import EXPENSE_ENTRY_ORDER_CONSTANT_HASH from '../../../../../../app/constants/expenseEntryOrderConstants.js'

import CalendarMonthRangeBuilder from '../../../../../../app/tools/calendar/CalendarMonthRangeBuilder.js'

import MonthlyExpensesInputValidator from '../../../../../../app/tools/validator/resolvers/staff/queries/MonthlyExpensesInputValidator.js'

import Expense from '../../../../../../sequelize/models/Expense.js'
import ExpenseCategory from '../../../../../../sequelize/models/ExpenseCategory.js'

const {
  EXPENSE_ENTRY_ORDER,
} = EXPENSE_ENTRY_ORDER_CONSTANT_HASH

/**
 * Resolver of the `monthlyExpenses` query.
 *
 * Answers one calendar month of the **caller's own** recorded expenses, and the total taken over
 * them, newest `spentOn` first and, where two share a date, the more recently recorded first (spec
 * section 6, `entry order`).
 *
 * -------------------------------------------------------------------------------------------
 * Whose rows come back
 * -------------------------------------------------------------------------------------------
 *
 * `context.staffMemberId` — the id the framework resolved from the request's access token — is one
 * of the two things the `where` narrows by, and it is never taken from the input: there is no
 * `staffMemberId` field in `MonthlyExpensesInput` to take it from, which is what makes "nobody sees
 * anybody else's" a property of the contract rather than of a check. **Another member of staff's
 * entry in the same month is not filtered out of the result, it is outside the query** — so it
 * cannot reach the rows, and it cannot reach the total either, because the total is taken over the
 * rows this operation returns and over nothing else. That is section 12's fifth acceptance
 * criterion, and it is answered by the `where` rather than by a subtraction.
 *
 * **The refusal of a caller with no session is the engine's, not this method's.** `monthlyExpenses`
 * is deliberately absent from `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, so the
 * authentication filter refuses a tokenless caller before `resolve()` is entered. The null guard
 * below is the second line and defence in depth only, for the case where that hand-maintained list
 * is wrong — the same shape `ExpensesQueryResolver` and `SignedInStaffMemberQueryResolver` use, and
 * for the same reason. It is answered **before the input is looked at and before a row is read**,
 * which is section 12's last acceptance criterion word for word: refused without a session, before
 * it reads anything.
 *
 * (`expenseCategories` is the one operation of this audience carrying no such guard. That is
 * recorded in the acceptance record as a gap, not as the pattern to copy.)
 *
 * -------------------------------------------------------------------------------------------
 * How the month reaches the database
 * -------------------------------------------------------------------------------------------
 *
 * **As a range over the bare `spentOn` column** — `{ [Op.between]: [firstCalendarDate,
 * lastCalendarDate] }` — with the two ends built by `CalendarMonthRangeBuilder`, which is where the
 * calendar arithmetic and the leap years live.
 *
 * `Op.between` is inclusive at both ends, which is section 12's second acceptance criterion: an
 * expense dated the first or the last day of the chosen month is in it, and one dated the day
 * before or the day after is not. Nothing else in this file decides that — the two ends are the
 * whole of the boundary.
 *
 * **The column is never wrapped in a function, and that is a requirement rather than a taste.**
 * Section 7 requires one member of staff's month to stay a single indexed read, and section 9.3's
 * index is the composite `(staff_member_id, spent_on)` — whose two columns are exactly the two this
 * `where` names, in that order. `WHERE YEAR(spent_on) = ? AND MONTH(spent_on) = ?` would make the
 * predicate non-sargable and leave that index unused, and SQLite has no `YEAR()` or `MONTH()` at
 * all, so the same query would need `strftime` there and not on the store section 8 declares. A
 * range over the bare column is the one predicate both dialects answer from the index.
 *
 * **The category is eager-loaded**, which is what keeps a month a bounded number of queries instead
 * of one per row. Both of `Expense`'s associations are `belongsTo`, so each expense joins at most
 * one row of each.
 *
 * **There is no pagination**, because section 12.1 declares none: the operation answers the whole
 * month. What bounds it is section 7's *heaviest single operation* row — one member of staff's
 * month, at most a few hundred rows — so `PAGINATION.MAXIMUM_LIMIT` has no `limit` here to cap and
 * is deliberately not consulted.
 *
 * -------------------------------------------------------------------------------------------
 * Why the total is a sum of the array and not a second query
 * -------------------------------------------------------------------------------------------
 *
 * **`totalAmount` is summed over the very array this operation returns**, in `#formatResponse()`,
 * after the rows have been formatted. It is never a `SUM()` of its own.
 *
 * Section 12.1 states the reason one operation returns both: so that the two can never disagree.
 * Section 12's first acceptance criterion is not "the total is right" but "the total equals the sum
 * of the amounts of **the entries shown**" — a statement about *those* rows. A second query,
 * however carefully its `where` were copied, is a second observation of the table and may see a
 * different set: a row recorded between the two reads lands in the total and not in the list, and
 * the screen is wrong in the one way this operation exists to prevent. Summing the array cannot do
 * that, because there is only one set of rows to sum.
 *
 * `amount` is an integer number of yen (section 9.3) — the yen has no minor unit — so the sum is
 * integer addition and no `BigNumber` is involved. An empty month sums to `0`, which is section
 * 12's third acceptance criterion arriving for free rather than as a special case.
 *
 * -------------------------------------------------------------------------------------------
 * What this operation does not do
 * -------------------------------------------------------------------------------------------
 *
 * Nothing is written: this is a query, so it takes no transaction and calls no `create` / `update`,
 * per the CQRS rule. **It stores no total and caches nothing**, which is what makes section 12's
 * fourth acceptance criterion — an expense recorded, corrected or removed is reflected on the next
 * read — a property of reading the rows each time rather than of an invalidation somebody has to
 * remember.
 *
 * The stub at `stub/queries/MonthlyExpensesQueryResolver.js` stays in place and keeps the same
 * class name and the same interface; the frontend builds against it until checkpoint 16.
 *
 * @augments {BaseQueryResolver}
 */
export default class MonthlyExpensesQueryResolver extends BaseQueryResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'monthlyExpenses'
  }

  /**
   * get: Error code hash.
   *
   * `Q004` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
   *
   * The two `203` codes are the validator's, one per rule `MonthlyExpensesInputValidator` declares,
   * and the names are the ones it reads off `this.errorHash` — a name changed here refuses nothing
   * and throws on an undefined constructor instead. They are kept apart rather than merged because
   * a caller who named a month that is not a month and one who named a year no calendar date can
   * hold have different things to correct, and neither reveals anything about anybody.
   *
   * The single `204` is the session guard, and it names nobody: not the caller, not a row, not a
   * count.
   *
   * **There is no "not found" code, because this operation cannot produce one.** A month in which
   * nothing was recorded is answered with an empty list and a total of zero — an empty month is a
   * successful read, not a refusal, and section 12's third acceptance criterion requires exactly
   * that — and somebody else's entry is never selected in the first place.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,

      // Invalid input errors — one per rule MonthlyExpensesInputValidator declares.
      InvalidYear: '203.Q004.001',
      InvalidMonth: '203.Q004.002',

      // Database / state errors
      StaffMemberNotFound: '204.Q004.001',
    }
  }

  /**
   * get: MonthlyExpensesInputValidator class — a seam so tests can substitute it.
   *
   * @returns {typeof MonthlyExpensesInputValidator} The class.
   */
  static get MonthlyExpensesInputValidatorCtor () {
    return MonthlyExpensesInputValidator
  }

  /**
   * get: CalendarMonthRangeBuilder class — a seam so tests can substitute it.
   *
   * @returns {typeof CalendarMonthRangeBuilder} The class.
   */
  static get CalendarMonthRangeBuilderCtor () {
    return CalendarMonthRangeBuilder
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
   * The session guard is answered before the input is looked at and before a row is read, so a
   * caller with no session is refused without this operation reporting anything about the month
   * they asked for or about whether it holds anything.
   *
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.MonthlyExpensesInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.MonthlyExpensesResult>} One month of the caller's own entries, in section 6's entry order, and the total taken over them.
   * @throws {GraphqlType.Error} Refusal of a caller with no session, or of a month nobody could be answered for.
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
      year,
      month,
    } = input

    const expenseEntities = await this.findMonthlyExpenses({
      staffMemberId,
      year,
      month,
    })

    return this.formatResponse({
      expenseEntities,
    })
  }

  /**
   * Validate the input against every rule `MonthlyExpensesInputValidator` declares.
   *
   * The validator returns the error rather than throwing it, so the `throw` of this operation sits
   * in one place beside every other reason it refuses.
   *
   * @param {{
   *   input: server.graphql.staff.MonthlyExpensesInput
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
   * resolver's `203.Q004.*` code rather than with an error of the validator's own.
   *
   * @param {{
   *   input: server.graphql.staff.MonthlyExpensesInput
   * }} params - Parameters.
   * @returns {MonthlyExpensesInputValidator} Input validator over this request's input.
   */
  createInputValidator ({
    input,
  }) {
    return this.Ctor.MonthlyExpensesInputValidatorCtor.create({
      input,
      errorHash: this.errorHash,
    })
  }

  /**
   * Find one calendar month of the entries a member of staff recorded.
   *
   * The `where` names the owner and the month, and nothing else — so the rows of every other member
   * of staff are outside the query rather than filtered out of its result, and the two columns it
   * names are section 9.3's composite index in its own order. The category is eager-loaded, which
   * is what keeps a month a bounded number of queries instead of one per row.
   *
   * The ordering is `EXPENSE_ENTRY_ORDER.CLAUSE`, whose two keys and their provenance are set out
   * in `constants/expenseEntryOrderConstants.cjs`. It is the same clause `expenses` answers in,
   * read from the same place, which is how the two screens cannot disagree about one day.
   *
   * There is no `limit` and no `offset`: section 12.1 declares no pagination, and the whole month
   * is the answer.
   *
   * @param {{
   *   staffMemberId: number
   *   year: number
   *   month: number
   * }} params - Parameters.
   * @returns {Promise<Array<model.Expense>>} The month's entries in section 6's entry order.
   */
  async findMonthlyExpenses ({
    staffMemberId,
    year,
    month,
  }) {
    const {
      firstCalendarDate,
      lastCalendarDate,
    } = this.buildCalendarDateRange({
      year,
      month,
    })

    return /** @type {*} */ (
      this.ExpenseModel.findAll({
        where: {
          StaffMemberId: staffMemberId,
          spentOn: {
            [Op.between]: [
              firstCalendarDate,
              lastCalendarDate,
            ],
          },
        },
        include: [
          this.ExpenseCategoryModel,
        ],
        order: /** @type {import('sequelize').Order} */ (EXPENSE_ENTRY_ORDER.CLAUSE),
      })
    )
  }

  /**
   * Build the two calendar dates that are the ends of the chosen month.
   *
   * Both ends come from one builder call, so this operation cannot pair the first day of one month
   * with the last day of another.
   *
   * @param {{
   *   year: number
   *   month: number
   * }} params - Parameters.
   * @returns {{
   *   firstCalendarDate: string
   *   lastCalendarDate: string
   * }} The first and the last day of the chosen month, each as `YYYY-MM-DD`.
   */
  buildCalendarDateRange ({
    year,
    month,
  }) {
    const calendarMonthRangeBuilder = this.createCalendarMonthRangeBuilder({
      year,
      month,
    })

    return calendarMonthRangeBuilder.buildCalendarDateRange()
  }

  /**
   * Create the builder that knows where a calendar month begins and ends.
   *
   * @param {{
   *   year: number
   *   month: number
   * }} params - Parameters.
   * @returns {CalendarMonthRangeBuilder} Builder over the chosen month.
   */
  createCalendarMonthRangeBuilder ({
    year,
    month,
  }) {
    return this.Ctor.CalendarMonthRangeBuilderCtor.create({
      year,
      month,
    })
  }

  /**
   * Format the response.
   *
   * **The total is summed over `expenses` — the array this method is about to answer with — rather
   * than over the entities it was handed or over a query of its own.** That is what makes section
   * 12's first acceptance criterion true by construction: the entries shown and the amounts summed
   * are one array, read once, and no editing of this method can make them two.
   *
   * @param {{
   *   expenseEntities: Array<model.Expense>
   * }} params - Parameters.
   * @returns {server.graphql.staff.MonthlyExpensesResult} The month's entries, and the total taken over them.
   */
  formatResponse ({
    expenseEntities,
  }) {
    const expenses = expenseEntities
      .map(expenseEntity =>
        this.formatExpense({
          expenseEntity,
        })
      )

    const totalAmount = this.calculateTotalAmount({
      expenses,
    })

    return {
      expenses,
      totalAmount,
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
   * for, so nothing formats it. `createdAt` and `updatedAt` are handed on as `Date`s, which is what
   * the `DateTime` scalar serializes.
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
   * Calculate the month's total, over the entries the operation answers with.
   *
   * Integer addition: `amount` is a whole number of yen (section 9.3), the yen has no minor unit,
   * and section 12's criterion is "to the yen". A month holding nothing sums to `0`, which is the
   * empty-month criterion answered by the seed of the reduction rather than by a branch.
   *
   * @param {{
   *   expenses: Array<server.graphql.staff.Expense>
   * }} params - Parameters.
   * @returns {number} The sum of the amounts of the entries answered with, in yen.
   */
  calculateTotalAmount ({
    expenses,
  }) {
    return expenses
      .reduce(
        (total, expense) => total + expense.amount,
        0
      )
  }
}
