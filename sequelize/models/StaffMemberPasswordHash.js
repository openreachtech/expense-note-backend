import {
  BackupMixinModel,
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

const PASSWORD_HASH_ATTRIBUTE_NAME = 'passwordHash'

/**
 * StaffMemberPasswordHash model.
 *
 * Holds the current password digest of one member of staff, one row per member of staff. A
 * superseded digest is copied to StaffMemberPasswordHashesBk by the backup mixin rather than
 * overwritten.
 *
 * @class StaffMemberPasswordHash
 * @augments {BaseAppRenchanModel}
 */
export default class StaffMemberPasswordHash extends BaseAppRenchanModel {
  /**
   * Define model attributes
   *
   * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
   * @returns {import('sequelize').ModelAttributes} Model attributes
   */
  static createAttributes (DataTypes) {
    const factory = ModelAttributeFactory.create(DataTypes)

    return {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
      StaffMemberId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true, // 1:1 with staff_members; the real constraint is the migration's unique index
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
  }

  /**
   * Define model options
   *
   * @param {import('sequelize').Sequelize} sequelizeClient - Sequelize instance
   * @returns {import('sequelize').InitOptions} Model options
   */
  static createOptions (sequelizeClient) {
    return {
      ...super.createOptions(sequelizeClient),
    }
  }

  /**
   * Define model associations
   *
   * @returns {void}
   */
  static associate () {
    super.associate?.()

    this.belongsTo(this._.StaffMember)
  }

  /**
   * Define model scopes
   *
   * @param {import('sequelize').Op} Op - Sequelize operators
   * @returns {void}
   */
  static defineScopes (Op) {
    super.defineScopes?.(Op)

    // noop
  }

  /**
   * Define subqueries
   *
   * @returns {void}
   */
  static defineSubqueries () {
    super.defineSubqueries?.()

    // noop
  }

  /**
   * Setup model hooks
   *
   * @returns {void}
   */
  static setupHooks () {
    super.setupHooks?.()

    // noop
  }

  /**
   * get: Mixin models to apply
   *
   * @returns {Array<Function>} Mixin models
   */
  static get Mixins () {
    return [
      BackupMixinModel,
    ]
  }

  /**
   * get: Backup model for BackupMixinModel
   *
   * @returns {typeof import('./StaffMemberPasswordHashesBk.js').default} Backup model declaration
   */
  static get BackupModel () {
    return this._.StaffMemberPasswordHashesBk
  }

  /**
   * Verify a candidate password against the digest this row holds.
   *
   * The compare runs through the injected encipher and never through an equality: the stored
   * value is a one-way hash, so an equality against it could only ever be false. A row holding
   * no digest answers false rather than throwing.
   *
   * @param {{
   *   password: string
   *   passwordEncipher: {
   *     comparesPassword: (params: {
   *       password: string
   *       passwordHash: string
   *     }) => Promise<boolean>
   *   }
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether the candidate password matches the digest of this row.
   * @public
   */
  async verifiesPassword ({
    password,
    passwordEncipher,
  }) {
    const passwordHash = this.get(PASSWORD_HASH_ATTRIBUTE_NAME)

    if (!passwordHash) {
      return false
    }

    return passwordEncipher.comparesPassword({
      password,
      passwordHash,
    })
  }

  /**
   * Serialize this row, withholding the digest.
   *
   * A password digest is returned by no operation and written to no log line, so it is withheld
   * here rather than at each call site: nothing that stringifies this row can carry it away.
   *
   * @override
   * @returns {Record<string, *>} Values of this row, without the password digest.
   * @public
   */
  toJSON () {
    const values = super.toJSON()

    return Object.fromEntries(
      Object.entries(values)
        .filter(([attributeName]) => attributeName !== PASSWORD_HASH_ATTRIBUTE_NAME)
    )
  }
}
