import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import PasswordEncipher from '../../../../../../../../app/session/PasswordEncipher.js'
import SessionClerk from '../../../../../../../../app/session/SessionClerk.js'

import SignInFailureRateLimit from '../../../../../../../../app/tools/rateLimit/limits/SignInFailureRateLimit.js'

import SignInInputValidator from '../../../../../../../../app/tools/validator/resolvers/staff/mutations/SignInInputValidator.js'

import SignInAttempt from '../../../../../../../../sequelize/models/SignInAttempt.js'
import StaffMemberAccessToken from '../../../../../../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberPasswordHash from '../../../../../../../../sequelize/models/StaffMemberPasswordHash.js'
import StaffMemberRefreshToken from '../../../../../../../../sequelize/models/StaffMemberRefreshToken.js'
import StaffMemberSecret from '../../../../../../../../sequelize/models/StaffMemberSecret.js'

import RefreshTokenExpressCookieClerk from '../../../../../../../../server/graphql/contexts/tools/RefreshTokenExpressCookieClerk.js'

import SignInMutationResolver from '../../../../../../../../server/graphql/resolvers/staff/actual/mutations/SignInMutationResolver.js'

/*
 * The members that write nothing — the getters, the seams, the input validation, the two reads and
 * the password verification. `#resolve()` and `#recordSignInFailure()` write, so they live in
 * `tests/_orders/SignInMutationResolver/`.
 *
 * The members of staff are the seeded ones, and the plaintext beside each seeded digest is
 * recorded in `sequelize/seeders/development/20260910120003-000003-staff_member_password_hashes.cjs`.
 * Three seeded cases are deliberately reused throughout: 10110011 holds an address and no digest,
 * 10110012 holds neither, and 10110013 holds a digest and no address.
 *
 * Several members take no argument, or an argument whose variations are few; those cases are
 * varied by the **instance** instead, each built with a different stand-in error code so it holds
 * a different `errorHash`. That is the shape the sibling
 * `RenewAccessTokenMutationResolver` test already uses.
 */

