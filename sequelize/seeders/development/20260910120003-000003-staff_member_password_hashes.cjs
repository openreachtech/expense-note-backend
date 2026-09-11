'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

/*
 * Development fixtures: the password digest of each seeded member of staff (design document 1.0.0,
 * section 9.5). One row per member of staff, and the only thing a candidate password is verified against.
 *
 * **Each digest below is a real bcrypt digest, and the plaintext it was made from is recorded beside
 * it.** The pairing is the whole point of this file: section 4 rules a sign-up operation out of scope,
 * so no code path in the product can issue a password, and without a plaintext a test knows, section
 * 10's first use case has no password to sign in with. A plaintext is therefore development fixture
 * data by design -- it is written here, in `sequelize/seeders/development/`, which only `db:seed:dev`
 * loads, and which neither the production master set nor any production script ever touches.
 *
 * The digests are literals rather than computed in `up` for one reason: a seeder is CommonJS `.cjs`,
 * `app/session/PasswordEncipher.js` is ESM, and a `require` of the one from the other resolves to a
 * promise rather than to a class. They were produced with the same library and the same cost factor
 * that class uses -- `bcryptjs`, cost 10 -- so `PasswordEncipher#comparesPassword()` verifies every
 * one of them; bcrypt reads the salt and the cost factor back out of the digest itself. Each was
 * compared back against its plaintext before being written in, and
 * `tests/__tests__/sequelize/seeders/development/staff_member_password_hashes.js` re-checks all
 * eleven against the running database, so a mistyped literal fails a test rather than a sign-in.
 *
 * A digest is unique across these rows without being chosen to be: bcrypt salts each call, so two
 * members of staff sharing a password would still not share a digest. Here no two share a password either.
 *
 * `saved_at` is a business datetime -- since when this digest is the password -- so it is written
 * explicitly. `created_at` / `updated_at` come from `TimestampSeedsSupplier`.
 *
 * Case coverage: 10130001..10130010 are the complete accounts, each verifying the password recorded
 * against it; 10130011 belongs to a member of staff who holds no sign-in address, so its digest is
 * correct and unreachable. The two members of staff who hold no digest (10110011 and 10110012) are
 * absent from this table by design.
 */

const TABLE_NAME = 'staff_member_password_hashes'

const seeds = [
  // Complete accounts. The plaintext beside each digest is what signs that member of staff in.
  { id: 10130001, staff_member_id: 10110001, password_hash: '$2b$10$V90edHnmSSmY7AvsmzwYfe2m6U.vwxX4g3ZMF3uw3qPnnJtohHToq', saved_at: new Date('2026-02-05T10:31:21.101Z') }, // haruka-monday-8401
  { id: 10130002, staff_member_id: 10110002, password_hash: '$2b$10$wEleB.2B36teRs8KphsooO50SYIH1Ecl5ip2Vfd6NFzgUhke1ek5i', saved_at: new Date('2026-02-06T10:32:22.102Z') }, // kenji-tuesday-3927
  { id: 10130003, staff_member_id: 10110003, password_hash: '$2b$10$i4nKEd7.7m4LUgUaHZ8L5uHWzydlfwJIe8qWCORwNgmGlRUHiGHei', saved_at: new Date('2026-02-09T10:33:23.103Z') }, // mio-wednesday-5714
  { id: 10130004, staff_member_id: 10110004, password_hash: '$2b$10$ifLDRhjMDva/DCm0huYAhuIuMumXrLdsFg/9QUs92LKL6ij8rnuQi', saved_at: new Date('2026-02-10T10:34:24.104Z') }, // souta-thursday-6238
  { id: 10130005, staff_member_id: 10110005, password_hash: '$2b$10$eKrA4Uqb4u6F/tNBjrvnLu0IyCs4JZ/txfOqVx8umPO2yzfNDigFu', saved_at: new Date('2026-02-11T10:35:25.105Z') }, // rin-friday-7052
  { id: 10130006, staff_member_id: 10110006, password_hash: '$2b$10$fE5zrxNOvklxTlAp/kMLcOcZhq.98X9qiu./XcuS9LUDROC9nDEHa', saved_at: new Date('2026-02-12T10:36:26.106Z') }, // yuuto-saturday-4165
  { id: 10130007, staff_member_id: 10110007, password_hash: '$2b$10$ZefSdf9mHP26AAL36qxXvOnPiuBZwc6RbyMME2G57lWkqJ34qmPaa', saved_at: new Date('2026-02-13T10:37:27.107Z') }, // nanami-sunday-9376
  { id: 10130008, staff_member_id: 10110008, password_hash: '$2b$10$.jRmdGCu/4TxnJGmgOg6aOa74vDoOTfzj2TE1jIgn8GL84TBNlKbW', saved_at: new Date('2026-02-16T10:38:28.108Z') }, // riku-january-2589
  { id: 10130009, staff_member_id: 10110009, password_hash: '$2b$10$ibPKL5zb1xW5cf9uu2V93ujesYjdzuJHuvr6CxoWmpMwrdJ/.SdeK', saved_at: new Date('2026-02-17T10:39:29.109Z') }, // aoi-february-8130
  { id: 10130010, staff_member_id: 10110010, password_hash: '$2b$10$yoBi1LYL9ONEvquX.OXO0OKsakYU1z4AjPR1ZxGMRpbdUSCJaHAw.', saved_at: new Date('2026-02-18T10:40:30.110Z') }, // daiki-march-4703

  // Error path -- this member of staff holds no sign-in address, so nothing can look the row up to
  // verify against it.
  { id: 10130011, staff_member_id: 10110013, password_hash: '$2b$10$5N888AeTZHSMEYYJJqt5B.NtO1YZuPptgFXoBBBuOL38hBLMIynZm', saved_at: new Date('2026-02-19T10:41:31.111Z') }, // kaede-april-6914
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(seeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: seeds.map(it => it.id) })
  },
}
