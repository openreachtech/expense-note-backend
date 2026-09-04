import {
  UniqueConstraintError,
} from 'sequelize'

import StaffMember from '../../../sequelize/models/StaffMember.js'
import StaffMemberPasswordHash from '../../../sequelize/models/StaffMemberPasswordHash.js'
import StaffMemberPasswordHashesBk from '../../../sequelize/models/StaffMemberPasswordHashesBk.js'

describe('StaffMemberPasswordHash', () => {
  describe('.create()', () => {
    describe('should refuse a second digest against one member of staff', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000601,
            passwordHash: 'stored-digest-stand-in-second-row-10000601',
            savedAt: new Date('2026-09-02T02:03:04.005Z'),
          },
          expected: UniqueConstraintError,
        },
        {
          params: {
            StaffMemberId: 10000602,
            passwordHash: 'stored-digest-stand-in-second-row-10000602',
            savedAt: new Date('2026-09-03T03:04:05.006Z'),
          },
          expected: UniqueConstraintError,
        },
      ]

      test.each(cases)('StaffMemberId: $params.StaffMemberId', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.StaffMemberId,
          name: `staff member holding one digest ${params.StaffMemberId}`,
        })
        await StaffMemberPasswordHash.create({
          StaffMemberId: params.StaffMemberId,
          passwordHash: `stored-digest-stand-in-first-row-${params.StaffMemberId}`,
          savedAt: new Date('2026-09-01T01:02:03.004Z'),
        })

        const actual = () => StaffMemberPasswordHash.create(params)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('#save()', () => {
    describe('should append the digest it saved to the backup table', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000611,
            passwordHash: 'stored-digest-stand-in-10000611',
            savedAt: new Date('2026-09-04T04:05:06.007Z'),
          },
          expected: {
            StaffMemberId: 10000611,
            passwordHash: 'stored-digest-stand-in-10000611',
            savedAt: new Date('2026-09-04T04:05:06.007Z'),
          },
        },
        {
          params: {
            StaffMemberId: 10000612,
            passwordHash: 'stored-digest-stand-in-10000612',
            savedAt: new Date('2026-09-05T14:15:16.017Z'),
          },
          expected: {
            StaffMemberId: 10000612,
            passwordHash: 'stored-digest-stand-in-10000612',
            savedAt: new Date('2026-09-05T14:15:16.017Z'),
          },
        },
      ]

      test.each(cases)('StaffMemberId: $params.StaffMemberId', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.StaffMemberId,
          name: `staff member whose first digest is saved ${params.StaffMemberId}`,
        })
        const passwordHashEntity = StaffMemberPasswordHash.build(params)
        const buildSpy = jest.spyOn(StaffMemberPasswordHashesBk, 'build')

        await passwordHashEntity.save()

        expect(buildSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('#save()', () => {
    describe('should append a further generation when the digest is replaced', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000621,
            passwordHash: 'stored-digest-stand-in-second-generation-10000621',
            savedAt: new Date('2026-09-06T06:07:08.009Z'),
          },
          expected: {
            StaffMemberId: 10000621,
            passwordHash: 'stored-digest-stand-in-second-generation-10000621',
            savedAt: new Date('2026-09-06T06:07:08.009Z'),
          },
        },
        {
          params: {
            StaffMemberId: 10000622,
            passwordHash: 'stored-digest-stand-in-second-generation-10000622',
            savedAt: new Date('2026-09-07T16:17:18.019Z'),
          },
          expected: {
            StaffMemberId: 10000622,
            passwordHash: 'stored-digest-stand-in-second-generation-10000622',
            savedAt: new Date('2026-09-07T16:17:18.019Z'),
          },
        },
      ]

      test.each(cases)('passwordHash: $params.passwordHash', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.StaffMemberId,
          name: `staff member resetting a password ${params.StaffMemberId}`,
        })
        const passwordHashEntity = await StaffMemberPasswordHash.create({
          StaffMemberId: params.StaffMemberId,
          passwordHash: `stored-digest-stand-in-first-generation-${params.StaffMemberId}`,
          savedAt: new Date('2026-08-06T06:07:08.009Z'),
        })
        passwordHashEntity.set(params)
        const buildSpy = jest.spyOn(StaffMemberPasswordHashesBk, 'build')

        await passwordHashEntity.save()

        expect(buildSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('#save()', () => {
    describe('should leave the body row holding the replacement digest only', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000631,
            passwordHash: 'stored-digest-stand-in-replacement-10000631',
            savedAt: new Date('2026-09-08T08:09:10.011Z'),
          },
          expected: expect.objectContaining({
            StaffMemberId: 10000631,
            passwordHash: 'stored-digest-stand-in-replacement-10000631',
            savedAt: new Date('2026-09-08T08:09:10.011Z'),
          }),
        },
        {
          params: {
            StaffMemberId: 10000632,
            passwordHash: 'stored-digest-stand-in-replacement-10000632',
            savedAt: new Date('2026-09-09T18:19:20.021Z'),
          },
          expected: expect.objectContaining({
            StaffMemberId: 10000632,
            passwordHash: 'stored-digest-stand-in-replacement-10000632',
            savedAt: new Date('2026-09-09T18:19:20.021Z'),
          }),
        },
      ]

      test.each(cases)('passwordHash: $params.passwordHash', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.StaffMemberId,
          name: `staff member whose digest is replaced ${params.StaffMemberId}`,
        })
        const passwordHashEntity = await StaffMemberPasswordHash.create({
          StaffMemberId: params.StaffMemberId,
          passwordHash: `stored-digest-stand-in-superseded-${params.StaffMemberId}`,
          savedAt: new Date('2026-08-08T08:09:10.011Z'),
        })
        passwordHashEntity.set(params)

        const actual = await passwordHashEntity.save()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
