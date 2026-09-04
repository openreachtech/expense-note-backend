import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

const PASSWORD_HASH_ATTRIBUTE_NAME = 'passwordHash'

/**
 * StaffMemberPasswordHashesBk model.
 *
 * The history of StaffMemberPasswordHash: one row per digest a member of staff has held. The
 * backup mixin on the body model appends here, so this model takes no mixin of its own.
 *
 * @class StaffMemberPasswordHashesBk
 * @augments {BaseAppRenchanModel}
 */
export default class StaffMemberPasswordHashesBk extends BaseAppRenchanModel {
  /**
   * Define model attributes
   *
   * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
   * @returns {import('sequelize').ModelAttributes} Model attributes
   */
  static createAttributes (DataTypes) {
    const factory = ModelAttributeFactory.create(DataTypes)

    // These mirror StaffMemberPasswordHash's business attributes one for one, because
    // the backup mixin copies them across by name. Nothing is unique here: this
    // table holds one appended generation per save.
    return {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
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

      // Inference would pluralize this model name to staff_member_password_hashes_bks.
      tableName: 'staff_member_password_hashes_bk',
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
   * Serialize this row, withholding the digest.
   *
   * A superseded digest is a password digest all the same: returned by no operation, written to
   * no log line. It is withheld here rather than at each call site.
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
