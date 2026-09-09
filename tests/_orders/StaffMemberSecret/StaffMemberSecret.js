import {
  UniqueConstraintError,
} from 'sequelize'

import StaffMember from '../../../sequelize/models/StaffMember.js'
import StaffMemberSecret from '../../../sequelize/models/StaffMemberSecret.js'
import StaffMemberSecretsBk from '../../../sequelize/models/StaffMemberSecretsBk.js'

describe('StaffMemberSecret', () => {
  describe('.create()', () => {
    describe('should refuse a second member of staff an address differing only in case', () => {
      const cases = [
        {
          params: {
            currentSecret: {
              StaffMemberId: 10000201,
              email: 'Anna@Example.com',
              savedAt: new Date('2026-09-01T01:02:03.004Z'),
            },
            secondSecret: {
              StaffMemberId: 10000202,
              email: 'anna@example.com',
              savedAt: new Date('2026-09-01T02:03:04.005Z'),
            },
          },
          expected: UniqueConstraintError,
        },
        {
          params: {
            currentSecret: {
              StaffMemberId: 10000203,
              email: 'bruno@example.com',
              savedAt: new Date('2026-09-02T03:04:05.006Z'),
            },
            secondSecret: {
              StaffMemberId: 10000204,
              email: 'BRUNO@EXAMPLE.COM',
              savedAt: new Date('2026-09-02T04:05:06.007Z'),
            },
          },
          expected: UniqueConstraintError,
        },
      ]

      test.each(cases)('secondSecret.email: $params.secondSecret.email', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.currentSecret.StaffMemberId,
          name: `staff member holding the address ${params.currentSecret.StaffMemberId}`,
        })
        await StaffMember.create({
          id: params.secondSecret.StaffMemberId,
          name: `staff member asking for the address ${params.secondSecret.StaffMemberId}`,
        })
        await StaffMemberSecret.create(params.currentSecret)

        const actual = () => StaffMemberSecret.create(params.secondSecret)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('StaffMemberSecret', () => {
  describe('.create()', () => {
    describe('should store the address lower cased', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000205,
            email: 'Carla@Example.COM',
            savedAt: new Date('2026-09-03T05:06:07.008Z'),
          },
          expected: expect.objectContaining({
            StaffMemberId: 10000205,
            email: 'carla@example.com',
            savedAt: new Date('2026-09-03T05:06:07.008Z'),
          }),
        },
        {
          params: {
            StaffMemberId: 10000206,
            email: 'DARIO@Example.com',
            savedAt: new Date('2026-09-04T06:07:08.009Z'),
          },
          expected: expect.objectContaining({
            StaffMemberId: 10000206,
            email: 'dario@example.com',
            savedAt: new Date('2026-09-04T06:07:08.009Z'),
          }),
        },
      ]

      test.each(cases)('email: $params.email', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.StaffMemberId,
          name: `staff member issued a mixed case address ${params.StaffMemberId}`,
        })

        const actual = await StaffMemberSecret.create(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('StaffMemberSecret', () => {
  describe('#save()', () => {
    describe('should append the normalized address to the backup table', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000207,
            email: 'Elena@Example.com',
            savedAt: new Date('2026-09-05T07:08:09.010Z'),
          },
          expected: {
            StaffMemberId: 10000207,
            email: 'elena@example.com',
            savedAt: new Date('2026-09-05T07:08:09.010Z'),
          },
        },
        {
          params: {
            StaffMemberId: 10000208,
            email: 'FABIO@EXAMPLE.COM',
            savedAt: new Date('2026-09-06T08:09:10.011Z'),
          },
          expected: {
            StaffMemberId: 10000208,
            email: 'fabio@example.com',
            savedAt: new Date('2026-09-06T08:09:10.011Z'),
          },
        },
      ]

      test.each(cases)('email: $params.email', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.StaffMemberId,
          name: `staff member whose first address is saved ${params.StaffMemberId}`,
        })
        const secretEntity = StaffMemberSecret.build(params)
        const buildSpy = jest.spyOn(StaffMemberSecretsBk, 'build')

        await secretEntity.save()

        expect(buildSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('StaffMemberSecret', () => {
  describe('.bulkCreate()', () => {
    describe('should refuse a batch holding one address twice, differing only in case', () => {
      const cases = [
        {
          params: {
            records: [
              {
                StaffMemberId: 10000209,
                email: 'Gina@Example.com',
                savedAt: new Date('2026-09-07T09:10:11.012Z'),
              },
              {
                StaffMemberId: 10000210,
                email: 'gina@example.com',
                savedAt: new Date('2026-09-07T10:11:12.013Z'),
              },
            ],
          },
          expected: UniqueConstraintError,
        },
        {
          params: {
            records: [
              {
                StaffMemberId: 10000211,
                email: 'hugo@example.com',
                savedAt: new Date('2026-09-08T11:12:13.014Z'),
              },
              {
                StaffMemberId: 10000212,
                email: 'HUGO@Example.com',
                savedAt: new Date('2026-09-08T12:13:14.015Z'),
              },
            ],
          },
          expected: UniqueConstraintError,
        },
      ]

      test.each(cases)('records[1].email: $params.records.1.email', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.records[0].StaffMemberId,
          name: `staff member first in the batch ${params.records[0].StaffMemberId}`,
        })
        await StaffMember.create({
          id: params.records[1].StaffMemberId,
          name: `staff member second in the batch ${params.records[1].StaffMemberId}`,
        })

        const actual = () => StaffMemberSecret.bulkCreate(params.records)

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('StaffMemberSecret', () => {
  describe('.update()', () => {
    describe('should normalize the address a bulk update writes', () => {
      const cases = [
        {
          params: {
            currentSecret: {
              StaffMemberId: 10000213,
              email: 'ilaria@example.com',
              savedAt: new Date('2026-09-09T13:14:15.016Z'),
            },
            values: {
              email: 'Ilaria.Renamed@Example.COM',
            },
          },
          // The hook rewrites the values object in place, and the spy holds that same object,
          // so what it was called with reads as the normalized form.
          expected: {
            attributes: expect.objectContaining({
              email: 'ilaria.renamed@example.com',
            }),
          },
        },
        {
          params: {
            currentSecret: {
              StaffMemberId: 10000214,
              email: 'luca@example.com',
              savedAt: new Date('2026-09-10T14:15:16.017Z'),
            },
            values: {
              email: 'LUCA.RENAMED@EXAMPLE.COM',
            },
          },
          expected: {
            attributes: expect.objectContaining({
              email: 'luca.renamed@example.com',
            }),
          },
        },
      ]

      test.each(cases)('values.email: $params.values.email', async ({
        params,
        expected,
      }) => {
        await StaffMember.create({
          id: params.currentSecret.StaffMemberId,
          name: `staff member renaming an address ${params.currentSecret.StaffMemberId}`,
        })
        await StaffMemberSecret.create(params.currentSecret)
        const normalizeSpy = jest.spyOn(StaffMemberSecret, 'normalizeEmailOfAttributes')

        await StaffMemberSecret.update(params.values, {
          where: {
            StaffMemberId: params.currentSecret.StaffMemberId,
          },
        })

        expect(normalizeSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
