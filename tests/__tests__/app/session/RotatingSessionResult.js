import RotatingSessionResult from '../../../../app/session/RotatingSessionResult.js'

import SavingSessionResult from '../../../../app/session/SavingSessionResult.js'

describe('RotatingSessionResult', () => {
  describe('super class', () => {
    test('to be instance of SavingSessionResult', () => {
      const actual = RotatingSessionResult.prototype

      expect(actual)
        .toBeInstanceOf(SavingSessionResult)
    })
  })
})

describe('RotatingSessionResult', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#response', () => {
        const cases = [
          {
            params: {
              response: {
                refreshToken: 'rotating-session-response-0001',
              },
            },
            expected: {
              refreshToken: 'rotating-session-response-0001',
            },
          },
          {
            params: {
              response: {
                refreshToken: 'rotating-session-response-0002',
              },
            },
            expected: {
              refreshToken: 'rotating-session-response-0002',
            },
          },
        ]

        test.each(cases)('response.refreshToken: $params.response.refreshToken', ({
          params,
          expected,
        }) => {
          const args = {
            response: params.response,
            error: null, // neutral value; not under test
            revocation: null, // neutral value; not under test
          }

          const actual = new RotatingSessionResult(args)

          expect(actual)
            .toHaveProperty('response', expected)
        })
      })

      describe('#error', () => {
        const cases = [
          {
            params: {
              error: new Error('rotating-session-error-0001'),
            },
            expected: new Error('rotating-session-error-0001'),
          },
          {
            params: {
              error: new Error('rotating-session-error-0002'),
            },
            expected: new Error('rotating-session-error-0002'),
          },
        ]

        test.each(cases)('error.message: $params.error.message', ({
          params,
          expected,
        }) => {
          const args = {
            response: null, // neutral value; not under test
            error: params.error,
            revocation: null, // neutral value; not under test
          }

          const actual = new RotatingSessionResult(args)

          expect(actual)
            .toHaveProperty('error', expected)
        })
      })

      describe('#revocation', () => {
        const cases = [
          {
            params: {
              revocation: {
                revokedRefreshTokenCount: 2,
                deletedAccessTokenCount: 3,
              },
            },
            expected: {
              revokedRefreshTokenCount: 2,
              deletedAccessTokenCount: 3,
            },
          },
          {
            params: {
              revocation: {
                revokedRefreshTokenCount: 4,
                deletedAccessTokenCount: 5,
              },
            },
            expected: {
              revokedRefreshTokenCount: 4,
              deletedAccessTokenCount: 5,
            },
          },
        ]

        test.each(cases)('revocation.revokedRefreshTokenCount: $params.revocation.revokedRefreshTokenCount', ({
          params,
          expected,
        }) => {
          const args = {
            response: null, // neutral value; not under test
            error: null, // neutral value; not under test
            revocation: params.revocation,
          }

          const actual = new RotatingSessionResult(args)

          expect(actual)
            .toHaveProperty('revocation', expected)
        })
      })
    })
  })
})

