import {
  DataTypes,
} from 'sequelize'

import StaffMemberPasswordHashesBk from '../../../../sequelize/models/StaffMemberPasswordHashesBk.js'

import BaseAppRenchanModel from '../../../../sequelize/baseModel/BaseAppRenchanModel.js'

describe('StaffMemberPasswordHashesBk', () => {
  describe('super class', () => {
    test('to be instance of BaseAppRenchanModel', () => {
      const actual = StaffMemberPasswordHashesBk.prototype

      expect(actual)
        .toBeInstanceOf(BaseAppRenchanModel)
    })
  })
})

describe('StaffMemberPasswordHashesBk', () => {
  describe('.createAttributes()', () => {
    describe('should mirror the business columns of the body table, none of them unique', () => {
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

        const actual = StaffMemberPasswordHashesBk.createAttributes(DataTypes)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('StaffMemberPasswordHashesBk', () => {
  describe('.createOptions()', () => {
    describe('should name the table, because inference would pluralize the Bk suffix', () => {
      test('to hold the base options with the physical table name', () => {
        const { sequelizeClient } = globalThis.sequelizeActivator
        const expected = {
          modelName: 'StaffMemberPasswordHashesBk',
          sequelize: sequelizeClient,
          syncOnAssociation: false,
          timestamps: true,
          underscored: true,
          tableName: 'staff_member_password_hashes_bk',
        }

        const actual = StaffMemberPasswordHashesBk.createOptions(sequelizeClient)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('StaffMemberPasswordHashesBk', () => {
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
        const actual = StaffMemberPasswordHashesBk.associations

        expect(actual)
          .toHaveProperty(params.associationName)
      })
    })
  })
})

describe('StaffMemberPasswordHashesBk', () => {
  describe('#toJSON()', () => {
    describe('should withhold the superseded password digest', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000661,
            passwordHash: 'superseded-digest-stand-in-10000661',
            savedAt: new Date('2026-08-01T01:02:03.004Z'),
          },
        },
        {
          params: {
            StaffMemberId: 10000662,
            passwordHash: 'superseded-digest-stand-in-10000662',
            savedAt: new Date('2026-08-02T05:06:07.008Z'),
          },
        },
      ]

      test.each(cases)('StaffMemberId: $params.StaffMemberId', ({
        params,
      }) => {
        const backupEntity = StaffMemberPasswordHashesBk.build(params)

        const actual = backupEntity.toJSON()

        expect(actual)
          .not
          .toHaveProperty('passwordHash')
      })
    })
  })
})

describe('StaffMemberPasswordHashesBk', () => {
  describe('#toJSON()', () => {
    describe('should keep the fields that are not the digest', () => {
      const cases = [
        {
          params: {
            StaffMemberId: 10000663,
            passwordHash: 'superseded-digest-stand-in-10000663',
            savedAt: new Date('2026-08-03T09:10:11.012Z'),
          },
          expected: expect.objectContaining({
            StaffMemberId: 10000663,
            savedAt: new Date('2026-08-03T09:10:11.012Z'),
          }),
        },
        {
          params: {
            StaffMemberId: 10000664,
            passwordHash: 'superseded-digest-stand-in-10000664',
            savedAt: new Date('2026-08-04T13:14:15.016Z'),
          },
          expected: expect.objectContaining({
            StaffMemberId: 10000664,
            savedAt: new Date('2026-08-04T13:14:15.016Z'),
          }),
        },
      ]

      test.each(cases)('StaffMemberId: $params.StaffMemberId', ({
        params,
        expected,
      }) => {
        const backupEntity = StaffMemberPasswordHashesBk.build(params)

        const actual = backupEntity.toJSON()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
