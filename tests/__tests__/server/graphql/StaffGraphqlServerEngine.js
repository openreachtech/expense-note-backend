import express from 'express'
import cors from 'cors'

import {
  DateTimeScalar,
} from '@openreachtech/renchan'

import {
  rootPath,
} from '../../../../app/globals/_.js'

import StaffGraphqlServerEngine from '../../../../server/graphql/StaffGraphqlServerEngine.js'

import BaseAppGraphqlServerEngine from '../../../../server/graphql/BaseAppGraphqlServerEngine.js'

import StaffGraphqlContext from '../../../../server/graphql/contexts/StaffGraphqlContext.js'
import StaffGraphqlShare from '../../../../server/graphql/contexts/StaffGraphqlShare.js'

describe('StaffGraphqlServerEngine', () => {
  describe('super class', () => {
    test('to be instance of base class', () => {
      const actual = StaffGraphqlServerEngine.prototype

      expect(actual)
        .toBeInstanceOf(BaseAppGraphqlServerEngine)
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('.get:config', () => {
    test('to be fixed value', () => {
      const expected = {
        graphqlEndpoint: '/graphql-staff',
        refreshTokenCookie: {
          lifetimeDays: 14,
          secure: true,
          sameSite: 'lax',
          httpOnly: true,
          name: 'staff_refresh_token',
        },
        staticPath: rootPath.to('public/'),
        schemaPath: rootPath.to('server/graphql/schemas/staff/'),
        actualResolversPath: rootPath.to('server/graphql/resolvers/staff/actual/'),
        stubResolversPath: rootPath.to('server/graphql/resolvers/staff/stub/'),
        postWorkersPath: null,
        redisOptions: null,
      }

      const actual = StaffGraphqlServerEngine.config

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('.buildRefreshTokenCookieConfig()', () => {
    describe('to combine the shared config with the audience cookie name', () => {
      test('should be the staff cookie config', () => {
        const expected = {
          lifetimeDays: 14,
          secure: true,
          sameSite: 'lax',
          httpOnly: true,
          name: 'staff_refresh_token',
        }

        const actual = StaffGraphqlServerEngine.buildRefreshTokenCookieConfig()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('.get:standardErrorCodeHash', () => {
    test('to be fixed value', () => {
      const expected = {
        Unknown: '100.X000.001',
        ConcreteMemberNotFound: '101.X000.001',
        Unauthenticated: '102.X000.001',
        Unauthorized: '102.X000.002',
        DeniedSchemaPermission: '102.X000.003',
        Database: '104.X000.001',

        CanNotSubscribe: '102.S000.001',
      }

      const actual = StaffGraphqlServerEngine.standardErrorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('.get:corsClient', () => {
    test('to be the cors library', () => {
      const actual = StaffGraphqlServerEngine.corsClient

      expect(actual)
        .toBe(cors) // same reference
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('.get:corsAllowedOrigins', () => {
    /*
     * Asserted as an invariant rather than as a fixed list, because the list itself is whatever
     * `STAFF_CORS_ALLOWED_ORIGINS` names in the environment the suite runs in, and it is meant to
     * differ between a developer's machine and a deployment. What may never differ is that it is
     * an **array**: `cors` reads a falsy `origin` — an empty string, a null, an absent value — as
     * "allow any origin", and an empty array as "allow none". The mapping from the environment's
     * own value is pinned by `.buildCorsAllowedOrigins()` below, the missing variable included.
     */
    describe('to be an allow-list, whatever the environment names', () => {
      test('should be an array', () => {
        const actual = StaffGraphqlServerEngine.corsAllowedOrigins

        expect(actual)
          .toBeInstanceOf(Array)
      })
    })

    describe('to allow no origin by wildcard', () => {
      test('should hold no asterisk', () => {
        const expected = '*'

        const actual = StaffGraphqlServerEngine.corsAllowedOrigins

        expect(actual)
          .not
          .toContain(expected)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('.buildCorsAllowedOrigins()', () => {
    describe('to name every origin the setting carries', () => {
      const cases = [
        {
          params: {
            setting: 'http://localhost:3000',
          },
          expected: [
            'http://localhost:3000',
          ],
        },
        {
          params: {
            setting: 'http://localhost:3000,https://expense-note.example',
          },
          expected: [
            'http://localhost:3000',
            'https://expense-note.example',
          ],
        },
        {
          params: {
            setting: ' http://localhost:3000 , https://expense-note.example ',
          },
          expected: [
            'http://localhost:3000',
            'https://expense-note.example',
          ],
        },
        {
          params: {
            setting: 'http://localhost:3000,',
          },
          expected: [
            'http://localhost:3000',
          ],
        },
      ]

      test.each(cases)('setting: $params.setting', ({
        params,
        expected,
      }) => {
        const actual = StaffGraphqlServerEngine.buildCorsAllowedOrigins(params)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * **A missing variable must not become a wildcard.** This is the case the boilerplate's
     * `origin: '*'` is being replaced with, so it is the one worth pinning hardest: an absent or
     * misspelled `STAFF_CORS_ALLOWED_ORIGINS` arrives here as null, and what comes back has to
     * deny every cross-origin reader rather than admit all of them.
     */
    describe('to name no origin at all when the setting names none', () => {
      /** @type {Array<*>} */
      const cases = [
        {
          params: {
            setting: null, // the value a missing or misspelled variable reads as
          },
        },
        {
          params: {
            setting: '',
          },
        },
        {
          params: {
            setting: '   ',
          },
        },
        {
          params: {
            setting: ',',
          },
        },
      ]

      test.each(cases)('setting: $params.setting', ({
        params,
      }) => {
        const actual = StaffGraphqlServerEngine.buildCorsAllowedOrigins(params)

        expect(actual)
          .toHaveLength(0)
      })
    })

    /*
     * And that empty answer has to be an empty **array**, not an empty string: `cors` treats a
     * falsy `origin` as "allow any origin", so an empty string here would be the wildcard under
     * another name and `toHaveLength(0)` above would pass for it.
     */
    describe('to answer an empty array rather than a falsy value when the setting names none', () => {
      /** @type {Array<*>} */
      const cases = [
        {
          params: {
            setting: null,
          },
        },
        {
          params: {
            setting: '',
          },
        },
      ]

      test.each(cases)('setting: $params.setting', ({
        params,
      }) => {
        const actual = StaffGraphqlServerEngine.buildCorsAllowedOrigins(params)

        expect(actual)
          .toBeInstanceOf(Array)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#get:schemasToSkipFiltering', () => {
    describe('to name the three operations that begin, end or re-establish a session', () => {
      const cases = [
        {
          factoryParams: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff',
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          expected: [
            'signIn',
            'signOut',
            'renewAccessToken',
          ],
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff-second-stand-in',
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          expected: [
            'signIn',
            'signOut',
            'renewAccessToken',
          ],
        },
      ]

      test.each(cases)('config.graphqlEndpoint: $factoryParams.config.graphqlEndpoint', ({
        factoryParams,
        expected,
      }) => {
        const engine = new StaffGraphqlServerEngine(factoryParams)

        const actual = engine.schemasToSkipFiltering

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#generateFilterHandler()', () => {
    describe('to be instance of Function', () => {
      const cases = [
        {
          factoryParams: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff',
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff-second-stand-in',
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
        },
      ]

      test.each(cases)('config.graphqlEndpoint: $factoryParams.config.graphqlEndpoint', ({
        factoryParams,
      }) => {
        const engine = new StaffGraphqlServerEngine(factoryParams)

        const actual = engine.generateFilterHandler()

        expect(actual)
          .toBeInstanceOf(Function)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#generateFilterHandler()', () => {
    describe('to resolve with no further check when context.canResolve() returns true', () => {
      const cases = [
        {
          params: {
            contextParams: {
              expressRequest: /** @type {*} */ ({}),
              requestParams: /** @type {*} */ ({}),
              engine: /** @type {*} */ ({}),
              userEntity: /** @type {*} */ ({
                id: 10100011,
              }),
              visa: /** @type {*} */ ({}),
            },
            information: {
              fieldName: 'signedInStaffMember',
            },
          },
          expected: {
            canResolveArguments: {
              schema: 'signedInStaffMember',
            },
          },
        },
        {
          params: {
            contextParams: {
              expressRequest: /** @type {*} */ ({}),
              requestParams: /** @type {*} */ ({}),
              engine: /** @type {*} */ ({}),
              userEntity: /** @type {*} */ ({
                id: 10100012,
              }),
              visa: /** @type {*} */ ({}),
            },
            information: {
              fieldName: 'expenses',
            },
          },
          expected: {
            canResolveArguments: {
              schema: 'expenses',
            },
          },
        },
      ]

      test.each(cases)('information.fieldName: $params.information.fieldName', async ({
        params,
        expected,
      }) => {
        const engine = await StaffGraphqlServerEngine.createAsync()
        const context = StaffGraphqlContext.create(params.contextParams)
        const canResolveSpy = jest.spyOn(context, 'canResolve')
          .mockReturnValue(true)
        const hasAuthenticatedSpy = jest.spyOn(context, 'hasAuthenticated')
        const handler = engine.generateFilterHandler()
        const args = {
          variables: {},
          context,
          information: params.information,
          parent: {},
        }

        await handler(args)

        expect(canResolveSpy)
          .toHaveBeenCalledWith(expected.canResolveArguments)
        expect(hasAuthenticatedSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#generateFilterHandler()', () => {
    describe('to refuse the call when context.hasAuthenticated() returns false', () => {
      const cases = [
        {
          params: {
            contextParams: {
              expressRequest: /** @type {*} */ ({}),
              requestParams: /** @type {*} */ ({}),
              engine: /** @type {*} */ ({}),
              userEntity: /** @type {*} */ ({
                id: 10100013,
              }),
              visa: /** @type {*} */ ({}),
            },
            information: {
              fieldName: 'signedInStaffMember',
            },
          },
          expected: {
            canResolveArguments: {
              schema: 'signedInStaffMember',
            },
            error: '102.X000.001',
          },
        },
        {
          params: {
            contextParams: {
              expressRequest: /** @type {*} */ ({}),
              requestParams: /** @type {*} */ ({}),
              engine: /** @type {*} */ ({}),
              userEntity: /** @type {*} */ ({
                id: 10100014,
              }),
              visa: /** @type {*} */ ({}),
            },
            information: {
              fieldName: 'expenses',
            },
          },
          expected: {
            canResolveArguments: {
              schema: 'expenses',
            },
            error: '102.X000.001',
          },
        },
      ]

      test.each(cases)('information.fieldName: $params.information.fieldName', async ({
        params,
        expected,
      }) => {
        const engine = await StaffGraphqlServerEngine.createAsync()
        const context = StaffGraphqlContext.create(params.contextParams)
        const canResolveSpy = jest.spyOn(context, 'canResolve')
          .mockReturnValue(false)
        const hasAuthenticatedSpy = jest.spyOn(context, 'hasAuthenticated')
          .mockReturnValue(false)
        const hasAuthorizedSpy = jest.spyOn(context, 'hasAuthorized')
        const handler = engine.generateFilterHandler()
        const args = {
          variables: {},
          context,
          information: params.information,
          parent: {},
        }

        const actual = () => handler(args)

        await expect(actual)
          .rejects
          .toThrow(expected.error)
        expect(canResolveSpy)
          .toHaveBeenCalledWith(expected.canResolveArguments)
        expect(hasAuthenticatedSpy)
          .toHaveBeenCalledWith()
        expect(hasAuthorizedSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#generateFilterHandler()', () => {
    describe('to refuse the call when context.hasAuthorized() returns false', () => {
      const cases = [
        {
          params: {
            contextParams: {
              expressRequest: /** @type {*} */ ({}),
              requestParams: /** @type {*} */ ({}),
              engine: /** @type {*} */ ({}),
              userEntity: /** @type {*} */ ({
                id: 10100015,
              }),
              visa: /** @type {*} */ ({}),
            },
            information: {
              fieldName: 'signedInStaffMember',
            },
          },
          expected: {
            canResolveArguments: {
              schema: 'signedInStaffMember',
            },
            error: '102.X000.002',
          },
        },
        {
          params: {
            contextParams: {
              expressRequest: /** @type {*} */ ({}),
              requestParams: /** @type {*} */ ({}),
              engine: /** @type {*} */ ({}),
              userEntity: /** @type {*} */ ({
                id: 10100016,
              }),
              visa: /** @type {*} */ ({}),
            },
            information: {
              fieldName: 'expenses',
            },
          },
          expected: {
            canResolveArguments: {
              schema: 'expenses',
            },
            error: '102.X000.002',
          },
        },
      ]

      test.each(cases)('information.fieldName: $params.information.fieldName', async ({
        params,
        expected,
      }) => {
        const engine = await StaffGraphqlServerEngine.createAsync()
        const context = StaffGraphqlContext.create(params.contextParams)
        const canResolveSpy = jest.spyOn(context, 'canResolve')
          .mockReturnValue(false)
        const hasAuthenticatedSpy = jest.spyOn(context, 'hasAuthenticated')
          .mockReturnValue(true)
        const hasAuthorizedSpy = jest.spyOn(context, 'hasAuthorized')
          .mockReturnValue(false)
        const hasSchemaPermissionSpy = jest.spyOn(context, 'hasSchemaPermission')
        const handler = engine.generateFilterHandler()
        const args = {
          variables: {},
          context,
          information: params.information,
          parent: {},
        }

        const actual = () => handler(args)

        await expect(actual)
          .rejects
          .toThrow(expected.error)
        expect(canResolveSpy)
          .toHaveBeenCalledWith(expected.canResolveArguments)
        expect(hasAuthenticatedSpy)
          .toHaveBeenCalledWith()
        expect(hasAuthorizedSpy)
          .toHaveBeenCalledWith()
        expect(hasSchemaPermissionSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#generateFilterHandler()', () => {
    describe('to refuse the call when context.hasSchemaPermission() returns false', () => {
      const cases = [
        {
          params: {
            contextParams: {
              expressRequest: /** @type {*} */ ({}),
              requestParams: /** @type {*} */ ({}),
              engine: /** @type {*} */ ({}),
              userEntity: /** @type {*} */ ({
                id: 10100017,
              }),
              visa: /** @type {*} */ ({}),
            },
            information: {
              fieldName: 'signedInStaffMember',
            },
          },
          expected: {
            canResolveArguments: {
              schema: 'signedInStaffMember',
            },
            hasSchemaPermissionArguments: {
              schema: 'signedInStaffMember',
            },
            error: '102.X000.003 {"schema":"signedInStaffMember"}',
          },
        },
        {
          params: {
            contextParams: {
              expressRequest: /** @type {*} */ ({}),
              requestParams: /** @type {*} */ ({}),
              engine: /** @type {*} */ ({}),
              userEntity: /** @type {*} */ ({
                id: 10100018,
              }),
              visa: /** @type {*} */ ({}),
            },
            information: {
              fieldName: 'expenses',
            },
          },
          expected: {
            canResolveArguments: {
              schema: 'expenses',
            },
            hasSchemaPermissionArguments: {
              schema: 'expenses',
            },
            error: '102.X000.003 {"schema":"expenses"}',
          },
        },
      ]

      test.each(cases)('information.fieldName: $params.information.fieldName', async ({
        params,
        expected,
      }) => {
        const engine = await StaffGraphqlServerEngine.createAsync()
        const context = StaffGraphqlContext.create(params.contextParams)
        const canResolveSpy = jest.spyOn(context, 'canResolve')
          .mockReturnValue(false)
        const hasAuthenticatedSpy = jest.spyOn(context, 'hasAuthenticated')
          .mockReturnValue(true)
        const hasAuthorizedSpy = jest.spyOn(context, 'hasAuthorized')
          .mockReturnValue(true)
        const hasSchemaPermissionSpy = jest.spyOn(context, 'hasSchemaPermission')
          .mockReturnValue(false)
        const handler = engine.generateFilterHandler()
        const args = {
          variables: {},
          context,
          information: params.information,
          parent: {},
        }

        const actual = () => handler(args)

        await expect(actual)
          .rejects
          .toThrow(expected.error)
        expect(canResolveSpy)
          .toHaveBeenCalledWith(expected.canResolveArguments)
        expect(hasAuthenticatedSpy)
          .toHaveBeenCalledWith()
        expect(hasAuthorizedSpy)
          .toHaveBeenCalledWith()
        expect(hasSchemaPermissionSpy)
          .toHaveBeenCalledWith(expected.hasSchemaPermissionArguments)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#get:visaIssuers', () => {
    describe('hasAuthenticated() with a member of staff on the request', () => {
      const cases = [
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ ({
              id: 10100021,
            }),
            engine: /** @type {*} */ ({}),
          },
        },
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ ({
              id: 10100022,
            }),
            engine: /** @type {*} */ ({}),
          },
        },
      ]

      test.each(cases)('userEntity.id: $params.userEntity.id', async ({
        params,
      }) => {
        const engine = new StaffGraphqlServerEngine({
          config: /** @type {*} */ ({}),
          share: /** @type {*} */ ({}),
          errorHash: {},
        })
        const issuers = engine.visaIssuers

        const actual = await issuers.hasAuthenticated(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('hasAuthenticated() with no member of staff on the request', () => {
      const cases = [
        {
          params: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-renchan-access-token': 'access-token-matching-no-session$alpha',
              },
            }),
            userEntity: /** @type {*} */ (null),
            engine: /** @type {*} */ ({}),
          },
        },
        {
          params: {
            expressRequest: /** @type {*} */ ({
              headers: {
                'x-renchan-access-token': 'access-token-matching-no-session$beta',
              },
            }),
            userEntity: /** @type {*} */ (null),
            engine: /** @type {*} */ ({}),
          },
        },
      ]

      test.each(cases)('headers: $params.expressRequest.headers', async ({
        params,
      }) => {
        const engine = new StaffGraphqlServerEngine({
          config: /** @type {*} */ ({}),
          share: /** @type {*} */ ({}),
          errorHash: {},
        })
        const issuers = engine.visaIssuers

        const actual = await issuers.hasAuthenticated(params)

        expect(actual)
          .toBeFalsy()
      })
    })

    describe('hasAuthorized() grants every caller reaching it', () => {
      const cases = [
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ ({
              id: 10100023,
            }),
            engine: /** @type {*} */ ({}),
          },
        },
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ (null),
            engine: /** @type {*} */ ({}),
          },
        },
      ]

      test.each(cases)('userEntity: $params.userEntity', async ({
        params,
      }) => {
        const engine = new StaffGraphqlServerEngine({
          config: /** @type {*} */ ({}),
          share: /** @type {*} */ ({}),
          errorHash: {},
        })
        const issuers = engine.visaIssuers

        const actual = await issuers.hasAuthorized(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('generateSchemaPermissionHash() withholds no schema', () => {
      const cases = [
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ ({
              id: 10100024,
            }),
            engine: /** @type {*} */ ({}),
          },
        },
        {
          params: {
            expressRequest: /** @type {*} */ ({}),
            userEntity: /** @type {*} */ (null),
            engine: /** @type {*} */ ({}),
          },
        },
      ]

      test.each(cases)('userEntity: $params.userEntity', async ({
        params,
      }) => {
        const engine = new StaffGraphqlServerEngine({
          config: /** @type {*} */ ({}),
          share: /** @type {*} */ ({}),
          errorHash: {},
        })
        const issuers = engine.visaIssuers

        const actual = await issuers.generateSchemaPermissionHash(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#collectMiddleware()', () => {
    /*
     * Asserted position by position, by the name of the function each middleware factory hands
     * back, because `expect.objectContaining()` refuses a function outright (`typeof other !==
     * 'object'`) and `expect.any(Function)` would pass for any four of them in any order.
     *
     * **Four, where the boilerplate mounts five.** The upload middleware that used to sit at
     * position 3 — and whose case here pinned it by the unnamed arrow it hands back — is gone:
     * no operation of this audience takes a file, and mounted it parsed an unauthenticated
     * multipart POST before any resolver or authentication filter ran. Its removal is what moves
     * the urlencoded parser from position 4 to position 3, and the removal is the reason the
     * count below is four.
     */
    describe('to be the four middleware, in the order a request passes through them', () => {
      const cases = [
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          params: {
            middlewareNamePath: '0.name',
          },
          expected: 'corsMiddleware',
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          params: {
            middlewareNamePath: '1.name',
          },
          expected: 'jsonParser',
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          params: {
            middlewareNamePath: '2.name',
          },
          expected: 'serveStatic',
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          params: {
            middlewareNamePath: '3.name',
          },
          expected: 'urlencodedParser',
        },
      ]

      test.each(cases)('middlewareNamePath: $params.middlewareNamePath', ({
        factoryParams,
        params,
        expected,
      }) => {
        const engine = new StaffGraphqlServerEngine(factoryParams)

        const actual = engine.collectMiddleware()

        expect(actual)
          .toHaveProperty(params.middlewareNamePath, expected)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#collectMiddleware()', () => {
    /*
     * The count is asserted apart from the order so that a middleware appended past the last
     * pinned position — an upload parser put back, for instance — fails here even though every
     * position above it still holds what it held.
     */
    describe('to hold those four middleware and no fifth', () => {
      const cases = [
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          expected: 4,
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/second-stand-in/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          expected: 4,
        },
      ]

      test.each(cases)('config.staticPath: $factoryParams.config.staticPath', ({
        factoryParams,
        expected,
      }) => {
        const engine = new StaffGraphqlServerEngine(factoryParams)

        const actual = engine.collectMiddleware()

        expect(actual)
          .toHaveLength(expected)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#collectMiddleware()', () => {
    /*
     * The deliberate omission this engine documents: neither body parser is handed a `verify`
     * callback stashing a `rawBody`, where the two older engines hand one to both. An exact
     * `toHaveBeenCalledWith` is what notices the day somebody adds one back.
     */
    describe('to hand neither body parser a rawBody verify callback', () => {
      const cases = [
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          expected: {
            jsonArguments: {
              limit: '16kb',
            },
            urlencodedArguments: {
              extended: true,
            },
          },
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/second-stand-in/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          expected: {
            jsonArguments: {
              limit: '16kb',
            },
            urlencodedArguments: {
              extended: true,
            },
          },
        },
      ]

      test.each(cases)('config.staticPath: $factoryParams.config.staticPath', ({
        factoryParams,
        expected,
      }) => {
        const engine = new StaffGraphqlServerEngine(factoryParams)
        const jsonSpy = jest.spyOn(express, 'json')
        const urlencodedSpy = jest.spyOn(express, 'urlencoded')

        engine.collectMiddleware()

        expect(jsonSpy)
          .toHaveBeenCalledWith(expected.jsonArguments)
        expect(urlencodedSpy)
          .toHaveBeenCalledWith(expected.urlencodedArguments)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#collectMiddleware()', () => {
    /*
     * That the allow-list actually reaches `cors`, which is the whole of the fix: an engine that
     * built the list correctly and then handed `cors` an `origin: '*'` anyway would satisfy every
     * assertion made of `.get:corsAllowedOrigins` above. The library is reached through
     * `.get:corsClient` for exactly this reason — it is a bare default-exported function, so
     * there is no module member to spy on the way `express.json` is spied on below.
     */
    describe('to hand cors the allow-list it was given', () => {
      const cases = [
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          mockAllowedOrigins: [
            'http://localhost:3000',
          ],
          expected: {
            corsArguments: {
              origin: [
                'http://localhost:3000',
              ],
            },
          },
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/second-stand-in/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          mockAllowedOrigins: [
            'https://expense-note.example',
            'https://second.expense-note.example',
          ],
          expected: {
            corsArguments: {
              origin: [
                'https://expense-note.example',
                'https://second.expense-note.example',
              ],
            },
          },
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/third-stand-in/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          // what an environment naming no origin yields, and it stays an empty list here
          mockAllowedOrigins: [],
          expected: {
            corsArguments: {
              origin: [],
            },
          },
        },
      ]

      test.each(cases)('config.staticPath: $factoryParams.config.staticPath', ({
        factoryParams,
        mockAllowedOrigins,
        expected,
      }) => {
        const engine = new StaffGraphqlServerEngine(factoryParams)
        const corsSpy = jest.fn()
        jest.spyOn(StaffGraphqlServerEngine, 'corsClient', 'get')
          .mockReturnValue(corsSpy)
        jest.spyOn(StaffGraphqlServerEngine, 'corsAllowedOrigins', 'get')
          .mockReturnValue(mockAllowedOrigins)

        engine.collectMiddleware()

        expect(corsSpy)
          .toHaveBeenCalledWith(expected.corsArguments)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#collectMiddleware()', () => {
    describe('to mount the static directory the config names', () => {
      const cases = [
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          expected: rootPath.to('public/'),
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              staticPath: rootPath.to('public/second-stand-in/'),
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          expected: rootPath.to('public/second-stand-in/'),
        },
      ]

      test.each(cases)('config.staticPath: $factoryParams.config.staticPath', ({
        factoryParams,
        expected,
      }) => {
        const engine = new StaffGraphqlServerEngine(factoryParams)
        const staticSpy = jest.spyOn(express, 'static')

        engine.collectMiddleware()

        expect(staticSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('.get:Share', () => {
    test('to be bridge class', () => {
      const actual = StaffGraphqlServerEngine.Share

      expect(actual)
        .toBe(StaffGraphqlShare) // same reference
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('.get:Context', () => {
    test('to be bridge class', () => {
      const actual = StaffGraphqlServerEngine.Context

      expect(actual)
        .toBe(StaffGraphqlContext) // same reference
    })
  })
})

describe('StaffGraphqlServerEngine', () => {
  describe('#collectScalars()', () => {
    describe('to be fixed value', () => {
      const cases = [
        {
          factoryParams: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff',
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          expected: [
            DateTimeScalar,
          ],
        },
        {
          factoryParams: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff-second-stand-in',
            }),
            share: /** @type {*} */ ({}),
            errorHash: {},
          },
          expected: [
            DateTimeScalar,
          ],
        },
      ]

      test.each(cases)('config.graphqlEndpoint: $factoryParams.config.graphqlEndpoint', async ({
        factoryParams,
        expected,
      }) => {
        const engine = new StaffGraphqlServerEngine(factoryParams)

        const actual = await engine.collectScalars()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
