'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const {
  EXPENSE_STATUS,
} = require('../../../constants/expenseStatusConstants.cjs')

/*
 * Development fixtures: the expenses a test reads, corrects and removes (design document 1.0.0,
 * sections 9.3 and 11).
 *
 * Section 11's five operations all act on rows of this table, and four of its seven acceptance
 * criteria can only be checked against a row that already exists: correcting an entry "in place",
 * removing one and reading it a second time, and -- the security property -- reading, correcting or
 * removing somebody else's entry being answered as NOT FOUND. That last one needs a row that
 * genuinely exists and genuinely is not the caller's, which is data, not a mock.
 *
 * The four categories these rows point at are seeded by the expense_categories master seeder, and
 * the members of staff they belong to by the staff_members development seeder. `bulkInsert` writes
 * raw columns and reaches no Sequelize hook, so the Expense model's reference checks do NOT run for
 * these rows: nothing but the test beside this file says the ids below point at rows that exist.
 *
 * --------------------------------------------------------------------------------------------
 * Explicit ids, and why they are safe HERE and nowhere else in this table
 * --------------------------------------------------------------------------------------------
 *
 * `expenses` is a table the PRODUCT writes: `recordExpense` inserts a row whose id the database
 * assigns, not the caller. Mixing explicit ids into such a table manufactures its own collision:
 *
 *     a test inserts explicit id 10200401      -> the table's high-water mark is now 10200401
 *     the product mints a row, auto-incremented -> it is assigned 10200402
 *     the same test inserts explicit 10200402  -> UNIQUE violation
 *
 * The invariant is that an explicit row id is safe only where nothing but the seeder writes it, at
 * a moment nothing else is writing. This seeder satisfies that, and the argument is what makes it
 * safe -- not the absence of a failure so far:
 *
 *   - it runs once, during `db:refresh`, in a single `bulkInsert`;
 *   - it runs before any product code runs in that process, so no auto-incremented row exists yet;
 *   - nothing inserts into `expenses` between its rows -- the fourteen land in one statement;
 *   - every product write afterwards is handed an id ABOVE this whole block, so no auto-incremented
 *     row can ever land inside it.
 *
 * That last point rests on the column, which the create-table migration declares as
 * `INTEGER PRIMARY KEY AUTOINCREMENT`. SQLite keeps the highest id the table has EVER held in
 * `sqlite_sequence` and assigns one above it, so it neither reuses an id nor falls back below the
 * high-water mark when `removeExpense` -- a hard delete; this model is not paranoid -- takes the
 * top row away. Seeding leaves `sqlite_sequence.expenses` at 10200014, which makes 10200015 the
 * first id the product is ever handed.
 *
 * "No collision occurred" and "no collision is possible" are different claims. Only the second one
 * survives somebody adding a test later, which is why it is written out here rather than assumed.
 *
 * >>> THE PROHIBITION THIS IMPLIES <<<
 * NO TEST MAY INSERT AN EXPLICIT ID INTO `expenses` -- not in `tests/_orders/Expense/`, not
 * anywhere else. The argument above holds only because this file is the sole writer of explicit
 * ids here; a test that adds one re-opens exactly the collision drawn out above, and the failure
 * surfaces in an unrelated suite as a `SequelizeUniqueConstraintError`. A test that needs to
 * identify a row it created uses the id the database assigned and handed back.
 *
 * The block is 102 -- the row-id prefix allocated to #expense-entry. Ids are eight digits: `102`
 * followed by five. No other prefix appears in this file.
 *
 * --------------------------------------------------------------------------------------------
 * Coverage
 * --------------------------------------------------------------------------------------------
 *
 *   - 10200001..10200010 -- ten rows for ONE member of staff (10110001). Section 11's `expenses`
 *     query is offset/limit paginated, so one owner needs enough rows to page through.
 *   - 10200011..10200014 -- four rows for a DIFFERENT member of staff (10110002). These are the
 *     rows that exist but are not the caller's: the NOT FOUND security property is checked against
 *     them.
 *   - 10110003..10110010 are seeded members of staff with NO expenses at all, so "a member of
 *     staff who has recorded nothing" is a readable case too.
 *   - `spent_on` is scrambled against the id order on purpose. Newest first -- the order section 11
 *     reads in -- runs 10200008, 10200004, 10200002, 10200010, 10200006, 10200005, 10200009,
 *     10200001, 10200007, 10200003, which matches neither ascending nor descending id, and the
 *     first row of the first page differs under each. A resolver that ordered by `id` or by
 *     `created_at` (every row here shares one, written in a single insert) therefore FAILS rather
 *     than passing by luck.
 *   - No two rows of the SAME member of staff share a `spent_on`, and that is STILL deliberate --
 *     but the reason has changed and the sentence here once said the old one. When these rows were
 *     written a same-date tie-break had not been decided, so seeding a tie would have been deciding
 *     it. Section 6's `entry order` row has since decided it (Q61): newest `spent_on` first, and
 *     within a date the more recently recorded first. The fixture keeps no tie anyway, because
 *     these fourteen rows land in ONE `bulkInsert` -- `created_at` is identical across them and
 *     the ids are the seeder's own, so a tie seeded here would be ordered by a recording moment
 *     that never happened. A tie is made where it is real: `tests/_orders/Expense/` records two
 *     entries on one date THROUGH `recordExpense`, in a stated order, and reads them back.
 *     `tests/__tests__/sequelize/seeders/development/expenses.js` asserts the absence of a tie
 *     here, and that test is what keeps this bullet true.
 *   - All four categories are used, by both members of staff.
 *   - Two rows carry a null memo (one per member of staff), because section 11 requires the memo to
 *     be genuinely optional and to read back empty rather than failing.
 *   - Every `spent_on` is in the past and stays there, because "an expense dated after today is
 *     refused" must never describe a seeded row.
 *   - `amount` is an integer number of yen -- the yen has no minor unit, so no decimal appears
 *     anywhere. 10200007 carries 1, the smallest amount that is accepted at all (zero and negative
 *     are refused), and 10200008 carries a large one.
 *   - Every value is distinct within a record and across records wherever the field's meaning
 *     allows. `status` is the exception and is the same on all fourteen: `recorded` is the only
 *     value 1.0.0 writes, and it is read from the constant rather than spelled here.
 */

