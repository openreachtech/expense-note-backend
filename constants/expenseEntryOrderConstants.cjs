'use strict'

/*
 * The order every list of one member of staff's entries answers in.
 *
 * **Newest `spent_on` first, and where two entries share a date, the more recently recorded
 * first.** Spec section 6's `entry order` row is where that clause lives, and it says it in one
 * sentence **for both screens** -- section 11.2's list and section 12.2's month -- because two
 * lists of the same rows in different orders is a worse surprise than either order is a cost.
 * Section 9.3's composite `(staff_member_id, spent_on)` index serves the first key beside the
 * `where` both operations carry.
 *
 * **`id` is how this file delivers the second half, and section 6 names no column on purpose.**
 * The spec states the behaviour -- the more recently recorded first -- because `id` is what
 * happens to carry it today: the primary key, already indexed, minted ascending, so monotonic with
 * the order entries were recorded. A later column recording that moment more directly would change
 * this file and leave section 6 untouched. The spec owes the behaviour; the column is this file's.
 *
 * Ordering by `id` or by `created_at` **alone** would look right against most data and be wrong:
 * the development seeder deliberately scrambles `spent_on` against the id order, and the first row
 * of the first page differs under each.
 *
 * --------------------------------------------------------------------------------------------
 * Why it is one shared constant rather than a private one per resolver
 * --------------------------------------------------------------------------------------------
 *
 * **Two operations owe the identical clause, so two copies of it could drift** -- and a drift here
 * reintroduces exactly the defect Q61 was raised to fix. Q61 is the question that settled the
 * tie-break, and it was settled **once, in section 6, for both screens**, on the reasoning that one
 * screen breaking the tie while the other did not is the same disagreement arriving by another
 * route. Two private module constants, each correct on the day it was written, are that same
 * disagreement arriving by a third route: a later edit to one of them is invisible from the other.
 *
 * So the clause is declared once and imported twice --
 * `server/graphql/resolvers/staff/actual/queries/ExpensesQueryResolver.js` and
 * `.../MonthlyExpensesQueryResolver.js` -- and a change to section 6 is a change to this file
 * alone. Each of those two resolvers has a test pinning the `order` it hands the model, so the
 * clause is answered for on both sides rather than only here.
 *
 * --------------------------------------------------------------------------------------------
 * The second key reverses an earlier decision, and that decision was right when it was taken
 * --------------------------------------------------------------------------------------------
 *
 * Until section 6 gained its `entry order` row, `ExpensesQueryResolver` held this clause privately
 * and held **one key**, under a paragraph explaining that no tie-break followed it deliberately
 * rather than by omission: `#expense-entry`'s checkpoint 1 had not decided one, the development
 * seeder was built so as not to raise the question, and settling it in a resolver would have been
 * a resolver inventing a clause with no owner. **On a paginated view of one member of staff's
 * whole history the tie is rare**, so leaving it open cost little, and writing spec text nobody had
 * decided would have cost more.
 *
 * **What changed is the scope, not that reasoning.** Section 12 reads a single month, where a train
 * fare and a lunch on the same day is an ordinary working day rather than a rare collision -- and
 * section 12's own use case has somebody reading down the same column twice against a card
 * statement. Two reads of one month that legitimately differ are what that person meets.
 *
 * Raised as **Q61**, which set out the alternatives and what each cost, and decided by the user
 * over both of them.
 *
 * --------------------------------------------------------------------------------------------
 * Why the value is written in Sequelize's own order syntax
 * --------------------------------------------------------------------------------------------
 *
 * The array reaches Sequelize as the `order` of a find -- directly on `Model.findAll()` in
 * `monthlyExpenses`, and through the pagination mixin's `options` in `expenses` -- and it is handed
 * on unchanged in both. The attribute names are the model's (`spentOn`, `id`), not the table's
 * (`spent_on`). Writing it in the shape both consumers take means nothing translates it on the way,
 * so there is no second place for the clause to be got wrong.
 *
 * No seeder reads this today. It is still a `.cjs` master with an ESM bridge beside it, because
 * that pairing is the project's constant convention and not a per-constant judgment about who will
 * need it next.
 */
module.exports = {
  EXPENSE_ENTRY_ORDER: {
    CLAUSE: [
      ['spentOn', 'DESC'],
      ['id', 'DESC'],
    ],
  },
}
