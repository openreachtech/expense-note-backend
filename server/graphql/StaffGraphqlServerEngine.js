import express from 'express'
import cors from 'cors'

import {
  DateTimeScalar,
  graphqlUploadExpressWithResolvingContentType,
} from '@openreachtech/renchan'

import {
  rootPath,
} from '../../app/globals/_.js'

import AUTH_CONSTANT_HASH from '../../app/constants/authConstants.js'

import BaseAppGraphqlServerEngine from './BaseAppGraphqlServerEngine.js'

import StaffGraphqlShare from './contexts/StaffGraphqlShare.js'
import StaffGraphqlContext from './contexts/StaffGraphqlContext.js'

const {
  REFRESH_TOKEN_COOKIE,
} = AUTH_CONSTANT_HASH

/**
 * Renchan server engine for staff.
 *
 * @augments {BaseAppGraphqlServerEngine}
 */
export default class StaffGraphqlServerEngine extends BaseAppGraphqlServerEngine {
  /** @override */
  static get config () {
    return {
      graphqlEndpoint: '/graphql-staff',
      refreshTokenCookie: this.buildRefreshTokenCookieConfig(),
      staticPath: rootPath.to('public/'),

      /*
       * A directory, where the two older audiences each name a single file. `SchemaFilesLoader`
       * stats this path and reads a directory with `readdir`, concatenating every file in name
       * order, and `makeExecutableSchema` merges the same-named `type Query` / `type Mutation`
       * blocks that come out — so each of the three features landing on this audience adds its own
       * numbered file instead of editing a shared one.
       *
       * Every file in the directory is read, with no extension filter: nothing but `.graphql`
       * belongs in there.
       */
      schemaPath: rootPath.to('server/graphql/schemas/staff/'),

      actualResolversPath: rootPath.to('server/graphql/resolvers/staff/actual/'),
      stubResolversPath: rootPath.to('server/graphql/resolvers/staff/stub/'),
      postWorkersPath: null,

      /*
       * NOTE: Uncomment the following line to enable Redis PubSub
       *   When disabled, LocalPubSub is used.
       */
      redisOptions: null,
      // redisOptions: {
      //   host: 'localhost',
      //   port: 6379,
      // },
    }
  }

  /**
   * Build the refresh-token cookie config for this audience.
   *
   * @returns {import('./contexts/tools/RefreshTokenExpressCookieClerk.js').RefreshTokenCookieConfig} Cookie config.
   */
  static buildRefreshTokenCookieConfig () {
    return {
      ...this.refreshTokenCookieConfig,
      name: REFRESH_TOKEN_COOKIE.STAFF.NAME,
    }
  }

  /** @override */
  static get standardErrorCodeHash () {
    return {
      Unknown: '100.X000.001',
      ConcreteMemberNotFound: '101.X000.001',
      Unauthenticated: '102.X000.001',
      Unauthorized: '102.X000.002',
      DeniedSchemaPermission: '102.X000.003',
      Database: '104.X000.001',

      CanNotSubscribe: '102.S000.001',
    }
  }

  /** @override */
  collectMiddleware () {
    return [
      cors({
        origin: '*',
      }),

      express.json({
        limit: '10mb',
      }),

      express.static(
        this.config.staticPath
      ),

      graphqlUploadExpressWithResolvingContentType({
        maxFileSize: 10000000, // 10 MB
        maxFiles: 10,
      }),

      /*
       * No `verify` callback stashing a `rawBody`, where the two older engines carry one.
       *
       * Nothing in this repository or in renchan reads `rawBody`: it is boilerplate laid in for a
       * future webhook that has to check a signature over the bytes it arrived as, and this
       * audience serves no webhook — spec section 10.1 is its complete operation list, and every
       * entry on it is a GraphQL call whose body `express.json` has already parsed. Parsing of a
       * urlencoded body is unchanged; only the unread copy is absent.
       *
       * Writing one would also cost more than it looks. `request['rawBody'] = ...` breaks
       * `no-param-reassign`, and the disable comment the older engines carry for it is itself
       * refused by `eslint-comments/no-use` outside the three files `eslint.config.js` lists — a
       * list that file tells maintainers never to add to. `Object.assign` is banned outright by
       * `no-restricted-properties`. Whoever needs the bytes here adds the capture and that
       * `eslint.config.js` entry together, deliberately.
       */
      express.urlencoded({
        extended: true,
      }),
    ]
  }

