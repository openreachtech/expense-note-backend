import express from 'express'
import cors from 'cors'

import {
  DateTimeScalar,
} from '@openreachtech/renchan'

import {
  env,
  rootPath,
} from '../../app/globals/_.js'

import AUTH_CONSTANT_HASH from '../../app/constants/authConstants.js'

import BaseAppGraphqlServerEngine from './BaseAppGraphqlServerEngine.js'

import StaffGraphqlShare from './contexts/StaffGraphqlShare.js'
import StaffGraphqlContext from './contexts/StaffGraphqlContext.js'

const {
  REFRESH_TOKEN_COOKIE,
} = AUTH_CONSTANT_HASH

/*
 * What separates one origin from the next in `STAFF_CORS_ALLOWED_ORIGINS`.
 *
 * An origin holds no comma — it is a scheme, a host and an optional port — so a comma is
 * unambiguous, and one environment variable can carry the whole list.
 */
const CORS_ALLOWED_ORIGIN_SEPARATOR = ','

/*
 * The largest JSON body this endpoint parses.
 *
 * **Sized to what the audience actually accepts.** Every operation spec sections 10.1, 11.1 and
 * 12.1 declare is a GraphQL call whose variables are a handful of short scalars — `signIn`'s two
 * are an address of at most 191 characters and a password of at most 72 bytes — so the body is the
 * query document plus a few hundred bytes of variables. Sixteen kilobytes leaves room for a
 * document far longer than any this audience declares, including the introspection query a
 * schema-aware client sends, while refusing a body that could only be something else.
 *
 * It replaces the boilerplate's `10mb`, which sized the parser for a file upload this audience
 * never accepts (section 4 puts a receipt photograph out of scope for 1.0.0). An unauthenticated
 * caller could otherwise hand the parser ten megabytes to buffer and parse before any resolver or
 * authentication filter ran.
 *
 * Raise it when an operation is added that genuinely carries more, and say which one here.
 */
const MAX_JSON_BODY_SIZE = '16kb'

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

  /**
   * get: CORS library — a seam so tests can substitute it.
   *
   * @returns {typeof cors} The `cors` library.
   */
  static get corsClient () {
    return cors
  }

  /**
   * get: The origins a browser may read a response from this endpoint for.
   *
   * **Why this endpoint has an allow-list at all.** `signIn` is reachable without a session
   * (spec section 7's Authentication row), takes attacker-chosen credentials and answers with a
   * body worth reading. Under the boilerplate's `origin: '*'` any page on the internet could make
   * a visitor's browser post to it and read the answer, which is credential stuffing relayed
   * through the staff's own browsers. The cookie-authenticated operations are out of that reach
   * for a second reason — the refresh cookie is `SameSite=Lax` and this endpoint sets no
   * `Access-Control-Allow-Credentials` — but that left the whole of the protection resting on one
   * cookie attribute, with no origin control of any kind behind it.
   *
   * **A missing or misspelled variable yields an empty list, never a wildcard**, which is the same
   * shape `BaseAppGraphqlServerEngine.usesSecureRefreshTokenCookie` is written in: the unsafe
   * value has to be asked for explicitly. An empty list denies every cross-origin reader — `cors`
   * reflects an origin only when the list holds it, and an empty **array** is not the falsy value
   * it reads as "allow any" (an empty string or a null would be, which is why the list is always
   * built as an array).
   *
   * Same-origin callers are unaffected either way: a browser asks for none of these headers when
   * the page and the endpoint share an origin.
   *
   * @returns {Array<string>} Allowed origins. Empty: no cross-origin caller may read a response.
   */
  static get corsAllowedOrigins () {
    return this.buildCorsAllowedOrigins({
      setting: env.STAFF_CORS_ALLOWED_ORIGINS,
    })
  }

  /**
   * Build the allow-list out of the comma-separated setting the environment carries.
   *
   * Blank entries are dropped rather than kept, because an empty string matches no origin `cors`
   * would ever be handed and a trailing comma is the easiest thing to leave in a list by hand.
   *
   * @param {{
   *   setting: string | null
   * }} params - Parameters.
   * @returns {Array<string>} Allowed origins, in the order the setting names them.
   */
  static buildCorsAllowedOrigins ({
    setting,
  }) {
    const declaredOrigins = setting
      ?? ''

    return declaredOrigins
      .split(CORS_ALLOWED_ORIGIN_SEPARATOR)
      .map(origin => origin.trim())
      .filter(origin => origin !== '')
  }

  /**
   * Collect the middleware a request passes through, in order.
   *
   * **Two of the boilerplate's five are deliberately not here.**
   *
   * `graphqlUploadExpressWithResolvingContentType()` is absent because no operation of this
   * audience takes a file: spec sections 10.1, 11.1 and 12.1 are its complete operation list,
   * neither schema file declares the `Upload` scalar, and section 4 puts a receipt photograph out
   * of scope for 1.0.0 with no object storage declared. Mounted, it parsed a deliberate
   * unauthenticated multipart POST — ten files of ten megabytes by its own configuration — before
   * any resolver or authentication filter ran. This closes recorded question Q27, which had
   * already noticed that the `rawBody` capture beside it was dropped for exactly this reason while
   * the upload parser was kept: the omission was reasoned and the retention was inherited.
   *
   * A `verify` callback stashing a `rawBody` is the second, and the reasons are below.
   *
   * @override
   * @returns {Array<import('express').RequestHandler>} Middleware, in the order a request meets them.
   */
  collectMiddleware () {
    return [
      this.Ctor.corsClient({
        origin: this.Ctor.corsAllowedOrigins,
      }),

      express.json({
        limit: MAX_JSON_BODY_SIZE,
      }),

      express.static(
        this.config.staticPath
      ),

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