const TABLE_NAME = 'expenses'

const seeds = [
  // Ten rows for one member of staff -- the owner a paging test reads through.
  { id: 10200001, staff_member_id: 10110001, expense_category_id: 10000001, spent_on: '2026-07-03', amount: 1200, memo: 'train fare to the client in Shinagawa', status: EXPENSE_STATUS.RECORDED },
  { id: 10200002, staff_member_id: 10110001, expense_category_id: 10000002, spent_on: '2026-08-21', amount: 880, memo: 'lunch while on site', status: EXPENSE_STATUS.RECORDED },
  { id: 10200003, staff_member_id: 10110001, expense_category_id: 10000003, spent_on: '2026-06-01', amount: 3450, memo: 'notebooks and pens for the design review', status: EXPENSE_STATUS.RECORDED }, // first day of a month
  { id: 10200004, staff_member_id: 10110001, expense_category_id: 10000004, spent_on: '2026-09-02', amount: 12000, memo: 'conference ticket', status: EXPENSE_STATUS.RECORDED },
  { id: 10200005, staff_member_id: 10110001, expense_category_id: 10000001, spent_on: '2026-07-31', amount: 260, memo: 'single bus ride back from the depot', status: EXPENSE_STATUS.RECORDED }, // last day of a month
  { id: 10200006, staff_member_id: 10110001, expense_category_id: 10000002, spent_on: '2026-08-05', amount: 5730, memo: null, status: EXPENSE_STATUS.RECORDED }, // no memo -- the memo is optional
  { id: 10200007, staff_member_id: 10110001, expense_category_id: 10000003, spent_on: '2026-06-30', amount: 1, memo: 'one envelope, bought singly', status: EXPENSE_STATUS.RECORDED }, // smallest accepted amount
  { id: 10200008, staff_member_id: 10110001, expense_category_id: 10000004, spent_on: '2026-09-09', amount: 98000, memo: 'annual membership of the standards body', status: EXPENSE_STATUS.RECORDED }, // largest amount
  { id: 10200009, staff_member_id: 10110001, expense_category_id: 10000001, spent_on: '2026-07-16', amount: 640, memo: 'taxi from the station in the rain', status: EXPENSE_STATUS.RECORDED },
  { id: 10200010, staff_member_id: 10110001, expense_category_id: 10000002, spent_on: '2026-08-13', amount: 2175, memo: 'team breakfast before the release', status: EXPENSE_STATUS.RECORDED },

  // Four rows for a different member of staff -- rows that exist and are not the caller's.
  { id: 10200011, staff_member_id: 10110002, expense_category_id: 10000003, spent_on: '2026-08-27', amount: 4390, memo: 'replacement keyboard for the shared desk', status: EXPENSE_STATUS.RECORDED },
  { id: 10200012, staff_member_id: 10110002, expense_category_id: 10000004, spent_on: '2026-07-09', amount: 715, memo: 'postage on the signed contract', status: EXPENSE_STATUS.RECORDED },
  { id: 10200013, staff_member_id: 10110002, expense_category_id: 10000001, spent_on: '2026-09-05', amount: 33500, memo: null, status: EXPENSE_STATUS.RECORDED }, // no memo -- the optional memo, on somebody else's row
  { id: 10200014, staff_member_id: 10110002, expense_category_id: 10000002, spent_on: '2026-06-18', amount: 1860, memo: 'dinner with the visiting auditor', status: EXPENSE_STATUS.RECORDED },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(seeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: seeds.map(it => it.id) })
  },
}
