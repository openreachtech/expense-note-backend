import {
  BackupMixinModel,
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * StaffMemberSecret model
 *
 * @class StaffMemberSecret
 * @augments {BaseAppRenchanModel}
 */
export default class StaffMemberSecret extends BaseAppRenchanModel {
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
        unique: true,
      },
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true,
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
   */
  static associate () {
    super.associate?.()

    this.belongsTo(this._.StaffMember)
  }

  /**
   * Define model scopes
   *
   * @param {import('sequelize').Op} Op - Sequelize operators
   */
  static defineScopes (Op) {
    super.defineScopes?.(Op)

    // noop
  }

  /**
   * Define subqueries
   */
  static defineSubqueries () {
    super.defineSubqueries?.()

    // noop
  }

  /**
   * Setup model hooks
   *
   * Lower-cases the sign-in address on the way in. The criterion is that two members of staff
   * hold the same current address in no circumstance, and the unique index on `email` delivers
   * that only where the comparison ignores case. No collation is declared anywhere in this
   * project, and the dialect the suites run on — SQLite — compares TEXT case-sensitively, so
   * `Anna@example.com` and `anna@example.com` would otherwise both insert. Normalizing on the
   * write path makes the index hold the guarantee underneath any dialect, instead of the
   * guarantee depending on a collation being pinned.
   *
   * Three hooks, because a supported value reaches this table three ways: `beforeSave` for a per-row
   * write, and the two bulk hooks because `bulkCreate()` and the static `update()` run with
   * `individualHooks: false` and so never reach `beforeSave`. The backup table needs no hook of
   * its own — the backup mixin's `afterSave` reads `email` off this already-normalized row, so
   * what it appends is the normalized value.
   *
   * **`upsert()` is not covered and is not supported here.** It runs `beforeUpsert` alone, so an
   * address written that way would reach the table un-normalized — and under SQLite the unique
   * index would then accept a case-variant duplicate. Nothing calls it; adding a caller means
   * adding the hook first.
   *
   * @returns {void}
   */
  static setupHooks () {
    super.setupHooks?.()

    this.beforeSave(secret => {
      this.normalizeEmailOfEntity({
        entity: secret,
      })
    })

    this.beforeBulkCreate(secrets => {
      secrets.map(secret =>
        this.normalizeEmailOfEntity({
          entity: secret,
        })
      )
    })

    this.beforeBulkUpdate(options => {
      const attributes = options.attributes
        ?? {}

      this.normalizeEmailOfAttributes({
        attributes,
      })
    })
  }

  /**
   * Overwrite an unsaved row's sign-in address with its normalized form
   *
   * @param {{
   *   entity: import('sequelize').Model
   * }} params - Parameters.
   * @returns {void}
   */
  static normalizeEmailOfEntity ({
    entity,
  }) {
    const email = entity.get('email')

    if (typeof email !== 'string') {
      return
    }

    const normalizedEmail = this.generateNormalizedEmail({
      email,
    })

    entity.set('email', normalizedEmail)
  }

  /**
   * Overwrite the sign-in address a bulk update writes with its normalized form
   *
   * The object handed in is the one Sequelize reads its values back out of, so it is rewritten
   * in place rather than copied.
   *
   * @param {{
   *   attributes: Record<string, *>
   * }} params - Parameters.
   * @returns {void}
   */
  static normalizeEmailOfAttributes ({
    attributes,
  }) {
    const {
      email,
    } = attributes

    if (typeof email !== 'string') {
      return
    }

    // Sequelize reads the values back out of this same object (`values = options.attributes`),
    // so the rewrite has to happen in place. Reflect.set rather than a direct assignment,
    // because assigning to a parameter's property is prohibited and `Object.assign` is too.
    Reflect.set(
      attributes,
      'email',
      this.generateNormalizedEmail({
        email,
      })
    )
  }

  /**
   * Generate the stored form of a sign-in address
   *
   * @param {{
   *   email: string
   * }} params - Parameters.
   * @returns {string} The address as it is stored, lower cased.
   */
  static generateNormalizedEmail ({
    email,
  }) {
    return email.toLowerCase()
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
   * @returns {typeof import('./StaffMemberSecretsBk.js').default} Backup model declaration
   */
  static get BackupModel () {
    return this._.StaffMemberSecretsBk
  }
}
