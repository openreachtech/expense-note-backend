import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

/**
 * SignInAttempt model
 *
 * @class SignInAttempt
 * @augments {BaseAppRenchanModel}
 */
export default class SignInAttempt extends BaseAppRenchanModel {
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

      // The address as presented, normalized the way StaffMemberSecret normalizes its own.
      // Not a foreign key and not unique: an attempt on an address holding no account is
      // counted too, and the count cannot branch on whether the account exists.
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      // A failed attempt only. A successful sign-in writes no row here.
      attemptedAt: {
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
   * The address this table holds is not a foreign key, so this model associates with nothing:
   * an attempt on an address holding no account is a row here as much as one on an account's.
   */
  static associate () {
    super.associate?.()

    // noop
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
   * Normalizes the attempted address on the way in, through StaffMemberSecret's own
   * normalization, because the two tables have to agree on what one address is. The sign-in
   * limit counts rows by `email`, so a row stored un-normalized is a row the limit cannot
   * see: `Anna@example.com` and `anna@example.com` would count as two addresses and each
   * get its own ten attempts. The limit's whole point is that the eleventh failure for one
   * address is refused, so the guarantee belongs in the table rather than in whichever
   * caller happens to write the row.
   *
   * Three hooks, mirroring StaffMemberSecret, because a value reaches a table three ways:
   * `beforeSave` for a per-row write, and the two bulk hooks because `bulkCreate()` and the
   * static `update()` run with `individualHooks: false` and so never reach `beforeSave`.
   * An attempt is append-only in this version — nothing rewrites the address of a row already
   * counted — so the bulk-update hook guards a path no caller has yet; it is here so that
   * adding one cannot quietly land an un-normalized address in the count.
   *
   * **`upsert()` is not covered and is not supported here**, exactly as on StaffMemberSecret:
   * it runs `beforeUpsert` alone, so an address written that way would reach the table
   * un-normalized. Nothing calls it; adding a caller means adding the hook first.
   *
   * A hook cannot normalize a **read**, so the code counting attempts normalizes the address
   * it counts by before it queries. This covers the write side only.
   *
   * @returns {void}
   */
  static setupHooks () {
    super.setupHooks?.()

    this.beforeSave(attempt => {
      this.normalizeEmailOfEntity({
        entity: attempt,
      })
    })

    this.beforeBulkCreate(attempts => {
      attempts.map(attempt =>
        this.normalizeEmailOfEntity({
          entity: attempt,
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
   * Overwrite an unsaved row's attempted address with its normalized form
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

    const normalizedEmail = this.StaffMemberSecretModel.generateNormalizedEmail({
      email,
    })

    entity.set('email', normalizedEmail)
  }

  /**
   * Overwrite the attempted address a bulk update writes with its normalized form
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
      this.StaffMemberSecretModel.generateNormalizedEmail({
        email,
      })
    )
  }

  /**
   * get: The model defining what an address's normalized form is
   *
   * The one place this model couples to that definition. Reached through `this._` rather than
   * imported, because importing another model directly is a circular dependency.
   *
   * @returns {typeof import('./StaffMemberSecret.js').default} Model declaration.
   */
  static get StaffMemberSecretModel () {
    return this._.StaffMemberSecret
  }
}