describe('SignInMutationResolver', () => {
  describe('super class', () => {
    test('to be instance of BaseMutationResolver', () => {
      const actual = SignInMutationResolver.prototype

      expect(actual)
        .toBeInstanceOf(BaseMutationResolver)
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#passwordEncipher', () => {
        const cases = [
          {
            params: {
              passwordEncipher: /** @type {*} */ ({
                label: 'first stand-in encipher',
              }),
              sessionClerk: /** @type {*} */ ({
                label: 'first stand-in clerk',
              }),
              errorHash: /** @type {*} */ ({}),
            },
          },
          {
            params: {
              passwordEncipher: /** @type {*} */ ({
                label: 'second stand-in encipher',
              }),
              sessionClerk: /** @type {*} */ ({
                label: 'second stand-in clerk',
              }),
              errorHash: /** @type {*} */ ({}),
            },
          },
        ]

        test.each(cases)('passwordEncipher.label: $params.passwordEncipher.label', ({
          params,
        }) => {
          const actual = new SignInMutationResolver(params)

          expect(actual)
            .toHaveProperty('passwordEncipher', params.passwordEncipher)
        })
      })

      describe('#sessionClerk', () => {
        const cases = [
          {
            params: {
              passwordEncipher: /** @type {*} */ ({
                label: 'first stand-in encipher',
              }),
              sessionClerk: /** @type {*} */ ({
                label: 'first stand-in clerk',
              }),
              errorHash: /** @type {*} */ ({}),
            },
          },
          {
            params: {
              passwordEncipher: /** @type {*} */ ({
                label: 'second stand-in encipher',
              }),
              sessionClerk: /** @type {*} */ ({
                label: 'second stand-in clerk',
              }),
              errorHash: /** @type {*} */ ({}),
            },
          },
        ]

        test.each(cases)('sessionClerk.label: $params.sessionClerk.label', ({
          params,
        }) => {
          const actual = new SignInMutationResolver(params)

          expect(actual)
            .toHaveProperty('sessionClerk', params.sessionClerk)
        })
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          params: {
            passwordEncipher: /** @type {*} */ ({
              label: 'first stand-in encipher',
            }),
            sessionClerk: /** @type {*} */ ({
              label: 'first stand-in clerk',
            }),
            errorCodeHash: {
              StandInError: '204.M001.001',
            },
          },
        },
        {
          params: {
            passwordEncipher: /** @type {*} */ ({
              label: 'second stand-in encipher',
            }),
            sessionClerk: /** @type {*} */ ({
              label: 'second stand-in clerk',
            }),
            errorCodeHash: {
              StandInError: '204.M001.002',
            },
          },
        },
      ]

      test.each(cases)('passwordEncipher.label: $params.passwordEncipher.label', ({
        params,
      }) => {
        const actual = SignInMutationResolver.create(params)

        expect(actual)
          .toBeInstanceOf(SignInMutationResolver)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.create()', () => {
    /*
     * The factory hands the constructor a **transformed** object: the declared `errorCodeHash` has
     * become the built `errorHash`, and the two collaborators pass through untouched.
     */
    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            passwordEncipher: /** @type {*} */ ({
              label: 'first stand-in encipher',
            }),
            sessionClerk: /** @type {*} */ ({
              label: 'first stand-in clerk',
            }),
            errorCodeHash: {
              StandInError: '204.M001.001',
            },
          },
          expected: expect.objectContaining({
            passwordEncipher: {
              label: 'first stand-in encipher',
            },
            sessionClerk: {
              label: 'first stand-in clerk',
            },
          }),
        },
        {
          params: {
            passwordEncipher: /** @type {*} */ ({
              label: 'second stand-in encipher',
            }),
            sessionClerk: /** @type {*} */ ({
              label: 'second stand-in clerk',
            }),
            errorCodeHash: {
              StandInError: '204.M001.002',
            },
          },
          expected: expect.objectContaining({
            passwordEncipher: {
              label: 'second stand-in encipher',
            },
            sessionClerk: {
              label: 'second stand-in clerk',
            },
          }),
        },
      ]

      test.each(cases)('passwordEncipher.label: $params.passwordEncipher.label', ({
        params,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(SignInMutationResolver)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.create()', () => {
    describe('should use default passwordEncipher value', () => {
      const cases = [
        {
          params: {
            sessionClerk: /** @type {*} */ ({
              label: 'first stand-in clerk',
            }),
            errorCodeHash: {
              StandInError: '204.M001.001',
            },
          },
        },
        {
          params: {
            sessionClerk: /** @type {*} */ ({
              label: 'second stand-in clerk',
            }),
            errorCodeHash: {
              StandInError: '204.M001.002',
            },
          },
        },
      ]

      test.each(cases)('sessionClerk.label: $params.sessionClerk.label', ({
        params,
      }) => {
        const supplierSpy = jest.spyOn(SignInMutationResolver, 'createPasswordEncipher')

        const actual = SignInMutationResolver.create(params)

        expect(actual)
          .toHaveProperty('passwordEncipher', expect.any(PasswordEncipher))
        expect(supplierSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.create()', () => {
    describe('should use default sessionClerk value', () => {
      const cases = [
        {
          params: {
            passwordEncipher: /** @type {*} */ ({
              label: 'first stand-in encipher',
            }),
            errorCodeHash: {
              StandInError: '204.M001.001',
            },
          },
        },
        {
          params: {
            passwordEncipher: /** @type {*} */ ({
              label: 'second stand-in encipher',
            }),
            errorCodeHash: {
              StandInError: '204.M001.002',
            },
          },
        },
      ]

      test.each(cases)('passwordEncipher.label: $params.passwordEncipher.label', ({
        params,
      }) => {
        const supplierSpy = jest.spyOn(SignInMutationResolver, 'createSessionClerk')

        const actual = SignInMutationResolver.create(params)

        expect(actual)
          .toHaveProperty('sessionClerk', expect.any(SessionClerk))
        expect(supplierSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:schema', () => {
    test('to be fixed value', () => {
      const expected = 'signIn'

      const actual = SignInMutationResolver.schema

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:errorCodeHash', () => {
    /*
     * **One code for both credential outcomes is the assertion here.** Spec section 10's first
     * criterion requires an address with no account and a correct address with the wrong password
     * to be refused identically, so a second code among those two would be the defect — and the
     * whole hash is compared rather than one key read off it, so adding one fails this test.
     *
     * The four `203` names are the ones `SignInInputValidator` reads off `errorHash`; renaming one
     * here leaves the validator reaching for a constructor that does not exist.
     *
     * `TooFrequentSignIn` and `FailedToStartSession` carry codes of their own legitimately:
     * neither is a credential outcome, and neither tells a caller whose accounts exist.
     */
    test('to hold one credential refusal, the validator\'s four, and two of its own', () => {
      const expected = {
        MissingEmail: '203.M001.001',
        MissingPassword: '203.M001.002',
        MalformedEmail: '203.M001.003',
        TooLongPassword: '203.M001.004',
        InvalidCredentials: '204.M001.001',
        TooFrequentSignIn: '204.M001.002',
        FailedToStartSession: '204.M001.003',
      }

      const actual = SignInMutationResolver.errorCodeHash

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:PasswordEncipherCtor', () => {
    test('to be the password encipher class', () => {
      const actual = SignInMutationResolver.PasswordEncipherCtor

      expect(actual)
        .toBe(PasswordEncipher) // same reference
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:RefreshTokenExpressCookieClerkCtor', () => {
    test('to be the cookie clerk class', () => {
      const actual = SignInMutationResolver.RefreshTokenExpressCookieClerkCtor

      expect(actual)
        .toBe(RefreshTokenExpressCookieClerk) // same reference
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:SessionClerkCtor', () => {
    test('to be the session clerk class', () => {
      const actual = SignInMutationResolver.SessionClerkCtor

      expect(actual)
        .toBe(SessionClerk) // same reference
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:SignInFailureRateLimitCtor', () => {
    test('to be the sign-in failure rate limit class', () => {
      const actual = SignInMutationResolver.SignInFailureRateLimitCtor

      expect(actual)
        .toBe(SignInFailureRateLimit) // same reference
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:SignInInputValidatorCtor', () => {
    test('to be the input validator class', () => {
      const actual = SignInMutationResolver.SignInInputValidatorCtor

      expect(actual)
        .toBe(SignInInputValidator) // same reference
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:StaffMemberAccessTokenCtor', () => {
    test('to be the staff access token model', () => {
      const actual = SignInMutationResolver.StaffMemberAccessTokenCtor

      expect(actual)
        .toBe(StaffMemberAccessToken) // same reference
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.get:StaffMemberRefreshTokenCtor', () => {
    test('to be the staff refresh token model', () => {
      const actual = SignInMutationResolver.StaffMemberRefreshTokenCtor

      expect(actual)
        .toBe(StaffMemberRefreshToken) // same reference
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.createPasswordEncipher()', () => {
    test('to build a password encipher', () => {
      const actual = SignInMutationResolver.createPasswordEncipher()

      expect(actual)
        .toBeInstanceOf(PasswordEncipher)
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.createSessionClerk()', () => {
    test('to build a session clerk', () => {
      const actual = SignInMutationResolver.createSessionClerk()

      expect(actual)
        .toBeInstanceOf(SessionClerk)
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('.createSessionClerk()', () => {
    /*
     * The staff pair and not another audience's: a clerk handed the wrong models would mint
     * somebody else's session while looking like it worked.
     */
    test('to hand the clerk the staff token models', () => {
      const expected = expect.objectContaining({
        AccessTokenModel: StaffMemberAccessToken,
        RefreshTokenModel: StaffMemberRefreshToken,
      })

      const actual = SignInMutationResolver.createSessionClerk()

      expect(actual)
        .toEqual(expected)
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#get:Ctor', () => {
    describe('should be own class', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M001.001',
            },
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M001.002',
            },
          },
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
      }) => {
        const resolver = SignInMutationResolver.create(factoryParams)

        const actual = resolver.Ctor

        expect(actual)
          .toBe(SignInMutationResolver) // same reference
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#get:SignInAttemptModel', () => {
    describe('should be the sign-in attempt model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M001.001',
            },
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M001.002',
            },
          },
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
      }) => {
        const resolver = SignInMutationResolver.create(factoryParams)

        const actual = resolver.SignInAttemptModel

        expect(actual)
          .toBe(SignInAttempt) // same reference
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#get:StaffMemberPasswordHashModel', () => {
    describe('should be the password digest model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M001.001',
            },
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M001.002',
            },
          },
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
      }) => {
        const resolver = SignInMutationResolver.create(factoryParams)

        const actual = resolver.StaffMemberPasswordHashModel

        expect(actual)
          .toBe(StaffMemberPasswordHash) // same reference
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#get:StaffMemberSecretModel', () => {
    describe('should be the sign-in address model', () => {
      const cases = [
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M001.001',
            },
          },
        },
        {
          factoryParams: {
            errorCodeHash: {
              StandInError: '204.M001.002',
            },
          },
        },
      ]

      test.each(cases)('errorCodeHash.StandInError: $factoryParams.errorCodeHash.StandInError', ({
        factoryParams,
      }) => {
        const resolver = SignInMutationResolver.create(factoryParams)

        const actual = resolver.StaffMemberSecretModel

        expect(actual)
          .toBe(StaffMemberSecret) // same reference
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#createInputValidator()', () => {
    describe('should build the input validator of this request', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'haruka.arai@expense-note.example',
              password: 'haruka-monday-8401',
            },
          },
        },
        {
          params: {
            input: {
              email: 'not-an-address',
              password: '',
            },
          },
        },
      ]

      test.each(cases)('input.email: $params.input.email', ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = resolver.createInputValidator(params)

        expect(actual)
          .toBeInstanceOf(SignInInputValidator)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#createInputValidator()', () => {
    /*
     * The resolver's own `errorHash` is what the validator is handed, which is what makes each
     * rule refuse with this resolver's `203.M001.*` code. A validator built with an error hash of
     * its own would refuse with something no client has ever been told about.
     */
    describe('should hand the validator this request\'s input and this resolver\'s error hash', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
          },
        },
        {
          params: {
            input: {
              email: '',
              password: 'mio-wednesday-5714',
            },
          },
        },
      ]

      test.each(cases)('input.email: $params.input.email', ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = resolver.createInputValidator(params)

        expect(actual)
          .toHaveProperty('input', params.input)
        expect(actual)
          .toHaveProperty('errorHash', resolver.errorHash)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#validateInput()', () => {
    describe('should refuse nothing an input satisfying every rule', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'haruka.arai@expense-note.example',
              password: 'haruka-monday-8401',
            },
          },
        },
        {
          params: {
            input: {
              email: 'Rin.Takahashi@Expense-Note.Example',
              password: 'rin-friday-7052',
            },
          },
        },
        {
          params: {
            input: {
              email: 'nobody@nowhere.example',
              password: 'a wrong password, which is not this rule\'s business',
            },
          },
        },
      ]

      test.each(cases)('input.email: $params.input.email', ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = resolver.validateInput(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#validateInput()', () => {
    /*
     * Each rule refuses with **this resolver's** code, which is the point of handing the validator
     * the resolver's error hash. The message of a renchan GraphQL error is its code, so comparing
     * the message is comparing the code a client would see.
     *
     * The presence rules are answered ahead of the shape rules: the empty address below is refused
     * as missing rather than as malformed, and the 100-character password is refused as too long
     * while the address beside it is a good one.
     */
    describe('should refuse a malformed input with this resolver\'s own code', () => {
      const cases = [
        {
          params: {
            input: {
              email: '',
              password: 'haruka-monday-8401',
            },
          },
          expected: '203.M001.001',
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: '',
            },
          },
          expected: '203.M001.002',
        },
        {
          params: {
            input: {
              email: 'mio.fukuda-at-expense-note.example',
              password: 'mio-wednesday-5714',
            },
          },
          expected: '203.M001.003',
        },
        {
          params: {
            input: {
              email: 'souta.nishimura@expense-note.example',
              password: 'souta-thursday-6238-padded-out-to-seventy-three-bytes-so-bcrypt-would-cut-it',
            },
          },
          expected: '203.M001.004',
        },
      ]

      test.each(cases)('input.email: $params.input.email', ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = resolver.validateInput(params)

        expect(actual)
          .toHaveProperty('message', expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#createSignInFailureRateLimit()', () => {
    describe('should build the sign-in failure rate limit', () => {
      const cases = [
        {
          params: {
            pointsAt: new Date('2026-09-11T09:00:00.000Z'),
          },
        },
        {
          params: {
            pointsAt: new Date('2026-09-12T10:30:00.000Z'),
          },
        },
      ]

      test.each(cases)('pointsAt: $params.pointsAt', ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = resolver.createSignInFailureRateLimit(params)

        expect(actual)
          .toBeInstanceOf(SignInFailureRateLimit)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#createSignInFailureRateLimit()', () => {
    /*
     * The window ends at the request's own instant, never at whatever the clock says inside the
     * limit: one request asks every question of one clock.
     */
    describe('should end the window at the instant it is handed', () => {
      const cases = [
        {
          params: {
            pointsAt: new Date('2026-09-13T09:00:00.000Z'),
          },
        },
        {
          params: {
            pointsAt: new Date('2026-09-14T10:30:00.000Z'),
          },
        },
      ]

      test.each(cases)('pointsAt: $params.pointsAt', ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = resolver.createSignInFailureRateLimit(params)

        expect(actual)
          .toHaveProperty('pointsAt', params.pointsAt)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#hasReachedSignInFailureLimit()', () => {
    /*
     * Read against the real table, which holds no attempt at all on these addresses — an address
     * that failed nothing inside the window may try.
     */
    describe('should refuse nothing an address that failed nothing in the window', () => {
      const cases = [
        {
          params: {
            email: 'unused-address-0001@expense-note.example',
            pointsAt: new Date('2026-09-15T09:00:00.000Z'),
          },
        },
        {
          params: {
            email: 'unused-address-0002@expense-note.example',
            pointsAt: new Date('2026-09-16T10:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('email: $params.email', async ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = await resolver.hasReachedSignInFailureLimit(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#hasReachedSignInFailureLimit()', () => {
    /*
     * Ten rows in fifteen minutes is arranged for real in `tests/_orders/`; here only the count is
     * steered, so that the threshold of ten stays the limit's own (asserted in
     * `tests/__tests__/app/tools/rateLimit/limits/SignInFailureRateLimit.js`) and the "at or over"
     * comparison stays the base class's. The assertion on what the count was asked for is what
     * proves the limit is keyed on the presented address and on nothing else.
     */
    describe('should refuse an address that already failed as often as the window allows', () => {
      const cases = [
        {
          params: {
            email: 'busy-address-0001@expense-note.example',
            pointsAt: new Date('2026-09-17T09:00:00.000Z'),
          },
          mockRecentEventCount: 10, // exactly the threshold: the eleventh is one too many
        },
        {
          params: {
            email: 'busy-address-0002@expense-note.example',
            pointsAt: new Date('2026-09-18T10:00:00.000Z'),
          },
          mockRecentEventCount: 25, // well past it
        },
      ]

      test.each(cases)('email: $params.email', async ({
        params,
        mockRecentEventCount,
      }) => {
        const resolver = SignInMutationResolver.create()
        const countSpy = jest.spyOn(SignInFailureRateLimit.prototype, 'countRecentEvents')
          .mockResolvedValue(mockRecentEventCount)

        const actual = await resolver.hasReachedSignInFailureLimit(params)

        expect(actual)
          .toBeTruthy()
        expect(countSpy)
          .toHaveBeenCalledWith({
            key: params.email,
          })
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#findStaffMemberSecret()', () => {
    /*
     * **The mixed-case cases are the point of this describe.** The table stores an address lower
     * cased, through three write hooks a read cannot reach, so a lookup on the address exactly as
     * typed would match nothing — and every account whose holder capitalized a letter would appear
     * not to exist. A `+` tag and a subdomain survive the normalization unchanged, which is why
     * two of the seeded addresses carry them.
     */
    describe('should find the seeded address a member of staff signs in with', () => {
      const cases = [
        {
          params: {
            email: 'haruka.arai@expense-note.example',
          },
          expected: expect.objectContaining({
            id: 10120001,
            StaffMemberId: 10110001,
            email: 'haruka.arai@expense-note.example',
          }),
        },
        {
          params: {
            email: 'Rin.Takahashi@Expense-Note.Example',
          },
          expected: expect.objectContaining({
            id: 10120005,
            StaffMemberId: 10110005,
            email: 'rin.takahashi@expense-note.example',
          }),
        },
        {
          params: {
            email: 'YUUTO.KIRISHIMA+NOTES@EXPENSE-NOTE.EXAMPLE',
          },
          expected: expect.objectContaining({
            id: 10120006,
            StaffMemberId: 10110006,
            email: 'yuuto.kirishima+notes@expense-note.example',
          }),
        },
        {
          params: {
            email: 'Nanami.Doi@Sub.Expense-Note.Example',
          },
          expected: expect.objectContaining({
            id: 10120007,
            StaffMemberId: 10110007,
            email: 'nanami.doi@sub.expense-note.example',
          }),
        },
      ]

      test.each(cases)('email: $params.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = await resolver.findStaffMemberSecret(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#findStaffMemberSecret()', () => {
    describe('should find nothing for an address holding no account', () => {
      const cases = [
        {
          params: {
            email: 'nobody@expense-note.example',
          },
        },
        {
          params: {
            email: 'haruka.arai@another-company.example',
          },
        },
        {
          params: {
            // A plausible address on the seeded domain that no seeded row holds — so the lookup
            // fails on the address rather than on the domain.
            email: 'kaede.kobayashi@expense-note.example',
          },
        },
      ]

      test.each(cases)('email: $params.email', async ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = await resolver.findStaffMemberSecret(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#findStaffMemberPasswordHash()', () => {
    describe('should find the current digest of a member of staff', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
          },
          expected: expect.objectContaining({
            id: 10130001,
            StaffMemberId: 10110001,
          }),
        },
        {
          params: {
            staffMemberId: 10110010,
          },
          expected: expect.objectContaining({
            id: 10130010,
            StaffMemberId: 10110010,
          }),
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = await resolver.findStaffMemberPasswordHash(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#findStaffMemberPasswordHash()', () => {
    /*
     * Two seeded half-issued members of staff: 10110011 holds an address and no digest, 10110012
     * holds neither. Both are reachable states — section 4 has accounts issued by hand — and both
     * are refused through the same branch as an address with no account at all.
     */
    describe('should find nothing for a member of staff holding no digest', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110011,
          },
        },
        {
          params: {
            staffMemberId: 10110012,
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = await resolver.findStaffMemberPasswordHash(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#findPasswordHashOfSecret()', () => {
    describe('should find the digest of the member of staff an address belongs to', () => {
      const cases = [
        {
          params: {
            secretEntity: /** @type {*} */ ({
              StaffMemberId: 10110002,
            }),
          },
          expected: expect.objectContaining({
            id: 10130002,
            StaffMemberId: 10110002,
          }),
        },
        {
          params: {
            secretEntity: /** @type {*} */ ({
              StaffMemberId: 10110009,
            }),
          },
          expected: expect.objectContaining({
            id: 10130009,
            StaffMemberId: 10110009,
          }),
        },
      ]

      test.each(cases)('secretEntity.StaffMemberId: $params.secretEntity.StaffMemberId', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = await resolver.findPasswordHashOfSecret(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#findPasswordHashOfSecret()', () => {
    /*
     * An address that holds no account arrives here as null, and answers null — which is the same
     * answer as a member of staff who holds no digest. The two credential outcomes become
     * indistinguishable right here, one step before either is refused.
     */
    describe('should find nothing where there is no address row at all', () => {
      const cases = [
        {
          params: {
            secretEntity: null,
          },
        },
        {
          params: {
            secretEntity: /** @type {*} */ ({
              StaffMemberId: 10110011,
            }),
          },
        },
      ]

      test.each(cases)('secretEntity: $params.secretEntity', async ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = await resolver.findPasswordHashOfSecret(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#verifiesPresentedPassword()', () => {
    /*
     * The digest is the seeded one, fetched through the resolver's own read (which has its own
     * describe above) rather than restated as a literal here, and the plaintext is the one
     * recorded beside it in the seeder.
     */
    describe('should verify the password recorded against a seeded digest', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110003,
            password: 'mio-wednesday-5714',
          },
        },
        {
          params: {
            staffMemberId: 10110008,
            password: 'riku-january-2589',
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', async ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()
        const passwordHashEntity = await resolver.findStaffMemberPasswordHash({
          staffMemberId: params.staffMemberId,
        })

        const actual = await resolver.verifiesPresentedPassword({
          password: params.password,
          passwordHashEntity,
        })

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#verifiesPresentedPassword()', () => {
    /*
     * Another member of staff's password, a near miss and an empty string all fail against a real
     * digest. No two seeded members of staff share a password, so a wrong one is genuinely wrong.
     */
    describe('should verify no password other than the recorded one', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110004,
            password: 'haruka-monday-8401',
          },
        },
        {
          params: {
            staffMemberId: 10110004,
            password: 'souta-thursday-6239',
          },
        },
        {
          params: {
            staffMemberId: 10110004,
            password: '',
          },
        },
      ]

      test.each(cases)('password: $params.password', async ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()
        const passwordHashEntity = await resolver.findStaffMemberPasswordHash({
          staffMemberId: params.staffMemberId,
        })

        const actual = await resolver.verifiesPresentedPassword({
          password: params.password,
          passwordHashEntity,
        })

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#verifiesPresentedPassword()', () => {
    /*
     * **Where no digest was found, a compare is still spent.** That is spec section 10's first
     * criterion read as covering more than the wording of a refusal: an address with no account
     * answering immediately, while a wrong password spends about sixty milliseconds inside bcrypt,
     * is a difference anybody with a clock can read — and reading it is how a list of who works
     * here gets built. So the spy assertion below is not incidental; it is the criterion. The
     * digest compared against is asserted by shape rather than by value, because naming the
     * placeholder digest in a test would be the one place it could leak.
     */
    describe('should verify nothing, and still spend a compare, where no digest was found', () => {
      const cases = [
        {
          params: {
            password: 'haruka-monday-8401',
            passwordHashEntity: null,
          },
          expected: {
            password: 'haruka-monday-8401',
            passwordHash: expect.stringMatching(/^\$2[aby]\$/u),
          },
        },
        {
          params: {
            password: 'a password nobody holds',
            passwordHashEntity: null,
          },
          expected: {
            password: 'a password nobody holds',
            passwordHash: expect.stringMatching(/^\$2[aby]\$/u),
          },
        },
      ]

      test.each(cases)('password: $params.password', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const compareSpy = jest.spyOn(PasswordEncipher.prototype, 'comparesPassword')

        const actual = await resolver.verifiesPresentedPassword(params)

        expect(actual)
          .toBeFalsy()
        expect(compareSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#equalizeVerificationDuration()', () => {
    /*
     * One compare, against a real bcrypt digest, with the password as presented. The answer is
     * discarded on purpose — what this method buys is the time.
     */
    describe('should spend one compare against a real digest', () => {
      const cases = [
        {
          params: {
            password: 'kenji-tuesday-3927',
          },
          expected: {
            password: 'kenji-tuesday-3927',
            passwordHash: expect.stringMatching(/^\$2[aby]\$10\$/u),
          },
        },
        {
          params: {
            password: 'another password nobody holds',
          },
          expected: {
            password: 'another password nobody holds',
            passwordHash: expect.stringMatching(/^\$2[aby]\$10\$/u),
          },
        },
      ]

      test.each(cases)('password: $params.password', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const compareSpy = jest.spyOn(PasswordEncipher.prototype, 'comparesPassword')

        await resolver.equalizeVerificationDuration(params)

        expect(compareSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#createRefreshTokenCookieClerk()', () => {
    describe('should build a cookie clerk of the request it is handed', () => {
      const cases = [
        {
          params: {
            context: /** @type {*} */ ({
              label: 'a request that has just signed somebody in',
            }),
          },
        },
        {
          params: {
            context: /** @type {*} */ ({
              label: 'a request carrying no express response',
            }),
          },
        },
      ]

      test.each(cases)('context.label: $params.context.label', ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = resolver.createRefreshTokenCookieClerk(params)

        expect(actual)
          .toBeInstanceOf(RefreshTokenExpressCookieClerk)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#createRefreshTokenCookieClerk()', () => {
    describe('should hand the clerk the context of this request', () => {
      const cases = [
        {
          params: {
            context: /** @type {*} */ ({
              label: 'a request that has just signed somebody in',
            }),
          },
        },
        {
          params: {
            context: /** @type {*} */ ({
              label: 'a request carrying no express response',
            }),
          },
        },
      ]

      test.each(cases)('context.label: $params.context.label', ({
        params,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = resolver.createRefreshTokenCookieClerk(params)

        expect(actual)
          .toHaveProperty('context', params.context)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#formatResponse()', () => {
    /*
     * The member of staff's id and the access token, and nothing else. The whole returned object
     * is compared rather than two fields read off it, because a response that carried the refresh
     * token, its digest, the series or the address would break spec sections 10.1 and 7 at once —
     * and only a full comparison fails when something extra appears.
     */
    describe('should answer with the member of staff and their access token alone', () => {
      const cases = [
        {
          params: {
            staffMemberId: 10110001,
            accessTokenEntity: /** @type {*} */ ({
              accessToken: 'signed-in-access-token-0001',
              sessionKey: 'sign-in-formatted-series-0001',
            }),
          },
          expected: {
            staffMemberId: 10110001,
            accessToken: 'signed-in-access-token-0001',
          },
        },
        {
          params: {
            staffMemberId: 10110002,
            accessTokenEntity: /** @type {*} */ ({
              accessToken: 'signed-in-access-token-0002',
              sessionKey: 'sign-in-formatted-series-0002',
            }),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: 'signed-in-access-token-0002',
          },
        },
      ]

      test.each(cases)('staffMemberId: $params.staffMemberId', ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()

        const actual = resolver.formatResponse(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
