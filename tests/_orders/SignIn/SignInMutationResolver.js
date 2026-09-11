import PasswordEncipher from '../../../app/session/PasswordEncipher.js'
import SessionClerk from '../../../app/session/SessionClerk.js'

import SignInFailureRateLimit from '../../../app/tools/rateLimit/limits/SignInFailureRateLimit.js'

import SignInAttempt from '../../../sequelize/models/SignInAttempt.js'

import SignInMutationResolver from '../../../server/graphql/resolvers/staff/actual/mutations/SignInMutationResolver.js'

/*
 * `#resolve()` and `#recordSignInFailure()` — the whole operation, against the real tables.
 *
 * The members of staff are the seeded ones
 * (`sequelize/seeders/development/20260910120001-000001-staff_members.cjs` and the two credential
 * seeders beside it), and **the plaintext beside each seeded digest is recorded in
 * `sequelize/seeders/development/20260910120003-000003-staff_member_password_hashes.cjs`** — that
 * pairing is what lets a test sign somebody in at all, since section 4 rules a sign-up operation
 * out of scope and no code path can issue a password.
 *
 * **No token row is given an explicit id**, exactly as the sibling
 * `tests/_orders/RenewAccessTokenMutationResolver/` explains: every successful sign-in inserts an
 * access token and a refresh token whose ids the database assigns as `max(id) + 1`, so an
 * explicit id written above that maximum is the next auto-increment value and the following
 * explicit insert would collide with a row this very file minted. Nothing here needs one — a
 * session is read back through the clerk, by the token it handed out.
 *
 * **The `sign_in_attempts` rows this file arranges do carry explicit ids, from `#sign-in`'s
 * allocated prefix `101`: the block `10100601`–`10100699`**, which no other file has taken. They
 * are all inserted by the last two describes, after every describe whose sign-in records an
 * attempt of its own — so an auto-assigned id can never land on one of them.
 *
 * **Every describe uses its own address, its own instant, or both.** Section 7's limit counts
 * failures for one address inside the fifteen minutes before the instant asked about, so two
 * describes sharing an address *and* an hour would count each other's failures. Where the
 * addresses are shared the dates are days apart.
 *
 * **Every describe whose sign-in succeeds hands its context a response to write a cookie to.**
 * Half of a session is the refresh token, and it reaches its holder as a cookie and nowhere else,
 * so `signIn` refuses to mint a pair it cannot deliver — the cookie write is otherwise a silent
 * no-op and the refresh row would be left unpresentable and unrevokable. Where a describe's
 * sign-in is refused before the mint, the response stays null, which costs those describes
 * nothing: what they are about happens earlier. The last describe is the one that asks what
 * happens when there is no response at all.
 *
 * The refusals are asserted against **anchored** patterns rather than the code as a substring:
 * section 10's first criterion requires the two credential refusals to reveal which of the two
 * they were in neither, and a message that appended the state would still satisfy a substring
 * match.
 */

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **The mixed-case case is not decoration.** `staff_member_secrets` stores an address lower
     * cased through write hooks a read cannot reach, so the lookup has to normalize what was
     * presented or it matches nothing — and every account whose holder capitalizes a letter would
     * appear not to exist. The `+` tag and the subdomain in the other two cases survive the
     * normalization unchanged, which is why the seeder carries addresses holding them.
     */
    describe('should sign a seeded member of staff in and hand back an access token', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'haruka.arai@expense-note.example',
              password: 'haruka-monday-8401',
            },
            presentedAt: new Date('2026-09-11T09:00:00.000Z'),
          },
          expected: {
            staffMemberId: 10110001,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'Rin.Takahashi@Expense-Note.Example',
              password: 'rin-friday-7052',
            },
            presentedAt: new Date('2026-09-11T10:00:00.000Z'),
          },
          expected: {
            staffMemberId: 10110005,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'YUUTO.KIRISHIMA+NOTES@EXPENSE-NOTE.EXAMPLE',
              password: 'yuuto-saturday-4165',
            },
            presentedAt: new Date('2026-09-11T10:30:00.000Z'),
          },
          expected: {
            staffMemberId: 10110006,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'Nanami.Doi@Sub.Expense-Note.Example',
              password: 'nanami-sunday-9376',
            },
            presentedAt: new Date('2026-09-11T10:45:00.000Z'),
          },
          expected: {
            staffMemberId: 10110007,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
      ]

      test.each(cases)('input.email: $params.input.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: {
            cookie: () => null,
          },
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = await resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The refresh token reaches the browser as an httpOnly cookie and appears in no response body
     * (spec sections 10.1 and 9.7), so the response is compared in full — a refresh token that
     * leaked into it would fail the first assertion — and the cookie is asserted by shape, since
     * the token is minted inside the save.
     */
    describe('should hand the refresh token to the browser as an httpOnly cookie', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'mio.fukuda@expense-note.example',
              password: 'mio-wednesday-5714',
            },
            presentedAt: new Date('2026-09-11T11:00:00.000Z'),
          },
          expected: {
            staffMemberId: 10110003,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'aoi.tsuchiya@expense-note.example',
              password: 'aoi-february-8130',
            },
            presentedAt: new Date('2026-09-11T11:30:00.000Z'),
          },
          expected: {
            staffMemberId: 10110009,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
      ]

      test.each(cases)('input.email: $params.input.email', async ({
        params,
        expected,
      }) => {
        const cookieSpy = jest.fn()
        const resolver = SignInMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: {
            cookie: cookieSpy,
          },
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = await resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })

        expect(actual)
          .toEqual(expected)
        expect(cookieSpy)
          .toHaveBeenCalledWith(
            'staff_refresh_token',
            expect.stringMatching(/^[0-9a-f]{64}$/u),
            {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              path: '/graphql-staff',
              maxAge: 1209600000,
            }
          )
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * An address no seeded row holds — one on the seeded domain and one on another company's, so
     * the lookup fails on the address rather than on the domain.
     */
    describe('should refuse an address holding no account', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'nobody-0001@expense-note.example',
              password: 'haruka-monday-8401',
            },
            presentedAt: new Date('2026-09-11T12:00:00.000Z'),
          },
          expected: /^204\.M001\.001$/u,
        },
        {
          params: {
            input: {
              email: 'haruka.arai@another-company.example',
              password: 'haruka-monday-8401',
            },
            presentedAt: new Date('2026-09-11T12:30:00.000Z'),
          },
          expected: /^204\.M001\.001$/u,
        },
      ]

      test.each(cases)('input.email: $params.input.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = () => resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The seeded member of staff who holds a sign-in address and **no password digest**
     * (10110011) — a real half-issued account, since section 4 has accounts issued by hand with
     * no operator mechanism. It is refused through the same branch, with the same code and the
     * same message, as an address nobody holds at all: there is no third outcome to tell apart
     * from the two section 10 requires to be identical.
     */
    describe('should refuse a member of staff holding no password digest', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'sakura.umeda@expense-note.example',
              password: 'sakura-whatever-0000',
            },
            presentedAt: new Date('2026-09-11T12:45:00.000Z'),
          },
          expected: /^204\.M001\.001$/u,
        },
        {
          params: {
            input: {
              email: 'Sakura.Umeda@Expense-Note.Example',
              password: 'kaede-april-6914',
            },
            presentedAt: new Date('2026-09-11T12:50:00.000Z'),
          },
          expected: /^204\.M001\.001$/u,
        },
      ]

      test.each(cases)('input.email: $params.input.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = () => resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * A correct address with the wrong password. The second case presents another seeded member of
     * staff's real password, which is the most interesting wrong one there is: no two seeded
     * members of staff share a password, so it verifies against somebody — just not against this
     * address.
     */
    describe('should refuse a correct address with the wrong password', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'souta.nishimura@expense-note.example',
              password: 'souta-thursday-6239',
            },
            presentedAt: new Date('2026-09-11T13:00:00.000Z'),
          },
          expected: /^204\.M001\.001$/u,
        },
        {
          params: {
            input: {
              email: 'souta.nishimura@expense-note.example',
              password: 'haruka-monday-8401',
            },
            presentedAt: new Date('2026-09-11T13:05:00.000Z'),
          },
          expected: /^204\.M001\.001$/u,
        },
        {
          params: {
            input: {
              email: 'souta.nishimura@expense-note.example',
              password: ' souta-thursday-6238',
            },
            presentedAt: new Date('2026-09-11T13:10:00.000Z'),
          },
          expected: /^204\.M001\.001$/u,
        },
      ]

      test.each(cases)('input.password: $params.input.password', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = () => resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Spec section 10's first acceptance criterion, asserted as the criterion states it.**
     *
     * "An address with no account and a correct address with the wrong password are refused
     * identically, and neither refusal says which of the two it was." Refusing each against a
     * literal in its own test would not establish that — two tests can pass while the two codes
     * differ from each other. So both refusals are arranged here and the one is compared **to the
     * other**, which fails the moment they diverge in code or in wording. The anchored pattern
     * beside it is what keeps them from agreeing on a message that names the state.
     *
     * The two arranged refusals are the input to the comparison under test, which is why they sit
     * in the Arrange phase; the Act is the second refusal's message and the Assert is the
     * comparison.
     *
     * The addresses differ between the two so that neither refusal counts against the other's
     * fifteen minutes.
     */
    describe('should refuse an unknown address and a wrong password identically', () => {
      const cases = [
        {
          params: {
            absentAccountInput: {
              email: 'nobody-0002@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            wrongPasswordInput: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3928',
            },
            presentedAt: new Date('2026-09-11T14:00:00.000Z'),
          },
          expected: /^204\.M001\.001$/u,
        },
        {
          params: {
            absentAccountInput: {
              email: 'nobody-0003@expense-note.example',
              password: 'riku-january-2589',
            },
            wrongPasswordInput: {
              email: 'riku.hasegawa@expense-note.example',
              password: 'riku-january-2580',
            },
            presentedAt: new Date('2026-09-11T14:30:00.000Z'),
          },
          expected: /^204\.M001\.001$/u,
        },
      ]

      test.each(cases)('absentAccountInput.email: $params.absentAccountInput.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })
        const absentAccountRefusal = await resolver
          .resolve({
            variables: {
              input: params.absentAccountInput,
            },
            context,
          })
          .catch(refusal => refusal.message)

        const actual = await resolver
          .resolve({
            variables: {
              input: params.wrongPasswordInput,
            },
            context,
          })
          .catch(refusal => refusal.message)

        expect(actual)
          .toBe(absentAccountRefusal)
        expect(actual)
          .toMatch(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * A failed attempt lands one row in `sign_in_attempts` (section 10.3), which is what section
     * 7's limit counts. The count is taken through `SignInFailureRateLimit#countRecentEvents()` —
     * a real domain read, normalization included — rather than by querying the table in the test
     * body.
     *
     * The refused sign-in is the Arrange: it is what the count under test is a count *of*.
     */
    describe('should record one attempt for a refused sign-in', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'recorded-failure-0001@expense-note.example',
              password: 'a password nobody holds',
            },
            presentedAt: new Date('2026-09-11T15:00:00.000Z'),
          },
          expected: 1,
        },
        {
          params: {
            // Presented with a capital, and counted under its lower-cased form: the table
            // normalizes on the way in, and the count normalizes before it asks.
            input: {
              email: 'Recorded.Failure-0002@Expense-Note.Example',
              password: 'another password nobody holds',
            },
            presentedAt: new Date('2026-09-11T15:30:00.000Z'),
          },
          expected: 1,
        },
      ]

      test.each(cases)('input.email: $params.input.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })
        const refusedSignIn = () => resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })
        await expect(refusedSignIn)
          .rejects
          .toThrow(/^204\.M001\.001$/u)
        const rateLimit = SignInFailureRateLimit.create({
          pointsAt: params.presentedAt,
        })

        const actual = await rateLimit.countRecentEvents({
          key: params.input.email,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **A successful sign-in records nothing** (section 7: "A successful sign-in counts for
     * nothing"), and `sign_in_attempts` holding failures alone is what makes section 10's "ten
     * successful sign-ins in that window are refused nothing" true. The successful sign-in is the
     * Arrange; the count of what it left behind is the Act, and it is zero.
     *
     * These two members of staff have no failure anywhere in this file, and the instants are
     * theirs alone, so a row found here could only have come from the success.
     */
    describe('should record nothing for a successful sign-in', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'daiki.morishita@expense-note.example',
              password: 'daiki-march-4703',
            },
            presentedAt: new Date('2026-09-11T16:00:00.000Z'),
          },
          expected: 0,
        },
        {
          params: {
            input: {
              email: 'haruka.arai@expense-note.example',
              password: 'haruka-monday-8401',
            },
            presentedAt: new Date('2026-09-11T16:30:00.000Z'),
          },
          expected: 0,
        },
      ]

      test.each(cases)('input.email: $params.input.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: {
            cookie: () => null,
          },
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })
        await resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })
        const rateLimit = SignInFailureRateLimit.create({
          pointsAt: params.presentedAt,
        })

        const actual = await rateLimit.countRecentEvents({
          key: params.input.email,
        })

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Section 10's eighth criterion, third clause: "ten successful sign-ins in that window are
     * refused nothing."**
     *
     * Eleven cases rather than ten, and the eleventh is the one that catches a wrong
     * implementation. An implementation recording every attempt — successes included — would let
     * the first ten through anyway, because the tenth sees only nine rows; it is the eleventh
     * that meets a full window. So ten cases would pass against the very defect this criterion
     * exists to forbid.
     *
     * One sign-in per case, one minute apart, every one inside the fifteen minutes ending at the
     * last — and each case is titled by its own instant, which is the one input that differs.
     */
    describe('should refuse nothing to eleven successful sign-ins inside one window', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:00:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:01:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:02:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:03:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:04:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:05:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:06:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:07:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:08:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:09:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'kenji.ogawa@expense-note.example',
              password: 'kenji-tuesday-3927',
            },
            presentedAt: new Date('2026-09-30T09:10:00.000Z'),
          },
          expected: {
            staffMemberId: 10110002,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
      ]

      test.each(cases)('presentedAt: $params.presentedAt', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: {
            cookie: () => null,
          },
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = await resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * The session could not be started, which is **not** a credential outcome: it is reachable
     * only after a password has already verified, so it carries a code of its own and tells a
     * caller nothing about whose accounts exist.
     *
     * The clerk is steered rather than broken for real — a save that fails is not arrangeable from
     * seeded data — and the refusal it produces is what verifies the stub.
     */
    describe('should refuse a sign-in whose session could not be started', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'riku.hasegawa@expense-note.example',
              password: 'riku-january-2589',
            },
            presentedAt: new Date('2026-09-11T17:00:00.000Z'),
          },
          expected: /^204\.M001\.003$/u,
        },
        {
          params: {
            input: {
              email: 'mio.fukuda@expense-note.example',
              password: 'mio-wednesday-5714',
            },
            presentedAt: new Date('2026-09-11T17:30:00.000Z'),
          },
          expected: /^204\.M001\.003$/u,
        },
      ]

      test.each(cases)('input.email: $params.input.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        jest.spyOn(SessionClerk.prototype, 'saveSession')
          .mockResolvedValue(
            SessionClerk.createSavingSessionResult({
              error: new Error('a stand-in failure of the session save'),
            })
          )
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: {
            cookie: () => null,
          },
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = () => resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **The rate limit is consulted before the address is looked up and before the password is
     * compared**, and this is where that shows: the credentials presented below are *correct*, so
     * a resolver that checked the limit later would sign these two in. The refusal therefore
     * cannot come from anything but the limit.
     *
     * That placement is deliberate. A locked-out address should not buy a credential read and a
     * sixty-millisecond bcrypt compare on its way to being refused — a limit that costs more to
     * enforce than to evade is not worth having — and the limit needs nothing but the address,
     * which arrives in the input. A malformed input never reaches it either, because the validator
     * answers first, so garbage cannot spend anybody's budget.
     *
     * The ten (and twelve) failures are arranged **for real**, as rows in `sign_in_attempts`
     * inside the window, so the threshold stays the limit's own and the count stays a real query.
     */
    describe('should refuse the eleventh failed attempt on one address inside fifteen minutes', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'nanami.doi@sub.expense-note.example',
              password: 'nanami-sunday-9376',
            },
            // Exactly the ten the window allows; the sign-in below is the eleventh attempt.
            recordedFailures: [
              { id: 10100601, email: 'nanami.doi@sub.expense-note.example', attemptedAt: new Date('2026-09-20T09:01:00.000Z') },
              { id: 10100602, email: 'nanami.doi@sub.expense-note.example', attemptedAt: new Date('2026-09-20T09:02:00.000Z') },
              { id: 10100603, email: 'nanami.doi@sub.expense-note.example', attemptedAt: new Date('2026-09-20T09:03:00.000Z') },
              { id: 10100604, email: 'nanami.doi@sub.expense-note.example', attemptedAt: new Date('2026-09-20T09:04:00.000Z') },
              { id: 10100605, email: 'nanami.doi@sub.expense-note.example', attemptedAt: new Date('2026-09-20T09:05:00.000Z') },
              { id: 10100606, email: 'nanami.doi@sub.expense-note.example', attemptedAt: new Date('2026-09-20T09:06:00.000Z') },
              { id: 10100607, email: 'nanami.doi@sub.expense-note.example', attemptedAt: new Date('2026-09-20T09:07:00.000Z') },
              { id: 10100608, email: 'nanami.doi@sub.expense-note.example', attemptedAt: new Date('2026-09-20T09:08:00.000Z') },
              { id: 10100609, email: 'nanami.doi@sub.expense-note.example', attemptedAt: new Date('2026-09-20T09:09:00.000Z') },
              { id: 10100610, email: 'nanami.doi@sub.expense-note.example', attemptedAt: new Date('2026-09-20T09:10:00.000Z') },
            ],
            presentedAt: new Date('2026-09-20T09:12:00.000Z'),
          },
          expected: /^204\.M001\.002$/u,
        },
        {
          params: {
            input: {
              email: 'riku.hasegawa@expense-note.example',
              password: 'riku-january-2589',
            },
            // Well past the ten, and presented with capitals so the stored form is what is counted.
            recordedFailures: [
              { id: 10100621, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:00:00.000Z') },
              { id: 10100622, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:01:00.000Z') },
              { id: 10100623, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:02:00.000Z') },
              { id: 10100624, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:03:00.000Z') },
              { id: 10100625, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:04:00.000Z') },
              { id: 10100626, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:05:00.000Z') },
              { id: 10100627, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:06:00.000Z') },
              { id: 10100628, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:07:00.000Z') },
              { id: 10100629, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:08:00.000Z') },
              { id: 10100630, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:09:00.000Z') },
              { id: 10100631, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:10:00.000Z') },
              { id: 10100632, email: 'Riku.Hasegawa@Expense-Note.Example', attemptedAt: new Date('2026-09-21T09:11:00.000Z') },
            ],
            presentedAt: new Date('2026-09-21T09:12:00.000Z'),
          },
          expected: /^204\.M001\.002$/u,
        },
      ]

      test.each(cases)('input.email: $params.input.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const compareSpy = jest.spyOn(PasswordEncipher.prototype, 'comparesPassword')
        await SignInAttempt.bulkCreate(params.recordedFailures)
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: null,
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = () => resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
        expect(compareSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **Section 10's eighth criterion, second clause: "while a first attempt for a different
     * address in the same window is not."**
     *
     * The limit is keyed on the address (section 7 — keyed on the address rather than on the
     * caller's IP, because the staff sit behind one office address and an IP-keyed limit would let
     * one person's wrong password lock out everybody). So ten failures on one address are arranged
     * for real inside the window, and a different address signs in at the very end of that same
     * window and is refused nothing.
     */
    describe('should refuse nothing to another address inside a window one address has filled', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'daiki.morishita@expense-note.example',
              password: 'daiki-march-4703',
            },
            recordedFailures: [
              { id: 10100641, email: 'aoi.tsuchiya@expense-note.example', attemptedAt: new Date('2026-09-22T09:00:00.000Z') },
              { id: 10100642, email: 'aoi.tsuchiya@expense-note.example', attemptedAt: new Date('2026-09-22T09:01:00.000Z') },
              { id: 10100643, email: 'aoi.tsuchiya@expense-note.example', attemptedAt: new Date('2026-09-22T09:02:00.000Z') },
              { id: 10100644, email: 'aoi.tsuchiya@expense-note.example', attemptedAt: new Date('2026-09-22T09:03:00.000Z') },
              { id: 10100645, email: 'aoi.tsuchiya@expense-note.example', attemptedAt: new Date('2026-09-22T09:04:00.000Z') },
              { id: 10100646, email: 'aoi.tsuchiya@expense-note.example', attemptedAt: new Date('2026-09-22T09:05:00.000Z') },
              { id: 10100647, email: 'aoi.tsuchiya@expense-note.example', attemptedAt: new Date('2026-09-22T09:06:00.000Z') },
              { id: 10100648, email: 'aoi.tsuchiya@expense-note.example', attemptedAt: new Date('2026-09-22T09:07:00.000Z') },
              { id: 10100649, email: 'aoi.tsuchiya@expense-note.example', attemptedAt: new Date('2026-09-22T09:08:00.000Z') },
              { id: 10100650, email: 'aoi.tsuchiya@expense-note.example', attemptedAt: new Date('2026-09-22T09:09:00.000Z') },
            ],
            presentedAt: new Date('2026-09-22T09:10:00.000Z'),
          },
          expected: {
            staffMemberId: 10110010,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
        {
          params: {
            input: {
              email: 'souta.nishimura@expense-note.example',
              password: 'souta-thursday-6238',
            },
            recordedFailures: [
              { id: 10100661, email: 'crowded-address-0001@expense-note.example', attemptedAt: new Date('2026-09-23T09:00:00.000Z') },
              { id: 10100662, email: 'crowded-address-0001@expense-note.example', attemptedAt: new Date('2026-09-23T09:01:00.000Z') },
              { id: 10100663, email: 'crowded-address-0001@expense-note.example', attemptedAt: new Date('2026-09-23T09:02:00.000Z') },
              { id: 10100664, email: 'crowded-address-0001@expense-note.example', attemptedAt: new Date('2026-09-23T09:03:00.000Z') },
              { id: 10100665, email: 'crowded-address-0001@expense-note.example', attemptedAt: new Date('2026-09-23T09:04:00.000Z') },
              { id: 10100666, email: 'crowded-address-0001@expense-note.example', attemptedAt: new Date('2026-09-23T09:05:00.000Z') },
              { id: 10100667, email: 'crowded-address-0001@expense-note.example', attemptedAt: new Date('2026-09-23T09:06:00.000Z') },
              { id: 10100668, email: 'crowded-address-0001@expense-note.example', attemptedAt: new Date('2026-09-23T09:07:00.000Z') },
              { id: 10100669, email: 'crowded-address-0001@expense-note.example', attemptedAt: new Date('2026-09-23T09:08:00.000Z') },
              { id: 10100670, email: 'crowded-address-0001@expense-note.example', attemptedAt: new Date('2026-09-23T09:09:00.000Z') },
            ],
            presentedAt: new Date('2026-09-23T09:10:00.000Z'),
          },
          expected: {
            staffMemberId: 10110004,
            accessToken: expect.stringMatching(/^[0-9a-f]{64}$/u),
          },
        },
      ]

      test.each(cases)('input.email: $params.input.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        await SignInAttempt.bulkCreate(params.recordedFailures)
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: {
            cookie: () => null,
          },
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = await resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('SignInMutationResolver', () => {
  describe('#resolve()', () => {
    /*
     * **A session that cannot be delivered whole is refused rather than half-issued.**
     *
     * The engine's endpoint also carries a WebSocket channel — `GraphqlServerBuilder#setupServer()`
     * opens one for every audience, with no configuration flag, and that channel is the
     * framework's — and over it there is no express response. So
     * `BaseAppGraphqlContext#get:expressResponse` is null, and
     * `RefreshTokenExpressCookieClerk#saveRefreshTokenCookie()` writes through an optional call
     * that silently does nothing. A sign-in that minted first would verify the credential, commit
     * a token pair, throw the refresh half away and answer with a working access token — leaving a
     * refresh row nobody can present and `signOut` cannot revoke until it expires.
     *
     * The credentials here are **correct**: every rule passes, the window is empty, the password
     * verifies, and the refusal is the missing response and nothing else. Which is also what makes
     * this fail without the guard — the resolver would answer with a token pair.
     *
     * The pair is asserted not to have been committed, rather than looked for afterwards: the save
     * is what commits it, so a save that was never called is a pair that was never written. The
     * spy is not given a stub implementation, because a spy that is never called needs none.
     */
    describe('should refuse a sign-in it has no way to hand a refresh cookie to', () => {
      const cases = [
        {
          params: {
            input: {
              email: 'rin.takahashi@expense-note.example',
              password: 'rin-friday-7052',
            },
            presentedAt: new Date('2026-10-14T09:00:00.000Z'),
          },
          expected: /^204\.M001\.003$/u,
        },
        {
          params: {
            input: {
              email: 'riku.hasegawa@expense-note.example',
              password: 'riku-january-2589',
            },
            presentedAt: new Date('2026-10-14T10:00:00.000Z'),
          },
          expected: /^204\.M001\.003$/u,
        },
      ]

      test.each(cases)('input.email: $params.input.email', async ({
        params,
        expected,
      }) => {
        const resolver = SignInMutationResolver.create()
        const saveSessionSpy = jest.spyOn(SessionClerk.prototype, 'saveSession')
        const context = /** @type {*} */ ({
          now: params.presentedAt,
          expressResponse: null, // what a request over the WebSocket channel carries
          config: {
            graphqlEndpoint: '/graphql-staff',
            refreshTokenCookie: {
              name: 'staff_refresh_token',
              lifetimeDays: 14,
              secure: true,
              sameSite: 'lax',
              httpOnly: true,
            },
          },
        })

        const actual = () => resolver.resolve({
          variables: {
            input: params.input,
          },
          context,
        })

        await expect(actual)
          .rejects
          .toThrow(expected)
        expect(saveSessionSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})
