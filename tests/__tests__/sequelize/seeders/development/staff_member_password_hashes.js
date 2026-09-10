import PasswordEncipher from '../../../../../app/session/PasswordEncipher.js'
import StaffMemberPasswordHash from '../../../../../sequelize/models/StaffMemberPasswordHash.js'

/*
 * What this file holds the seeder to.
 *
 * Section 4 rules a sign-up operation out of scope, so no code path in the product issues a
 * password: the seeded digests are the only credentials that exist, and a plaintext recorded
 * against a digest that does not actually verify would leave section 10's first use case
 * unreachable while every literal in the seeder still looked right. The digests are written into
 * the seeder as literals -- a `.cjs` seeder cannot reach the ESM encipher -- so nothing but a
 * comparison against the running database says they are the digests of the plaintexts recorded
 * beside them. That comparison is what each case below makes, through the same class `signIn`
 * will verify with.
 *
 * A digest is one-way, so this cannot be satisfied by echoing the seeder's own literals back.
 */
describe('staff_member_password_hashes development seeder', () => {
  describe('should verify each seeded digest against the password recorded against it', () => {
    const cases = [
      {
        params: {
          staffMemberId: 10110001,
          password: 'haruka-monday-8401',
        },
      },
      {
        params: {
          staffMemberId: 10110002,
          password: 'kenji-tuesday-3927',
        },
      },
      {
        params: {
          staffMemberId: 10110003,
          password: 'mio-wednesday-5714',
        },
      },
      {
        params: {
          staffMemberId: 10110004,
          password: 'souta-thursday-6238',
        },
      },
      {
        params: {
          staffMemberId: 10110005,
          password: 'rin-friday-7052',
        },
      },
      {
        params: {
          staffMemberId: 10110006,
          password: 'yuuto-saturday-4165',
        },
      },
      {
        params: {
          staffMemberId: 10110007,
          password: 'nanami-sunday-9376',
        },
      },
      {
        params: {
          staffMemberId: 10110008,
          password: 'riku-january-2589',
        },
      },
      {
        params: {
          staffMemberId: 10110009,
          password: 'aoi-february-8130',
        },
      },
      {
        params: {
          staffMemberId: 10110010,
          password: 'daiki-march-4703',
        },
      },
      {
        params: {
          staffMemberId: 10110013,
          password: 'kaede-april-6914',
        },
      },
    ]

    test.each(cases)('password: $params.password', async ({
      params,
    }) => {
      const passwordEncipher = PasswordEncipher.create()

      const passwordHash = await StaffMemberPasswordHash.findOne({
        where: {
          StaffMemberId: params.staffMemberId,
        },
      })

      const actual = await passwordHash.verifiesPassword({
        password: params.password,
        passwordEncipher,
      })

      expect(actual)
        .toBeTruthy()
    })
  })
})

/*
 * The same eleven rows, refusing a password that is not theirs. Without this the describe above
 * would pass against a digest of the empty string, or against any digest that happened to accept
 * everything -- so the pair is what says a seeded credential is the credential it claims to be.
 */
describe('staff_member_password_hashes development seeder', () => {
  describe('should refuse a password that is not the one recorded', () => {
    const cases = [
      {
        params: {
          staffMemberId: 10110001,
          password: 'haruka-monday-8402',
        },
      },
      {
        params: {
          staffMemberId: 10110002,
          password: 'kenji-tuesday-3928',
        },
      },
      {
        params: {
          staffMemberId: 10110003,
          password: 'mio-wednesday-5715',
        },
      },
      {
        params: {
          staffMemberId: 10110004,
          password: 'souta-thursday-6239',
        },
      },
      {
        params: {
          staffMemberId: 10110005,
          password: 'rin-friday-7053',
        },
      },
      {
        params: {
          staffMemberId: 10110006,
          password: 'yuuto-saturday-4166',
        },
      },
      {
        params: {
          staffMemberId: 10110007,
          password: 'nanami-sunday-9377',
        },
      },
      {
        params: {
          staffMemberId: 10110008,
          password: 'riku-january-2580',
        },
      },
      {
        params: {
          staffMemberId: 10110009,
          password: 'aoi-february-8131',
        },
      },
      {
        params: {
          staffMemberId: 10110010,
          password: 'daiki-march-4704',
        },
      },
      {
        params: {
          staffMemberId: 10110013,
          password: 'kaede-april-6915',
        },
      },
    ]

    test.each(cases)('password: $params.password', async ({
      params,
    }) => {
      const passwordEncipher = PasswordEncipher.create()

      const passwordHash = await StaffMemberPasswordHash.findOne({
        where: {
          StaffMemberId: params.staffMemberId,
        },
      })

      const actual = await passwordHash.verifiesPassword({
        password: params.password,
        passwordEncipher,
      })

      expect(actual)
        .toBeFalsy()
    })
  })
})

/*
 * The seeded error paths. Section 9.5 holds one row per member of staff, and these two hold none:
 * one has a sign-in address that resolves and no digest behind it, the other has neither.
 */
describe('staff_member_password_hashes development seeder', () => {
  describe('should leave a seeded member of staff who holds no digest without one', () => {
    const cases = [
      {
        params: {
          staffMemberId: 10110011,
        },
      },
      {
        params: {
          staffMemberId: 10110012,
        },
      },
    ]

    test.each(cases)('staffMemberId: $params.staffMemberId', async ({
      params,
    }) => {
      const actual = await StaffMemberPasswordHash.findOne({
        where: {
          StaffMemberId: params.staffMemberId,
        },
      })

      expect(actual)
        .toBeNull()
    })
  })
})
