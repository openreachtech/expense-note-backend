import renchanEnv from '@openreachtech/renchan-env/scripts/env'

import {
  BaseGraphqlShare,
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