  /**
   * get: Operations that skip the authentication filter.
   *
   * An entry here means `generateFilterHandler()` **never runs** for that operation — the
   * framework hands `schemasToSkipFiltering` to `FilterSchemaHashBuilder` as `ignoredSchemas`, and
   * the ignored entries are mapped to `null`, which the resolver wrapper calls as `filter?.(…)`.
   * No `Unauthenticated`, no `Unauthorized`, no `DeniedSchemaPermission`. An operation wrongly
   * listed here is a public endpoint, so the list is exactly what spec section 7's Authentication
   * row names and nothing else:
   *
   * - `signIn` — uses neither credential. It is how a session begins.
   * - `signOut` — authenticates by the refresh-token cookie, because it has to work once the
   * access token has expired.
   * - `renewAccessToken` — the same, for the same reason. It is what re-establishes a session.
   *
   * **Two of the three still have to authenticate, and now owe it themselves.** `signOut` and
   * `renewAccessToken` must each read the refresh-token cookie through
   * `RefreshTokenExpressCookieClerk`, find its series, and refuse a cookie that is missing,
   * expired, revoked or already spent — identically in every case, per spec section 10's
   * acceptance criteria. Skipping the filter removed the gate; it did not remove the requirement.
   * `signIn` owes instead the section 7 rate limit: ten failed attempts per fifteen minutes per
   * email address, counted in `sign_in_attempts`. Checkpoint 6 of `#sign-in` owes all three.
   *
   * `signedInStaffMember` is deliberately absent: section 10 requires it to be refused without a
   * session and to return nobody, which is the filter below doing its job. So is `healthCheck` —
   * this audience declares no such operation at all.
   *
   * @override
   * @returns {Array<string>} Names of the operations that skip the filter.
   */
  get schemasToSkipFiltering () {
    return [
      'signIn',
      'signOut',
      'renewAccessToken',
    ]
  }

  /** @override */
  generateFilterHandler () {
    return async ({
      variables,
      context,
      information,
      parent,
    }) => {
      const schema = information.fieldName

      const canResolve = context.canResolve({
        schema,
      })

      if (canResolve) {
        return
      }

      if (!context.hasAuthenticated()) {
        throw this.errorHash.Unauthenticated.create()
      }

      if (!context.hasAuthorized()) {
        throw this.errorHash.Unauthorized.create()
      }

      if (!context.hasSchemaPermission({
        schema,
      })) {
        throw this.errorHash.DeniedSchemaPermission.create({
          value: {
            schema,
          },
        })
      }
    }
  }

  /** @override */
  get visaIssuers () {
    return {
      hasAuthenticated: async ({
        expressRequest,
        userEntity,
        engine,
      }) => userEntity !== null,
      hasAuthorized: async ({
        expressRequest,
        userEntity,
        engine,
      }) => true,
      generateSchemaPermissionHash: async ({
        expressRequest,
        userEntity,
        engine,
      }) =>
        /**
         * @type {Record<string, boolean> | null} - Schema permission hash. (null means that all schemas have permission)
         * @example
         * ```js
         * return {
         *   signedInStaffMember: true,
         *   expenses: false,
         *   ...
         * }
         * ```
         */ (
          null
        ),
    }
  }

  /** @override */
  static get Share () {
    return StaffGraphqlShare
  }

  /** @override */
  static get Context () {
    return StaffGraphqlContext
  }

  /** @override */
  async collectScalars () {
    return [
      DateTimeScalar,
    ]
  }
}
