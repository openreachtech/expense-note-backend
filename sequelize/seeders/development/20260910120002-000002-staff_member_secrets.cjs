'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

/*
 * Development fixtures: the sign-in address of each seeded member of staff (design document 1.0.0,
 * section 9.4). One row per member of staff, and the only thing `signIn` looks a member of staff up by.
 *
 * **Every address here is already written in its stored, normalized form, and that is load-bearing.**
 * `queryInterface.bulkInsert` speaks to the driver and reaches no Sequelize hook, so
 * StaffMemberSecret's `beforeSave` / `beforeBulkCreate` / `beforeBulkUpdate` -- the three hooks that
 * lower-case an address on the way in -- run for none of these rows. An address seeded with a capital
 * in it would therefore land in the table un-normalized, and `signIn`, which looks up by the
 * normalized form of what was presented, would never find it: the account would simply not work, and
 * nothing would fail while seeding. The stored form is what
 * `StaffMemberSecret.generateNormalizedEmail()` produces, which today is `String#toLowerCase()` --
 * lower case only, so a dot, a `+` tag and a subdomain all survive it unchanged.
 *
 * **The domain is `expense-note.example`, not `example.com`, on purpose.** The unique index on
 * `email` is global, and the tests under `tests/_orders/StaffMemberSecret/` insert their own rows on
 * `example.com` / `sub.example.com` while these seeded rows are present. Seeding an address on those
 * domains would make one of those inserts collide. `.example` is a reserved, unroutable TLD (RFC 2606).
 *
 * `saved_at` is a business datetime -- since when this address is the sign-in identifier -- so it is
 * written here explicitly. `created_at` / `updated_at` are audit columns and come from
 * `TimestampSeedsSupplier`.
 *
 * Case coverage: 10120001..10120010 are the complete accounts; 10120011 belongs to a member of staff
 * who holds no password digest, so a correct address there can still verify no password. The two
 * members of staff with no address at all (10110012 and 10110013) are absent from this table by design.
 */

const TABLE_NAME = 'staff_member_secrets'

const seeds = [
  // Complete accounts -- each of these ten also holds a password digest.
  { id: 10120001, staff_member_id: 10110001, email: 'haruka.arai@expense-note.example', saved_at: new Date('2026-01-05T09:11:01.001Z') },
  { id: 10120002, staff_member_id: 10110002, email: 'kenji.ogawa@expense-note.example', saved_at: new Date('2026-01-06T09:12:02.002Z') },
  { id: 10120003, staff_member_id: 10110003, email: 'mio.fukuda@expense-note.example', saved_at: new Date('2026-01-07T09:13:03.003Z') },
  { id: 10120004, staff_member_id: 10110004, email: 'souta.nishimura@expense-note.example', saved_at: new Date('2026-01-08T09:14:04.004Z') },
  // Naturally written `Rin.Takahashi@Expense-Note.Example`; stored lower cased, because that is the
  // form the hooks a seeder cannot reach would have produced, and the form `signIn` looks up by.
  { id: 10120005, staff_member_id: 10110005, email: 'rin.takahashi@expense-note.example', saved_at: new Date('2026-01-09T09:15:05.005Z') },
  // A `+` tag: normalization is lower-casing only, so the tag is part of the stored identifier.
  { id: 10120006, staff_member_id: 10110006, email: 'yuuto.kirishima+notes@expense-note.example', saved_at: new Date('2026-01-12T09:16:06.006Z') },
  // A subdomain, which lower-casing likewise leaves in place.
  { id: 10120007, staff_member_id: 10110007, email: 'nanami.doi@sub.expense-note.example', saved_at: new Date('2026-01-13T09:17:07.007Z') },
  { id: 10120008, staff_member_id: 10110008, email: 'riku.hasegawa@expense-note.example', saved_at: new Date('2026-01-14T09:18:08.008Z') },
  { id: 10120009, staff_member_id: 10110009, email: 'aoi.tsuchiya@expense-note.example', saved_at: new Date('2026-01-15T09:19:09.009Z') },
  { id: 10120010, staff_member_id: 10110010, email: 'daiki.morishita@expense-note.example', saved_at: new Date('2026-01-16T09:20:10.010Z') },

  // Error path -- this member of staff holds no digest, so the address resolves and no password verifies.
  { id: 10120011, staff_member_id: 10110011, email: 'sakura.umeda@expense-note.example', saved_at: new Date('2026-01-19T09:21:11.011Z') },
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(seeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: seeds.map(it => it.id) })
  },
}
