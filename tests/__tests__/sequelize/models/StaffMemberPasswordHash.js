import {
  DataTypes,
} from 'sequelize'

import {
  BackupMixinModel,
} from '@openreachtech/renchan-sequelize'

import StaffMemberPasswordHash from '../../../../sequelize/models/StaffMemberPasswordHash.js'
import StaffMemberPasswordHashesBk from '../../../../sequelize/models/StaffMemberPasswordHashesBk.js'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

describe('StaffMemberPasswordHash', () => {
  describe('super class', () => {
    test('to be instance of BaseAppRenchanModel', () => {
      const actual = StaffMemberPasswordHash.prototype

      expect(actual)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('.createAttributes()', () => {
    describe('should declare every business column of the table', () => {
      test('to hold the owner, the digest and the time the digest was set', () => {
        const expected = {
          id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          StaffMemberId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
          },
          passwordHash: {
            type: DataTypes.STRING(191),
            allowNull: false,
          },
          savedAt: {
            type: DataTypes.DATE(3),
            allowNull: false,
          },
        }

        const actual = StaffMemberPasswordHash.createAttributes(DataTypes)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('.createOptions()', () => {
    describe('should add nothing to the shared model options', () => {
      test('to hold the base options with this model name', () => {
        const { sequelizeClient } = globalThis.sequelizeActivator
        const expected = {
          modelName: 'StaffMemberPasswordHash',
          sequelize: sequelizeClient,
          syncOnAssociation: false,
          timestamps: true,
          underscored: true,
        }

        const actual = StaffMemberPasswordHash.createOptions(sequelizeClient)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('.associate()', () => {
    describe('should belong to the table its foreign key names', () => {
      const cases = [
        {
          params: {
            associationName: 'StaffMember',
          },
        },
      ]

      test.each(cases)('associationName: $params.associationName', ({
        params,
      }) => {
        const actual = StaffMemberPasswordHash.associations

        expect(actual)
          .toHaveProperty(params.associationName)
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('.get:Mixins', () => {
    test('should hold the backup mixin', () => {
      const expected = [
        BackupMixinModel,
      ]

      const actual = StaffMemberPasswordHash.Mixins

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('.get:BackupModel', () => {
    test('should hold the backup table of this model', () => {
      const expected = StaffMemberPasswordHashesBk

      const actual = StaffMemberPasswordHash.BackupModel

      expect(actual)
        .toBe(expected) // same reference
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('#verifiesPassword()', () => {
    describe('should answer false when the row holds no digest', () => {
      const cases = [
        {
          params: {
            password: 'password-candidate-of-an-empty-row-first',
            passwordEncipher: {
              comparesPassword: async () => true,
            },
          },
        },
        {
          params: {
            password: 'password-candidate-of-an-empty-row-second',
            passwordEncipher: {
              comparesPassword: async () => true,
            },
          },
        },
      ]

      test.each(cases)('password: $params.password', async ({
        params,
      }) => {
        const passwordHashEntity = StaffMemberPasswordHash.build()

        const actual = await passwordHashEntity.verifiesPassword(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('#verifiesPassword()', () => {
    describe('should answer true when the encipher accepts the candidate', () => {
      const cases = [
        {
          params: {
            password: 'password-candidate-accepted-first',
            passwordEncipher: {
              comparesPassword: async () => true,
            },
          },
          mockStoredPasswordHash: 'stored-digest-stand-in-10000641',
        },
        {
          params: {
            password: 'password-candidate-accepted-second',
            passwordEncipher: {
              comparesPassword: async () => true,
            },
          },
          mockStoredPasswordHash: 'stored-digest-stand-in-10000642',
        },
      ]

      test.each(cases)('password: $params.password', async ({
        params,
        mockStoredPasswordHash,
      }) => {
        const passwordHashEntity = StaffMemberPasswordHash.build({
          passwordHash: mockStoredPasswordHash,
        })

        const actual = await passwordHashEntity.verifiesPassword(params)

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('#verifiesPassword()', () => {
    describe('should answer false when the encipher rejects the candidate', () => {
      const cases = [
        {
          params: {
            password: 'password-candidate-rejected-first',
            passwordEncipher: {
              comparesPassword: async () => false,
            },
          },
          mockStoredPasswordHash: 'stored-digest-stand-in-10000643',
        },
        {
          params: {
            password: 'password-candidate-rejected-second',
            passwordEncipher: {
              comparesPassword: async () => false,
            },
          },
          mockStoredPasswordHash: 'stored-digest-stand-in-10000644',
        },
      ]

      test.each(cases)('password: $params.password', async ({
        params,
        mockStoredPasswordHash,
      }) => {
        const passwordHashEntity = StaffMemberPasswordHash.build({
          passwordHash: mockStoredPasswordHash,
        })

        const actual = await passwordHashEntity.verifiesPassword(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('#verifiesPassword()', () => {
    describe('should hand the candidate and the stored digest to the encipher', () => {
      const cases = [
        {
          params: {
            password: 'password-candidate-handed-over-first',
          },
          mockStoredPasswordHash: 'stored-digest-stand-in-10000645',
          expected: {
            password: 'password-candidate-handed-over-first',
            passwordHash: 'stored-digest-stand-in-10000645',
          },
        },
        {
          params: {
            password: 'password-candidate-handed-over-second',
          },
          mockStoredPasswordHash: 'stored-digest-stand-in-10000646',
          expected: {
            password: 'password-candidate-handed-over-second',
            passwordHash: 'stored-digest-stand-in-10000646',
          },
        },
      ]

      test.each(cases)('password: $params.password', async ({
        params,
        mockStoredPasswordHash,
        expected,
      }) => {
        const comparesPassword = jest.fn(async () => true)
        const passwordHashEntity = StaffMemberPasswordHash.build({
          passwordHash: mockStoredPasswordHash,
        })

        await passwordHashEntity.verifiesPassword({
          password: params.password,
          passwordEncipher: {
            comparesPassword,
          },
        })

        expect(comparesPassword)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('#toJSON()', () => {
    describe('should withhold the password digest', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000647,
            passwordHash: 'stored-digest-stand-in-10000647',
            savedAt: new Date('2026-09-01T01:02:03.004Z'),
          },
        },
        {
          params: {
            StaffMemberId: 10000648,
            passwordHash: 'stored-digest-stand-in-10000648',
            savedAt: new Date('2026-09-02T05:06:07.008Z'),
          },
        },
      ]

      test.each(cases)('StaffMemberId: $params.StaffMemberId', ({
        params,
      }) => {
        const passwordHashEntity = StaffMemberPasswordHash.build(params)

        const actual = passwordHashEntity.toJSON()

        expect(actual)
          .not
          .toHaveProperty('passwordHash')
      })
    })
  })
})

describe('StaffMemberPasswordHash', () => {
  describe('#toJSON()', () => {
    describe('should keep the fields that are not the digest', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000649,
            passwordHash: 'stored-digest-stand-in-10000649',
            savedAt: new Date('2026-09-03T09:10:11.012Z'),
          },
          expected: expect.objectContaining({
            StaffMemberId: 10000649,
            savedAt: new Date('2026-09-03T09:10:11.012Z'),
          }),
        },
        {
          params: {
            StaffMemberId: 10000650,
            passwordHash: 'stored-digest-stand-in-10000650',
            savedAt: new Date('2026-09-04T13:14:15.016Z'),
          },
          expected: expect.objectContaining({
            StaffMemberId: 10000650,
            savedAt: new Date('2026-09-04T13:14:15.016Z'),
          }),
        },
      ]

      test.each(cases)('StaffMemberId: $params.StaffMemberId', ({
        params,
        expected,
      }) => {
        const passwordHashEntity = StaffMemberPasswordHash.build(params)

        const actual = passwordHashEntity.toJSON()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
