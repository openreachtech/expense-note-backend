'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

/*
 * Production master: the four expense categories (design document 1.0.0, section 9.2).
 *
 * A category is a seeded row with an id, never an enum written into the code -- section 4 names that
 * as the seam an operator-editable category list is added on later. This seeder is therefore the
 * only place the four names appear.
 *
 * `display_order` is the order the four are offered in, taken from section 6's terminology entry:
 * transport, meals, supplies, other.
 */

const TABLE_NAME = 'expense_categories'

const seeds = [
  { id: 10000001, name: 'transport', display_order: 1 },
  { id: 10000002, name: 'meals', display_order: 2 },
  { id: 10000003, name: 'supplies', display_order: 3 },
  { id: 10000004, name: 'other', display_order: 4 },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(seeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: seeds.map(it => it.id) })
  },
}