describe('RotatingSessionResult', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          params: {
            error: new Error('rotating-session-error-0003'),
          },
        },
        {
          params: {
            error: new Error('rotating-session-error-0004'),
          },
        },
      ]

      test.each(cases)('error.message: $params.error.message', ({
        params,
      }) => {
        const actual = RotatingSessionResult.create(params)

        expect(actual)
          .toBeInstanceOf(RotatingSessionResult)
      })
    })

    describe('should be call by constructor', () => {
      const cases = [
        {
          tally: {
            response: null,
            error: new Error('rotating-session-error-0005'),
            revocation: {
              revokedRefreshTokenCount: 6,
              deletedAccessTokenCount: 7,
            },
          },
        },
        {
          tally: {
            response: null,
            error: new Error('rotating-session-error-0006'),
            revocation: {
              revokedRefreshTokenCount: 8,
              deletedAccessTokenCount: 9,
            },
          },
        },
      ]

      test.each(cases)('error.message: $tally.error.message', ({
        tally,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(RotatingSessionResult)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })

    describe('should fill default values', () => {
      const cases = [
        {
          label: 'revocation omitted',
          params: {
            response: {
              refreshToken: 'rotating-session-response-0003',
            },
            error: new Error('rotating-session-error-0007'),
            // revocation: omitted -> default null
          },
          expected: {
            response: {
              refreshToken: 'rotating-session-response-0003',
            },
            error: new Error('rotating-session-error-0007'),
            revocation: null,
          },
        },
        {
          label: 'error omitted',
          params: {
            response: {
              refreshToken: 'rotating-session-response-0004',
            },
            // error: omitted -> default null
            revocation: {
              revokedRefreshTokenCount: 10,
              deletedAccessTokenCount: 11,
            },
          },
          expected: {
            response: {
              refreshToken: 'rotating-session-response-0004',
            },
            error: null,
            revocation: {
              revokedRefreshTokenCount: 10,
              deletedAccessTokenCount: 11,
            },
          },
        },
        {
          label: 'response omitted',
          params: {
            // response: omitted -> default null
            error: new Error('rotating-session-error-0008'),
            revocation: {
              revokedRefreshTokenCount: 12,
              deletedAccessTokenCount: 13,
            },
          },
          expected: {
            response: null,
            error: new Error('rotating-session-error-0008'),
            revocation: {
              revokedRefreshTokenCount: 12,
              deletedAccessTokenCount: 13,
            },
          },
        },
        {
          label: 'error and revocation omitted',
          params: {
            response: {
              refreshToken: 'rotating-session-response-0005',
            },
            // error: omitted -> default null
            // revocation: omitted -> default null
          },
          expected: {
            response: {
              refreshToken: 'rotating-session-response-0005',
            },
            error: null,
            revocation: null,
          },
        },
        {
          label: 'response and revocation omitted',
          params: {
            // response: omitted -> default null
            error: new Error('rotating-session-error-0009'),
            // revocation: omitted -> default null
          },
          expected: {
            response: null,
            error: new Error('rotating-session-error-0009'),
            revocation: null,
          },
        },
        {
          label: 'response and error omitted',
          params: {
            // response: omitted -> default null
            // error: omitted -> default null
            revocation: {
              revokedRefreshTokenCount: 14,
              deletedAccessTokenCount: 15,
            },
          },
          expected: {
            response: null,
            error: null,
            revocation: {
              revokedRefreshTokenCount: 14,
              deletedAccessTokenCount: 15,
            },
          },
        },
        {
          label: 'every argument omitted',
          params: {},
          expected: {
            response: null,
            error: null,
            revocation: null,
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(RotatingSessionResult)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('RotatingSessionResult', () => {
  describe('#hasRevokedSeries()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          params: {
            revocation: {
              revokedRefreshTokenCount: 16,
              deletedAccessTokenCount: 17,
            },
          },
        },
        {
          params: {
            revocation: {
              revokedRefreshTokenCount: 0, // a series already revoked answers the same
              deletedAccessTokenCount: 0,
            },
          },
        },
      ]

      test.each(cases)('revocation.revokedRefreshTokenCount: $params.revocation.revokedRefreshTokenCount', ({
        params,
      }) => {
        const result = RotatingSessionResult.create({
          error: new Error('rotating-session-error-0010'),
          revocation: params.revocation,
        })

        const actual = result.hasRevokedSeries()

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          params: {
            error: new Error('rotating-session-error-0011'),
          },
        },
        {
          params: {
            error: new Error('rotating-session-error-0012'),
          },
        },
      ]

      test.each(cases)('error.message: $params.error.message', ({
        params,
      }) => {
        const result = RotatingSessionResult.create({
          error: params.error,
          // revocation: omitted -> default null
        })

        const actual = result.hasRevokedSeries()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('RotatingSessionResult', () => {
  describe('#shouldRollBack()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          params: {
            error: new Error('rotating-session-error-0013'),
          },
        },
        {
          params: {
            error: new Error('rotating-session-error-0014'),
          },
        },
      ]

      test.each(cases)('error.message: $params.error.message', ({
        params,
      }) => {
        const result = RotatingSessionResult.create({
          error: params.error,
          // revocation: omitted -> default null
        })

        const actual = result.shouldRollBack()

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          label: 'a refused reuse, whose revocation is already written',
          params: {
            error: new Error('rotating-session-error-0015'),
            revocation: {
              revokedRefreshTokenCount: 18,
              deletedAccessTokenCount: 19,
            },
          },
        },
        {
          label: 'a rotation that succeeded',
          params: {
            response: {
              refreshToken: 'rotating-session-response-0006',
            },
          },
        },
      ]

      test.each(cases)('label: $label', ({
        params,
      }) => {
        const result = RotatingSessionResult.create(params)

        const actual = result.shouldRollBack()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})
