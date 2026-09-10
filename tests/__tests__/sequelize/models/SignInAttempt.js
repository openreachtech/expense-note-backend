import {
  DataTypes,
} from 'sequelize'

import SignInAttempt from '../../../../sequelize/models/SignInAttempt.js'
import StaffMemberSecret from '../../../../sequelize/models/StaffMemberSecret.js'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

describe('SignInAttempt', () => {
  describe('super class', () => {
    test('to be instance of BaseAppRenchanModel', () => {
      const actual = SignInAttempt.prototype

      expect(actual)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('SignInAttempt', () => {
  describe('.createAttributes()', () => {
    describe('should declare every business column of the table', () => {
      test('to hold the attempted address and the time it was attempted', () => {
        const expected = {
          id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          email: {
            type: DataTypes.STRING(191),
            allowNull: false,
          },
          attemptedAt: {
            type: DataTypes.DATE(3),
            allowNull: false,
          },
        }

        const actual = SignInAttempt.createAttributes(DataTypes)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInAttempt', () => {
  describe('.createOptions()', () => {
    describe('should add nothing to the shared model options', () => {
      test('to hold the base options with this model name', () => {
        const { sequelizeClient } = globalThis.sequelizeActivator
        const expected = {
          modelName: 'SignInAttempt',
          sequelize: sequelizeClient,
          syncOnAssociation: false,
          timestamps: true,
          underscored: true,
        }

        const actual = SignInAttempt.createOptions(sequelizeClient)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInAttempt', () => {
  describe('.associate()', () => {
    describe('should associate with nothing, the address being no foreign key', () => {
      test('to hold no association', () => {
        const expected = {}

        const actual = SignInAttempt.associations

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInAttempt', () => {
  describe('.get:StaffMemberSecretModel', () => {
    test('should hold the model defining an address normalized form', () => {
      const expected = StaffMemberSecret

      const actual = SignInAttempt.StaffMemberSecretModel

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('SignInAttempt', () => {
  describe('.normalizeEmailOfEntity()', () => {
    describe('should rewrite an unsaved row address with its normalized form', () => {
      const cases = [
        {
          params: {
            attributes: {
              email: 'Anna@Example.com',
              attemptedAt: new Date('2026-09-01T01:02:03.004Z'),
            },
          },
          expected: 'anna@example.com',
        },
        {
          params: {
            attributes: {
              email: 'BRUNO@EXAMPLE.COM',
              attemptedAt: new Date('2026-09-02T02:03:04.005Z'),
            },
          },
          expected: 'bruno@example.com',
        },
        {
          params: {
            attributes: {
              email: 'Carla.Di-Marco+notes@Sub.Example.COM',
              attemptedAt: new Date('2026-09-03T03:04:05.006Z'),
            },
          },
          expected: 'carla.di-marco+notes@sub.example.com',
        },
      ]

      test.each(cases)('attributes.email: $params.attributes.email', ({
        params,
        expected,
      }) => {
        const entity = SignInAttempt.build(params.attributes)

        SignInAttempt.normalizeEmailOfEntity({
          entity,
        })

        expect(entity.get('email'))
          .toBe(expected)
      })
    })
  })
})

describe('SignInAttempt', () => {
  describe('.normalizeEmailOfEntity()', () => {
    describe('should leave a row whose address field names no address alone', () => {
      const cases = [
        {
          params: {
            attributes: {
              email: 10100031, // an address is a string; a number names none
              attemptedAt: new Date('2026-09-04T04:05:06.007Z'),
            },
          },
          expected: 10100031,
        },
        {
          params: {
            attributes: {
              email: 10100032, // an address is a string; a number names none
              attemptedAt: new Date('2026-09-05T05:06:07.008Z'),
            },
          },
          expected: 10100032,
        },
      ]

      test.each(cases)('attributes.email: $params.attributes.email', ({
        params,
        expected,
      }) => {
        const entity = SignInAttempt.build(params.attributes)

        SignInAttempt.normalizeEmailOfEntity({
          entity,
        })

        expect(entity.get('email'))
          .toBe(expected)
      })
    })
  })
})

describe('SignInAttempt', () => {
  describe('.normalizeEmailOfAttributes()', () => {
    describe('should rewrite the address a bulk update writes with its normalized form', () => {
      const cases = [
        {
          params: {
            attributes: {
              email: 'Dario@Example.com',
              attemptedAt: new Date('2026-09-06T06:07:08.009Z'),
            },
          },
          expected: {
            email: 'dario@example.com',
            attemptedAt: new Date('2026-09-06T06:07:08.009Z'),
          },
        },
        {
          params: {
            attributes: {
              email: 'ELENA@EXAMPLE.COM',
              attemptedAt: new Date('2026-09-07T07:08:09.010Z'),
            },
          },
          expected: {
            email: 'elena@example.com',
            attemptedAt: new Date('2026-09-07T07:08:09.010Z'),
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

        SignInAttempt.normalizeEmailOfAttributes({
          attributes,
        })

        expect(attributes)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInAttempt', () => {
  describe('.normalizeEmailOfAttributes()', () => {
    describe('should leave values that name no address alone', () => {
      const cases = [
        {
          params: {
            attributes: {
              attemptedAt: new Date('2026-09-08T08:09:10.011Z'),
            },
          },
          expected: {
            attemptedAt: new Date('2026-09-08T08:09:10.011Z'),
          },
        },
        {
          params: {
            attributes: {
              attemptedAt: new Date('2026-09-09T09:10:11.012Z'),
              email: 10100033, // an address is a string; a number names none
            },
          },
          expected: {
            attemptedAt: new Date('2026-09-09T09:10:11.012Z'),
            email: 10100033,
          },
        },
      ]

      test.each(cases)('attributes.attemptedAt: $params.attributes.attemptedAt', ({
        params,
        expected,
      }) => {
        const {
          attributes,
        } = params

        SignInAttempt.normalizeEmailOfAttributes({
          attributes,
        })

        expect(attributes)
          .toEqual(expected)
      })
    })
  })
})
