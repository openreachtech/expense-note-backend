import StaffMemberSecret from '../../../../sequelize/models/StaffMemberSecret.js'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

describe('StaffMemberSecret', () => {
  describe('super class', () => {
    test('to be instance of BaseAppRenchanModel', () => {
      const actual = StaffMemberSecret.prototype

      expect(actual)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('StaffMemberSecret', () => {
  describe('.generateNormalizedEmail()', () => {
    describe('should lower case the address it is handed', () => {
      const cases = [
        {
          params: {
            email: 'Anna@Example.com',
          },
          expected: 'anna@example.com',
        },
        {
          params: {
            email: 'BRUNO@EXAMPLE.COM',
          },
          expected: 'bruno@example.com',
        },
        {
          params: {
            email: 'Carla.Di-Marco+notes@Sub.Example.COM',
          },
          expected: 'carla.di-marco+notes@sub.example.com',
        },
        {
          params: {
            email: 'dario@example.com',
          },
          expected: 'dario@example.com',
        },
      ]

      test.each(cases)('email: $params.email', ({
        params,
        expected,
      }) => {
        const actual = StaffMemberSecret.generateNormalizedEmail(params)

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('StaffMemberSecret', () => {
  describe('.normalizeEmailOfEntity()', () => {
    describe('should rewrite an unsaved row address with its normalized form', () => {
      const cases = [
        {
          params: {
            attributes: {
              StaffMemberId: 10000720,
              email: 'Elena@Example.com',
              savedAt: new Date('2026-09-01T01:02:03.004Z'),
            },
          },
          expected: 'elena@example.com',
        },
        {
          params: {
            attributes: {
              StaffMemberId: 10000721,
              email: 'FABIO@EXAMPLE.COM',
              savedAt: new Date('2026-09-02T02:03:04.005Z'),
            },
          },
          expected: 'fabio@example.com',
        },
      ]

      test.each(cases)('attributes.email: $params.attributes.email', ({
        params,
        expected,
      }) => {
        const entity = StaffMemberSecret.build(params.attributes)

        StaffMemberSecret.normalizeEmailOfEntity({
          entity,
        })

        expect(entity.get('email'))
          .toBe(expected)
      })
    })
  })
})

describe('StaffMemberSecret', () => {
  describe('.normalizeEmailOfAttributes()', () => {
    describe('should rewrite the address a bulk update writes with its normalized form', () => {
      const cases = [
        {
          params: {
            attributes: {
              email: 'Gina@Example.com',
              savedAt: new Date('2026-09-03T03:04:05.006Z'),
            },
          },
          expected: {
            email: 'gina@example.com',
            savedAt: new Date('2026-09-03T03:04:05.006Z'),
          },
        },
        {
          params: {
            attributes: {
              email: 'HUGO@EXAMPLE.COM',
              savedAt: new Date('2026-09-04T04:05:06.007Z'),
            },
          },
          expected: {
            email: 'hugo@example.com',
            savedAt: new Date('2026-09-04T04:05:06.007Z'),
          },
        },
      ]

      test.each(cases)('attributes.email: $params.attributes.email', ({
        params,
        expected,
      }) => {
        const {
          attributes,
        } = params

        StaffMemberSecret.normalizeEmailOfAttributes({
          attributes,
        })

        expect(attributes)
          .toEqual(expected)
      })
    })
  })
})

describe('StaffMemberSecret', () => {
  describe('.normalizeEmailOfAttributes()', () => {
    describe('should leave values that name no address alone', () => {
      const cases = [
        {
          params: {
            attributes: {
              savedAt: new Date('2026-09-05T05:06:07.008Z'),
            },
          },
          expected: {
            savedAt: new Date('2026-09-05T05:06:07.008Z'),
          },
        },
        {
          params: {
            attributes: {
              StaffMemberId: 10000722,
              savedAt: new Date('2026-09-06T06:07:08.009Z'),
            },
          },
          expected: {
            StaffMemberId: 10000722,
            savedAt: new Date('2026-09-06T06:07:08.009Z'),
          },
        },
      ]

      test.each(cases)('attributes.savedAt: $params.attributes.savedAt', ({
        params,
        expected,
      }) => {
        const {
          attributes,
        } = params

        StaffMemberSecret.normalizeEmailOfAttributes({
          attributes,
        })

        expect(attributes)
          .toEqual(expected)
      })
    })
  })
})
