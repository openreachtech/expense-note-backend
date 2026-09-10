'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

/*
 * Development fixtures: the members of staff a test signs in as (design document 1.0.0, section 9.1).
 *
 * Section 4 rules a sign-up operation out of scope -- an account is issued by an operator outside
 * the product -- so nothing in the product can create one. These rows are therefore the only way
 * section 10's first use case ("signs in with the address and password they were issued") has
 * anybody to sign in as, and the only way an end-to-end run reaches a signed-in screen at all.
 *
 * A row here carries a name and nothing else. The sign-in address and the password digest sit in
 * their own tables (sections 9.4 and 9.5), whose seeders are the two files after this one, so that
 * a read of somebody's name cannot carry a credential in its result set. The two child seeders
 * carry a later timestamp than this file, so a parent row always exists before a child points at it.
 *
 * Case coverage, which is what a `development/` seeder owes:
 *   - 10110001..10110010 -- complete accounts. One address and one digest each: these sign in.
 *   - 10110011..10110013 -- incomplete accounts, the inconsistent states the code still has to
 *     answer for. Sections 9.4 and 9.5 each hold one row per member of staff, and an account issued
 *     halfway is what a partial issue leaves behind. Each of the three is labelled at its row.
 */

const TABLE_NAME = 'staff_members'

const seeds = [
  // Complete accounts -- an address in staff_member_secrets and a digest in staff_member_password_hashes.
  { id: 10110001, name: 'Haruka Arai' },
  { id: 10110002, name: 'Kenji Ogawa' },
  { id: 10110003, name: 'Mio Fukuda' },
  { id: 10110004, name: 'Souta Nishimura' },
  { id: 10110005, name: 'Rin Takahashi' },
  { id: 10110006, name: 'Yuuto Kirishima' },
  { id: 10110007, name: 'Nanami Doi' },
  { id: 10110008, name: 'Riku Hasegawa' },
  { id: 10110009, name: 'Aoi Tsuchiya' },
  { id: 10110010, name: 'Daiki Morishita' },

  // Incomplete accounts -- error paths. No unique index is broken by any of the three: what is
  // absent is a row, not a duplicate.
  { id: 10110011, name: 'Sakura Umeda' }, // holds an address, holds no digest -- no password can verify
  { id: 10110012, name: 'Tsubasa Enomoto' }, // holds neither -- a name with no credential at all
  { id: 10110013, name: 'Kaede Shirai' }, // holds a digest, holds no address -- nothing to look the row up by
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(seeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: seeds.map(it => it.id) })
  },
}
