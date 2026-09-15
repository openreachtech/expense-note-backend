import {
  BaseQueryResolver,
} from '@openreachtech/renchan'

import ExpenseCategory from '../../../../../../sequelize/models/ExpenseCategory.js'

/*
 * The order this operation answers in.
 *
 * **`displayOrder`, ascending.** The column exists for exactly one reason — to fix the order a
 * screen offers the categories in, which spec section 6's terminology entry settles as transport,
 * meals, supplies, other — so reading the table without naming it would leave the answer to
 * whatever order the engine happened to return rows in. That would look right today, because the
 * master seeder inserts the four in display order and a fresh table hands them back that way, and
 * it would drift the first time a category is added out of order or re-ordered in place.
 *
 * No tie-break follows it, and that is deliberate rather than forgotten. `display_order` is the
 * one thing the order is decided by, and two categories sharing a value is a broken master row
 * rather than a case this resolver settles.
 *
 * It is declared once, as a module constant, so that the clause this operation owes is a fact of
 * the file rather than a literal buried in a method.
 */
const EXPENSE_CATEGORIES_ORDER = [
  ['displayOrder', 'ASC'],
]

/**
 * Resolver of the `expenseCategories` query.
 *
 * Answers the whole category master, in display order, so that a screen can offer the four and
 * match a chosen one back by id to the category on any entry `expenses` reads back.
 *
 * The operation takes no argument. The SDL declares `expenseCategories: ExpenseCategoriesResult!`
 * with no input — the category master is the same for everybody and there is nothing to narrow it
 * by — and the convention gives an operation with no input no argument at all, exactly as
 * `SignOutMutationResolver` explains for itself. So there is no input type to destructure, no
 * `*InputValidator`, no `validateInput()` and no `203.*` code here.
 *
 * -------------------------------------------------------------------------------------------
 * Whose rows come back: everybody's, because there are no rows of anybody's
 * -------------------------------------------------------------------------------------------
 *
 * **This operation reads a master table, not the caller's own rows, so nothing is scoped to a
 * member of staff.** `expense_categories` holds four rows seeded by
 * `sequelize/seeders/master/20260908181714-000001-expense_categories.cjs`; not one of them belongs
 * to anybody, and there is no column that could narrow them. The ownership rule every other
 * operation of this feature carries — the `where` names the caller and nothing else — is
 * inapplicable here rather than missing, and `context` is therefore never read at all.
 *
 * **It is still not a public operation.** `expenseCategories` is deliberately absent from
 * `StaffGraphqlServerEngine#get:schemasToSkipFiltering`, which names only `signIn`, `signOut` and
 * `renewAccessToken`, so the framework's authentication filter refuses a caller holding no live
 * access token before `resolve()` is ever entered. Spec section 11's criterion — every operation
 * this feature adds is refused without a session, before it reads anything — is met that way, by
 * the engine, and not by any code in this file. There is consequently no session guard below and
 * no `204` code for one: a guard here would be a second line of defence for a rule this resolver
 * does not itself hold, and it would have to invent a refusal for a read that cannot fail.
 *
 * -------------------------------------------------------------------------------------------
 * Re-read per request, and not cached
 * -------------------------------------------------------------------------------------------
 *
 * **Every call reads the four rows again.** Four rows off a table with no `where` is a cost this
 * feature has stated no need to avoid, while a cache would have to be invalidated the moment
 * section 4's operator-editable category list lands — so caching now would buy nothing measured
 * and owe an invalidation nobody has specified.
 *
 * Nothing is written: this is a query, so it takes no transaction and calls no `create` /
 * `update`, per the CQRS rule.
 *
 * @augments {BaseQueryResolver}
 */
export default class ExpenseCategoriesQueryResolver extends BaseQueryResolver {
  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'expenseCategories'
  }

  /**
   * get: Error code hash.
   *
   * **Empty, because this operation cannot refuse anything.** It takes no input, so it holds no
   * `203` rule; it reads a master table nobody owns, so it holds no `204` session guard; and a
   * master that seeded no row would come back as an empty list, which is a successful read of an
   * empty table rather than a refusal.
   *
   * `Q003` is this operation's stable id all the same, fixed in
   * `server/graphql/resolver-id-hash-staff.js` — every operation of this audience holds an entry
   * there, including one that declares no error code of its own.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,
    }
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
   * Takes nothing and reads nothing off the request: the answer is the same for every caller the
   * engine's authentication filter let through.
   *
   * @override
   * @returns {Promise<server.graphql.staff.ExpenseCategoriesResult>} The category master, in display order.
   * @public
   */
  async resolve () {
    const expenseCategoryEntities = await this.findExpenseCategories()

    return this.formatResponse({
      expenseCategoryEntities,
    })
  }

  /**
   * Find the whole category master, in display order.
   *
   * No `where`: every row of the table is part of the answer. The ordering is the module constant
   * above, and it is the only thing this read decides.
   *
   * @returns {Promise<Array<model.ExpenseCategory>>} Every category, `displayOrder` ascending.
   */
  async findExpenseCategories () {
    return /** @type {*} */ (
      this.ExpenseCategoryModel.findAll({
        order: EXPENSE_CATEGORIES_ORDER,
      })
    )
  }

  /**
   * Format the response.
   *
   * @param {{
   *   expenseCategoryEntities: Array<model.ExpenseCategory>
   * }} params - Parameters.
   * @returns {server.graphql.staff.ExpenseCategoriesResult} The category master, in display order.
   */
  formatResponse ({
    expenseCategoryEntities,
  }) {
    const expenseCategories = expenseCategoryEntities
      .map(expenseCategoryEntity =>
        this.formatExpenseCategory({
          expenseCategoryEntity,
        })
      )

    return {
      expenseCategories,
    }
  }

  /**
   * Format one category into the shape the contract declares.
   *
   * The three fields are the whole of `ExpenseCategory` in the SDL, and each is `!`, so nothing
   * here may be absent. `createdAt` and `updatedAt` exist on the row and are deliberately not
   * carried: the contract does not declare them on this type, and a category's stamps say nothing
   * a screen offering it could use.
   *
   * @param {{
   *   expenseCategoryEntity: model.ExpenseCategory
   * }} params - Parameters.
   * @returns {server.graphql.staff.ExpenseCategory} One category of the master.
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
}
