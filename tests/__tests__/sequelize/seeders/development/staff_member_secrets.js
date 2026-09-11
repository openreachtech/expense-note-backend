import StaffMemberSecret from '../../../../../sequelize/models/StaffMemberSecret.js'

/*
 * What this file holds the seeder to, and why the seeder needs holding to anything at all.
 *
 * `queryInterface.bulkInsert` reaches no Sequelize hook, so the three hooks that lower-case a
 * sign-in address on the way in run for none of the seeded rows: an address seeded with a capital
 * in it would sit in the table un-normalized, and `signIn` -- which looks a member of staff up by
 * the normalized form of whatever was presented -- would never find it. Nothing fails while
 * seeding, and nothing fails at sign-in either; the account simply does not work. Each case below
 * therefore hands in the address as a person would naturally write it, normalizes it exactly as
 * `signIn` will, and requires that a row comes back.
 */
describe('staff_member_secrets development seeder', () => {
  describe('should store every seeded address in the form a normalized lookup finds', () => {
    const cases = [
      {
        params: {
          presentedEmail: 'Haruka.Arai@Expense-Note.Example',
        },
        expected: expect.objectContaining({
          id: 10120001,
          StaffMemberId: 10110001,
          email: 'haruka.arai@expense-note.example',
        }),
      },
      {
        params: {
          presentedEmail: 'KENJI.OGAWA@EXPENSE-NOTE.EXAMPLE',
        },
        expected: expect.objectContaining({
          id: 10120002,
          StaffMemberId: 10110002,
          email: 'kenji.ogawa@expense-note.example',
        }),
      },
      {
        params: {
          presentedEmail: 'Mio.Fukuda@expense-note.example',
        },
        expected: expect.objectContaining({
          id: 10120003,
          StaffMemberId: 10110003,
          email: 'mio.fukuda@expense-note.example',
        }),
      },
      {
        params: {
          presentedEmail: 'souta.nishimura@Expense-Note.example',
        },
        expected: expect.objectContaining({
          id: 10120004,
          StaffMemberId: 10110004,
          email: 'souta.nishimura@expense-note.example',
        }),
      },
      {
        params: {
          presentedEmail: 'Rin.Takahashi@Expense-Note.Example',
        },
        expected: expect.objectContaining({
          id: 10120005,
          StaffMemberId: 10110005,
          email: 'rin.takahashi@expense-note.example',
        }),
      },
      {
        params: {
          presentedEmail: 'Yuuto.Kirishima+Notes@Expense-Note.Example',
        },
        expected: expect.objectContaining({
          id: 10120006,
          StaffMemberId: 10110006,
          email: 'yuuto.kirishima+notes@expense-note.example',
        }),
      },
      {
        params: {
          presentedEmail: 'Nanami.Doi@Sub.Expense-Note.Example',
        },
        expected: expect.objectContaining({
          id: 10120007,
          StaffMemberId: 10110007,
          email: 'nanami.doi@sub.expense-note.example',
        }),
      },
      {
        params: {
          presentedEmail: 'RIKU.HASEGAWA@Expense-Note.Example',
        },
        expected: expect.objectContaining({
          id: 10120008,
          StaffMemberId: 10110008,
          email: 'riku.hasegawa@expense-note.example',
        }),
      },
      {
        params: {
          presentedEmail: 'Aoi.Tsuchiya@EXPENSE-NOTE.EXAMPLE',
        },
        expected: expect.objectContaining({
          id: 10120009,
          StaffMemberId: 10110009,
          email: 'aoi.tsuchiya@expense-note.example',
        }),
      },
      {
        params: {
          presentedEmail: 'Daiki.Morishita@Expense-Note.Example',
        },
        expected: expect.objectContaining({
          id: 10120010,
          StaffMemberId: 10110010,
          email: 'daiki.morishita@expense-note.example',
        }),
      },
      {
        params: {
          presentedEmail: 'Sakura.Umeda@Expense-Note.Example',
        },
        expected: expect.objectContaining({
          id: 10120011,
          StaffMemberId: 10110011,
          email: 'sakura.umeda@expense-note.example',
        }),
      },
    ]

    test.each(cases)('presentedEmail: $params.presentedEmail', async ({
      params,
      expected,
    }) => {
      const email = StaffMemberSecret.generateNormalizedEmail({
        email: params.presentedEmail,
      })

      const actual = await StaffMemberSecret.findOne({
        where: {
          email,
        },
      })

      expect(actual)
        .toEqual(expected)
    })
  })
})

/*
 * The seeded error paths. Section 9.4 holds one row per member of staff, and an account issued
 * halfway leaves a member of staff with none -- the state the seeder puts in the table on purpose,
 * so the code that must answer for it has something to answer about.
 */
describe('staff_member_secrets development seeder', () => {
  describe('should leave a seeded member of staff who holds no address without one', () => {
    const cases = [
      {
        params: {
          staffMemberId: 10110012,
        },
      },
      {
        params: {
          staffMemberId: 10110013,
        },
      },
    ]

    test.each(cases)('staffMemberId: $params.staffMemberId', async ({
      params,
    }) => {
      const actual = await StaffMemberSecret.findOne({
        where: {
          StaffMemberId: params.staffMemberId,
        },
      })

      expect(actual)
        .toBeNull()
    })
  })
})
