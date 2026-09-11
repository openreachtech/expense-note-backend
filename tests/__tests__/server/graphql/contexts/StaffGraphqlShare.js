import renchanEnv from '@openreachtech/renchan-env/scripts/env'

import {
  BaseGraphqlShare,
  SubscriptionBroker,
} from '@openreachtech/renchan'

import StaffGraphqlShare from '../../../../../server/graphql/contexts/StaffGraphqlShare.js'

describe('StaffGraphqlShare', () => {
  describe('super class', () => {
    test('to be defined from BaseGraphqlShare', () => {
      const actual = StaffGraphqlShare.prototype

      expect(actual)
        .toBeInstanceOf(BaseGraphqlShare)
    })
  })
})

describe('StaffGraphqlShare', () => {
  describe('.createAsync()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          params: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff',
              redisOptions: null,
            }),
          },
        },
        {
          params: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff-second-stand-in',
              redisOptions: null,
            }),
          },
        },
      ]

      test.each(cases)('config.graphqlEndpoint: $params.config.graphqlEndpoint', async ({
        params,
      }) => {
        const actual = await StaffGraphqlShare.createAsync(params)

        expect(actual)
          .toBeInstanceOf(StaffGraphqlShare)
      })
    })
  })
})

describe('StaffGraphqlShare', () => {
  describe('.createAsync()', () => {
    describe('should keep the environment this project reads its config from', () => {
      const cases = [
        {
          params: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff',
              redisOptions: null,
            }),
          },
        },
        {
          params: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff-second-stand-in',
              redisOptions: null,
            }),
          },
        },
      ]

      test.each(cases)('config.graphqlEndpoint: $params.config.graphqlEndpoint', async ({
        params,
      }) => {
        const expected = renchanEnv

        const actual = await StaffGraphqlShare.createAsync(params)

        expect(actual)
          .toHaveProperty('env', expected)
      })
    })
  })
})

describe('StaffGraphqlShare', () => {
  describe('.createAsync()', () => {
    /*
     * `createAsync()` derives what it hands the constructor -- the environment and a broker built
     * from the config -- so the spy is asserted with that derived pair, not with the raw config.
     */
    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff',
              redisOptions: null,
            }),
          },
          expected: {
            env: renchanEnv,
            broker: expect.any(SubscriptionBroker),
          },
        },
        {
          params: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff-second-stand-in',
              redisOptions: null,
            }),
          },
          expected: {
            env: renchanEnv,
            broker: expect.any(SubscriptionBroker),
          },
        },
      ]

      test.each(cases)('config.graphqlEndpoint: $params.config.graphqlEndpoint', async ({
        params,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(StaffGraphqlShare)

        await SpyClass.createAsync(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('StaffGraphqlShare', () => {
  describe('.createAsync()', () => {
    describe('should keep the broker a subscription is published through', () => {
      const cases = [
        {
          params: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff',
              redisOptions: null,
            }),
          },
          expected: expect.any(SubscriptionBroker),
        },
        {
          params: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff-second-stand-in',
              redisOptions: null,
            }),
          },
          expected: expect.any(SubscriptionBroker),
        },
      ]

      test.each(cases)('config.graphqlEndpoint: $params.config.graphqlEndpoint', async ({
        params,
        expected,
      }) => {
        const actual = await StaffGraphqlShare.createAsync(params)

        expect(actual)
          .toHaveProperty('broker', expected)
      })
    })
  })
})

describe('StaffGraphqlShare', () => {
  describe('.createAsync()', () => {
    describe('should build that broker from the config it was handed', () => {
      const cases = [
        {
          params: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff',
              redisOptions: null,
            }),
          },
          expected: {
            config: {
              graphqlEndpoint: '/graphql-staff',
              redisOptions: null,
            },
          },
        },
        {
          params: {
            config: /** @type {*} */ ({
              graphqlEndpoint: '/graphql-staff-second-stand-in',
              redisOptions: null,
            }),
          },
          expected: {
            config: {
              graphqlEndpoint: '/graphql-staff-second-stand-in',
              redisOptions: null,
            },
          },
        },
      ]

      test.each(cases)('config.graphqlEndpoint: $params.config.graphqlEndpoint', async ({
        params,
        expected,
      }) => {
        const createBrokerSpy = jest.spyOn(StaffGraphqlShare, 'createBroker')

        await StaffGraphqlShare.createAsync(params)

        expect(createBrokerSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
