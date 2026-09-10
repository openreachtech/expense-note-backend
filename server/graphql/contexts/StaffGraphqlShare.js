import {
  BaseGraphqlShare,
} from '@openreachtech/renchan'

/**
 * GraphQL shared object for Staff.
 *
 * Per-process state, built once at boot and reached by a resolver as `context.share`. Per-request
 * state belongs to `StaffGraphqlContext` instead.
 *
 * @augments {BaseGraphqlShare}
 */
export default class StaffGraphqlShare extends BaseGraphqlShare {
  /**
   * Factory method.
   *
   * @template {X extends typeof StaffGraphqlShare ? X : never} T, X
   * @param {StaffGraphqlShareAsyncFactoryParams} params - Parameters of this factory method.
   * @returns {Promise<InstanceType<T>>} Instance of this constructor.
   * @this {T}
   */
  static async createAsync ({
    config,
  }) {
    const broker = this.createBroker({
      config,
    })

    return this.create({
      env: this.generateEnv(),
      broker,
    })
  }
}

/**
 * @typedef {Parameters<GraphqlType.ShareCtor['createAsync']>[0]} StaffGraphqlShareAsyncFactoryParams
 */
