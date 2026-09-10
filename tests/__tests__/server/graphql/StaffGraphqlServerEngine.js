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
      test('with no parameter', async () => {
        const engine = await StaffGraphqlServerEngine.createAsync()

        const actual = engine.generateFilterHandler()

        expect(actual)
          .toBeInstanceOf(Function)
      })
    })

    describe('to call members of context via generated function', () => {
      const expressRequestMock = /** @type {*} */ ({})
      const requestParamsMock = /** @type {*} */ ({})
      const engineMock = /** @type {*} */ ({})
      const visaMock = /** @type {*} */ ({})

      const cases = [
        {
          params: {
            context: StaffGraphqlContext.create({
              expressRequest: expressRequestMock,
              requestParams: requestParamsMock,
              engine: engineMock,
              userEntity: {
                id: 10100011,
              },
              visa: visaMock,
            }),
            information: {
              fieldName: 'signedInStaffMember',
            },
          },
          expected: {
            schema: 'signedInStaffMember',
          },
        },
        {
          params: {
            context: StaffGraphqlContext.create({
              expressRequest: expressRequestMock,
              requestParams: requestParamsMock,
              engine: engineMock,
              userEntity: {
                id: 10100012,
              },
              visa: visaMock,
            }),
            information: {
              fieldName: 'expenses',
            },
          },
          expected: {
            schema: 'expenses',
          },
        },
      ]

      describe('context.canResolve() returns true', () => {
        test.each(cases)('fieldName: $params.information.fieldName', async ({ params, expected }) => {
          const engine = await StaffGraphqlServerEngine.createAsync()

          const canResolveSpy = jest.spyOn(params.context, 'canResolve')
            .mockReturnValueOnce(true)
          const hasAuthenticatedSpy = jest.spyOn(params.context, 'hasAuthenticated')

          const handler = engine.generateFilterHandler()

          const args = {
            variables: {},
            context: params.context,
            information: params.information,
            parent: {},
          }

          await handler(args)

          expect(canResolveSpy)
            .toHaveBeenCalledWith(expected)
          expect(hasAuthenticatedSpy)
            .not
            .toHaveBeenCalled()
        })
      })

      describe('context.hasAuthenticated() returns false', () => {
        test.each(cases)('fieldName: $params.information.fieldName', async ({ params, expected }) => {
          const engine = await StaffGraphqlServerEngine.createAsync()

          const canResolveSpy = jest.spyOn(params.context, 'canResolve')
            .mockReturnValueOnce(false)
          const hasAuthenticatedSpy = jest.spyOn(params.context, 'hasAuthenticated')
            .mockReturnValueOnce(false)
          const hasAuthorizedSpy = jest.spyOn(params.context, 'hasAuthorized')

          const handler = engine.generateFilterHandler()

          const args = {
            variables: {},
            context: params.context,
            information: params.information,
            parent: {},
          }

          await expect(handler(args))
            .rejects
            .toThrow('102.X000.001')

          expect(canResolveSpy)
            .toHaveBeenCalledWith(expected)
          expect(hasAuthenticatedSpy)
            .toHaveBeenCalledWith()
          expect(hasAuthorizedSpy)
            .not
            .toHaveBeenCalled()
        })
      })

      describe('context.hasAuthorized() returns false', () => {
        test.each(cases)('fieldName: $params.information.fieldName', async ({ params, expected }) => {
          const engine = await StaffGraphqlServerEngine.createAsync()

          const canResolveSpy = jest.spyOn(params.context, 'canResolve')
            .mockReturnValueOnce(false)
          const hasAuthenticatedSpy = jest.spyOn(params.context, 'hasAuthenticated')
            .mockReturnValueOnce(true)
          const hasAuthorizedSpy = jest.spyOn(params.context, 'hasAuthorized')
            .mockReturnValueOnce(false)
          const hasSchemaPermissionSpy = jest.spyOn(params.context, 'hasSchemaPermission')

          const handler = engine.generateFilterHandler()

          const args = {
            variables: {},
            context: params.context,
            information: params.information,
            parent: {},
          }

          await expect(handler(args))
            .rejects
            .toThrow('102.X000.002')

          expect(canResolveSpy)
            .toHaveBeenCalledWith(expected)
          expect(hasAuthenticatedSpy)
            .toHaveBeenCalledWith()
          expect(hasAuthorizedSpy)
            .toHaveBeenCalledWith()
          expect(hasSchemaPermissionSpy)
            .not
            .toHaveBeenCalled()
        })
      })

      describe('context.hasSchemaPermission() returns false', () => {
        test.each(cases)('fieldName: $params.information.fieldName', async ({ params, expected }) => {
          const engine = await StaffGraphqlServerEngine.createAsync()

          const canResolveSpy = jest.spyOn(params.context, 'canResolve')
            .mockReturnValueOnce(false)
          const hasAuthenticatedSpy = jest.spyOn(params.context, 'hasAuthenticated')
            .mockReturnValueOnce(true)
          const hasAuthorizedSpy = jest.spyOn(params.context, 'hasAuthorized')
            .mockReturnValueOnce(true)
          const hasSchemaPermissionSpy = jest.spyOn(params.context, 'hasSchemaPermission')
            .mockReturnValueOnce(false)

          const handler = engine.generateFilterHandler()

          const args = {
            variables: {},
            context: params.context,
            information: params.information,
            parent: {},
          }
          const hasSchemaPermissionArgsExpected = {
            schema: expected.schema,
          }

          await expect(handler(args))
            .rejects
            .toThrow(/^102.X000.003 \{"schema":".+"\}/u)

          expect(canResolveSpy)
            .toHaveBeenCalledWith(expected)
          expect(hasAuthenticatedSpy)
            .toHaveBeenCalledWith()
          expect(hasAuthorizedSpy)
            .toHaveBeenCalledWith()
          expect(hasSchemaPermissionSpy)
            .toHaveBeenCalledWith(hasSchemaPermissionArgsExpected)
        })
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
    test('to be fixed value', () => {
      const engine = new StaffGraphqlServerEngine({
        config: /** @type {*} */ ({
          staticPath: rootPath.to('public/'),
        }),
        share: /** @type {*} */ ({}),
        errorHash: {},
      })

      const expected = [
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      ]

      const actual = engine.collectMiddleware()

      expect(actual)
        .toEqual(expected)
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
    test('to be fixed value', async () => {
      const engine = await StaffGraphqlServerEngine.createAsync()

      const expected = [
        DateTimeScalar,
      ]

      const actual = await engine.collectScalars()

      expect(actual)
        .toEqual(expected)
    })
  })
})
