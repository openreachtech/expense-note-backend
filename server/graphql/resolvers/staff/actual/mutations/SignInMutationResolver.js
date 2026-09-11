import {
  BaseMutationResolver,
} from '@openreachtech/renchan'

import PasswordEncipher from '../../../../../../app/session/PasswordEncipher.js'
import SessionClerk from '../../../../../../app/session/SessionClerk.js'

import SignInFailureRateLimit from '../../../../../../app/tools/rateLimit/limits/SignInFailureRateLimit.js'

import SignInInputValidator from '../../../../../../app/tools/validator/resolvers/staff/mutations/SignInInputValidator.js'

import SignInAttempt from '../../../../../../sequelize/models/SignInAttempt.js'
import StaffMemberAccessToken from '../../../../../../sequelize/models/StaffMemberAccessToken.js'
import StaffMemberPasswordHash from '../../../../../../sequelize/models/StaffMemberPasswordHash.js'
import StaffMemberRefreshToken from '../../../../../../sequelize/models/StaffMemberRefreshToken.js'
import StaffMemberSecret from '../../../../../../sequelize/models/StaffMemberSecret.js'

import RefreshTokenExpressCookieClerk from '../../../../contexts/tools/RefreshTokenExpressCookieClerk.js'

/*
 * The digest an address holding no account is verified against, so that both credential refusals
 * cost one bcrypt compare.
 *
 * **Why a real digest and not a skipped compare.** Spec section 10's first criterion requires an
 * address with no account and a correct address with the wrong password to be refused
 * *identically*, and a refusal is observable in more than its wording. Returning immediately
 * where no row was found, while a wrong password spends about sixty milliseconds inside bcrypt,
 * makes the two answers tell apart with a clock — which is how address enumeration is done in
 * practice, and it would hand somebody the list of who works here. Verifying against this digest
 * puts the same compare on both paths, so the two refusals take the same work as well as saying
 * the same thing.
 *
 * **What it cost to do that, stated rather than hidden.** Every attempt on an address with no
 * account now spends that compare. Section 7 sizes this product as an ordinary internal business
 * system for at most fifty members of staff, and section 7's own limit caps one address at ten
 * failures per fifteen minutes, so the work an unknown address can buy is bounded at ten compares
 * a quarter of an hour — under a second of processor time. The alternative was leaving a
 * measurable difference in place behind nothing but TLS, and checkpoint 8's audit would meet it.
 *
 * **Nothing can present the password this is the digest of.** It was produced from a randomly
 * generated string with `bcryptjs` at the same cost factor `PasswordEncipher` uses, and that
 * string was never recorded anywhere — not here, not in a test, not in a seeder. The compare's
 * answer is discarded in any case: the path this digest is reached on refuses unconditionally.
 */
const ABSENT_ACCOUNT_PASSWORD_DIGEST = '$2b$10$nKAqB2B5P/7VBeq7aasaS.TujNy6TJKw6CagB04Y4.sxhwfzeUUEy'

/**
 * Resolver of the `signIn` mutation.
 *
 * How a session begins: the presented address and password are checked against
 * `staff_member_secrets` and `staff_member_password_hashes`, and a member of staff who verifies is
 * issued the first token pair of a new series. The short-lived access token is returned in the
 * body and the refresh token is handed to the browser as an httpOnly cookie — **the refresh token
 * appears in no response body** (spec sections 10.1 and 9.7).
 *
 * **This operation authenticates by neither credential**, which is why it names itself in the
 * engine's `schemasToSkipFiltering`: section 7 reads "`signIn` uses neither: it is how a session
 * begins". So no authentication filter runs, `context.staffMember` is null as a matter of course,
 * and nothing here reads it. What the operation owes instead is section 7's limit — ten failed
 * attempts per fifteen minutes per address — and it is checked below.
 *
 * **One refusal for both credential outcomes.** An address with no account and a correct address
 * with the wrong password are refused as `InvalidCredentials` and nothing else, so neither the
 * code nor the message says which of the two it was (section 10's first criterion). A member of
 * staff who holds an address but no password digest lands on the same refusal, through the same
 * branch, rather than on a third one. The refusal is also made to *cost* the same on both paths —
 * see `ABSENT_ACCOUNT_PASSWORD_DIGEST` above.
 *
 * **A rate-limit refusal is the one refusal that legitimately differs**, and carries a code of its
 * own. Section 10 requires the two *credential* outcomes be indistinguishable from each other;
 * "too frequent" is not one of them, and a caller learning that they are rate-limited learns
 * nothing about whose accounts exist.
 *
 * **A successful sign-in records nothing.** `sign_in_attempts` holds failures alone (section 10.3),
 * which is the whole reason ten successful sign-ins inside one window are refused nothing.
 *
 * **No transaction of its own.** The two writes this operation can make are never both made:
 * a refused attempt inserts one row into `sign_in_attempts`, and a verified one saves a session
 * through `SessionClerk#saveSession()`, which is called without a transaction and self-resolves
 * its own. The cookie is part of no transaction either, so it is written after the session has
 * committed.
 *
 * Nothing here returns or logs a password, a password digest, a token or an address (section 7's
 * Personal-data row, and section 10's third criterion). This class writes no log line at all, so
 * there is no line for any of the four to appear on.
 *
 * @augments {BaseMutationResolver}
 */
export default class SignInMutationResolver extends BaseMutationResolver {
  /**
   * Constructor.
   *
   * @param {SignInMutationResolverParams} params - Parameters.
   */
  constructor ({
    passwordEncipher,
    sessionClerk,
    ...remainingParams
  }) {
    super(remainingParams)

    this.passwordEncipher = passwordEncipher
    this.sessionClerk = sessionClerk
  }

  /**
   * Factory method.
   *
   * The encipher and the session clerk are injected because both are side-effecting and the clerk
   * holds a nondeterministic token generator — the two things the convention says to hand in so a
   * test can replace them. The models are not injected: they are reached statically, through the
   * getters below.
   *
   * @template {X extends typeof SignInMutationResolver ? X : never} T, X
   * @override
   * @param {SignInMutationResolverFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    passwordEncipher = this.createPasswordEncipher(),
    sessionClerk = this.createSessionClerk(),
    errorCodeHash = this.errorCodeHash,
  } = {}) {
    const errorHash = this.buildErrorHash({
      errorCodeHash,
    })

    return /** @type {InstanceType<T>} */ (
      new this({
        passwordEncipher,
        sessionClerk,
        errorHash,
      })
    )
  }

  /**
   * get: Name of the operation this resolver serves.
   *
   * @override
   * @returns {string} Operation name.
   */
  static get schema () {
    return 'signIn'
  }

  /**
   * get: Error code hash.
   *
   * `M001` is this operation's stable id, fixed in `server/graphql/resolver-id-hash-staff.js`.
   *
   * The four `203` codes are the validator's, one per rule it declares, and the names are the ones
   * `SignInInputValidator` reads off `this.errorHash` — a name changed here refuses nothing and
   * throws on an undefined constructor instead. Four distinct malformed inputs get four distinct
   * codes deliberately: section 10's identical refusals are about what a *lookup* yielded, and a
   * caller learning that their own request was malformed says nothing about whose accounts exist.
   *
   * **`InvalidCredentials` is one code for two outcomes, and that is the criterion.** An address
   * with no account and a correct address with the wrong password both raise it, so the refusal
   * names neither. Splitting it in two would break section 10's first criterion outright.
   *
   * The remaining two are not credential outcomes and so carry codes of their own:
   * `TooFrequentSignIn` refuses a policy rather than a credential, and `FailedToStartSession` is
   * reachable only *after* a credential has verified, so neither tells a caller anything about
   * whose accounts exist.
   *
   * `TooFrequentSignIn` sits in `204` because the convention's three families — input, database,
   * external — have none for a policy refusal, and `204` is the nearest fit; inventing a fourth
   * family would diverge from an always-on rule silently. `205` stays external-only, and this
   * operation calls no external service.
   *
   * @override
   * @returns {Record<string, string>} Error code hash.
   */
  static get errorCodeHash () {
    return {
      ...super.errorCodeHash,

      // Invalid input errors — one per rule SignInInputValidator declares.
      MissingEmail: '203.M001.001',
      MissingPassword: '203.M001.002',
      MalformedEmail: '203.M001.003',
      TooLongPassword: '203.M001.004',

      // Database / state errors
      // One code for both credential outcomes: no account, and the wrong password.
      InvalidCredentials: '204.M001.001',
      FailedToStartSession: '204.M001.003',

      // Policy refusals
      // Section 7: ten failed attempts per fifteen minutes for one address.
      TooFrequentSignIn: '204.M001.002',
    }
  }

  /**
   * get: PasswordEncipher class — a seam so tests can substitute it.
   *
   * @returns {typeof PasswordEncipher} The class.
   */
  static get PasswordEncipherCtor () {
    return PasswordEncipher
  }

  /**
   * get: RefreshTokenExpressCookieClerk class — a seam so tests can substitute it.
   *
   * @returns {typeof RefreshTokenExpressCookieClerk} The class.
   */
  static get RefreshTokenExpressCookieClerkCtor () {
    return RefreshTokenExpressCookieClerk
  }

  /**
   * get: SessionClerk class — a seam so tests can substitute it.
   *
   * @returns {typeof SessionClerk} The class.
   */
  static get SessionClerkCtor () {
    return SessionClerk
  }

  /**
   * get: SignInFailureRateLimit class — a seam so tests can substitute it.
   *
   * @returns {typeof SignInFailureRateLimit} The class.
   */
  static get SignInFailureRateLimitCtor () {
    return SignInFailureRateLimit
  }

  /**
   * get: SignInInputValidator class — a seam so tests can substitute it.
   *
   * @returns {typeof SignInInputValidator} The class.
   */
  static get SignInInputValidatorCtor () {
    return SignInInputValidator
  }

  /**
   * get: StaffMemberAccessToken model — a seam so tests can substitute it.
   *
   * @returns {typeof StaffMemberAccessToken} The model.
   */
  static get StaffMemberAccessTokenCtor () {
    return StaffMemberAccessToken
  }

  /**
   * get: StaffMemberRefreshToken model — a seam so tests can substitute it.
   *
   * @returns {typeof StaffMemberRefreshToken} The model.
   */
  static get StaffMemberRefreshTokenCtor () {
    return StaffMemberRefreshToken
  }

  /**
   * Create the encipher a presented password is compared through.
   *
   * @returns {PasswordEncipher} Password encipher.
   */
  static createPasswordEncipher () {
    return this.PasswordEncipherCtor.create()
  }

  /**
   * Create the session clerk this operation issues a session through.
   *
   * Both token models are handed over, because the clerk is audience-neutral and saves the pair.
   *
   * @returns {SessionClerk} Session clerk over the staff token tables.
   */
  static createSessionClerk () {
    return this.SessionClerkCtor.create({
      AccessTokenModel: this.StaffMemberAccessTokenCtor,
      RefreshTokenModel: this.StaffMemberRefreshTokenCtor,
    })
  }

  /**
   * get: Class itself — reach own statics through the instance.
   *
   * @returns {typeof SignInMutationResolver} The class.
   */
  get Ctor () {
    return /** @type {typeof SignInMutationResolver} */ (this.constructor)
  }

  /**
   * get: SignInAttempt model.
   *
   * A model is reached through a getter rather than through the imported identifier, so a test
   * swaps the dependency by swapping the getter. No `Ctor` suffix and no factory method: this
   * class never instantiates the model — it writes a row through it.
   *
   * @returns {typeof SignInAttempt} The model.
   */
  get SignInAttemptModel () {
    return SignInAttempt
  }

  /**
   * get: StaffMemberPasswordHash model.
   *
   * @returns {typeof StaffMemberPasswordHash} The model.
   */
  get StaffMemberPasswordHashModel () {
    return StaffMemberPasswordHash
  }

  /**
   * get: StaffMemberSecret model.
   *
   * @returns {typeof StaffMemberSecret} The model.
   */
  get StaffMemberSecretModel () {
    return StaffMemberSecret
  }

  /**
   * Resolve the operation.
   *
   * **The order of the steps is the security-relevant part, so here is why each is where it is.**
   *
   * 1. *The input is validated first.* Everything after it reads a value the validator has already
   * judged, and a malformed address therefore never reaches step 2 — so garbage cannot consume
   * anybody's attempt budget, and an address nobody could hold never lands a row in
   * `sign_in_attempts`.
   * 2. *The rate limit is checked before anything is looked up.* The limit is keyed on the address,
   * which arrives in the input, so nothing has to be read before it can be asked — and a locked
   * out address should not buy a credential read and a sixty-millisecond bcrypt compare on its
   * way to being refused. A limit that is cheaper to enforce than to evade is the only kind
   * worth having. The limit itself is one indexed `COUNT`, which is the cheapest step here.
   * 3. *The address is looked up, then the digest.* The address is normalized first, by the same
   * function `staff_member_secrets` stores it through — an unnormalized lookup finds nothing,
   * and every account would appear not to exist.
   * 4. *The password is verified through the encipher*, never by an equality, and the absent-account
   * path spends the same compare (see `ABSENT_ACCOUNT_PASSWORD_DIGEST`).
   * 5. *A failure records one row, and only a failure.* A successful sign-in writes nothing to
   * `sign_in_attempts` (section 7: "A successful sign-in counts for nothing"), which is what
   * makes ten successful sign-ins inside one window cost nothing.
   * 6. *The session is issued, the cookie written, the access token returned.*
   *
   * @override
   * @param {GraphqlType.ResolverInput<{
   *   input: server.graphql.staff.SignInInput
   * }>} params - Parameters.
   * @returns {Promise<server.graphql.staff.SignInResult>} The member of staff who signed in, and their access token.
   * @throws {GraphqlType.Error} The input is malformed, the credential does not verify, the address has failed too often, or the session could not be started.
   * @public
   */
  async resolve ({
    variables: {
      input,
    },
    context,
  }) {
    const validationError = this.validateInput({
      input,
    })

    if (validationError) {
      throw validationError
    }

    const hasFailedTooOften = await this.hasReachedSignInFailureLimit({
      email: input.email,
      pointsAt: context.now,
    })

    if (hasFailedTooOften) {
      throw this.errorHash.TooFrequentSignIn.create()
    }

    const secretEntity = await this.findStaffMemberSecret({
      email: input.email,
    })

    const passwordHashEntity = await this.findPasswordHashOfSecret({
      secretEntity,
    })

    const verifiesPassword = await this.verifiesPresentedPassword({
      password: input.password,
      passwordHashEntity,
    })

    if (!verifiesPassword) {
      // Returned, not awaited: `no-restricted-syntax` matches an `await` anywhere inside an
      // `if`, body included, despite its message naming the condition (Q17). The rejection
      // propagates through this async method either way.
      return this.refuseRejectedPassword({
        email: input.email,
        attemptedAt: context.now,
      })
    }

    // Read off the digest row rather than off the address row, because the digest was found *by*
    // the address row's foreign key — the two carry the same value — and the digest row is the one
    // the step above has just proved to be there.
    const staffMemberId = passwordHashEntity.StaffMemberId

    const savingResult = await this.saveSession({
      staffMemberId,
      now: context.now,
    })

    if (savingResult.hasError()) {
      throw this.errorHash.FailedToStartSession.create()
    }

    const {
      credentialPair,
    } = savingResult

    const cookieClerk = this.createRefreshTokenCookieClerk({
      context,
    })

    cookieClerk.saveRefreshTokenCookie({
      refreshToken: credentialPair.refreshToken,
    })

    return this.formatResponse({
      staffMemberId,
      accessTokenEntity: credentialPair.accessTokenEntity,
    })
  }

  /**
   * Validate the input against every rule `SignInInputValidator` declares.
   *
   * The validator returns the error rather than throwing it, so the `throw` of this operation sits
   * in one place beside every other reason it refuses.
   *
   * @param {{
   *   input: server.graphql.staff.SignInInput
   * }} params - Parameters.
   * @returns {import('@openreachtech/renchan').RenchanGraphqlError | null} The error of the first rule the input fails. null: the input satisfies every rule.
   */
  validateInput ({
    input,
  }) {
    const inputValidator = this.createInputValidator({
      input,
    })

    return inputValidator.validateInput()
  }

  /**
   * Create the validator holding this operation's input rules.
   *
   * The resolver's own `errorHash` is handed over, which is what makes each rule refuse with this
   * resolver's `203.M001.*` code rather than with an error of the validator's own.
   *
   * @param {{
   *   input: server.graphql.staff.SignInInput
   * }} params - Parameters.
   * @returns {SignInInputValidator} Input validator over this request's input.
   */
  createInputValidator ({
    input,
  }) {
    return this.Ctor.SignInInputValidatorCtor.create({
      input,
      errorHash: this.errorHash,
    })
  }

  /**
   * Whether this address has already failed as often as fifteen minutes allow.
   *
   * The window and the count of ten are the limit's own (spec section 7), read from it rather than
   * restated here, and so is the normalization of the address it counts by.
   *
   * @param {{
   *   email: string
   *   pointsAt: Date
   * }} params - Parameters.
   * @returns {Promise<boolean>} true: this address may fail no further inside the window.
   */
  async hasReachedSignInFailureLimit ({
    email,
    pointsAt,
  }) {
    const rateLimit = this.createSignInFailureRateLimit({
      pointsAt,
    })

    return rateLimit.hasReachedMaxEventCount({
      key: email,
    })
  }

  /**
   * Create the sign-in limit, ending its window at this request's own instant.
   *
   * @param {{
   *   pointsAt: Date
   * }} params - Parameters.
   * @returns {SignInFailureRateLimit} Sign-in failure rate limit.
   */
  createSignInFailureRateLimit ({
    pointsAt,
  }) {
    return this.Ctor.SignInFailureRateLimitCtor.create({
      pointsAt,
    })
  }

  /**
   * Find the current sign-in address row a presented address belongs to.
   *
   * **The address is normalized before the query, and that is load-bearing.**
   * `StaffMemberSecret` normalizes on the way in through three write hooks, and a hook cannot
   * normalize a read — so a lookup on the address exactly as typed would match against a value no
   * row holds, and every account whose holder capitalized a letter would appear not to exist. The
   * normalization is the model's own function, so the read and the write cannot come to disagree
   * about what one address is.
   *
   * One row at most: `email` carries a unique index (section 9.4).
   *
   * @param {{
   *   email: string
   * }} params - Parameters.
   * @returns {Promise<model.StaffMemberSecret | null>} Sign-in address row, or null when the address holds no account.
   */
  async findStaffMemberSecret ({
    email,
  }) {
    const normalizedEmail = this.StaffMemberSecretModel.generateNormalizedEmail({
      email,
    })

    return /** @type {*} */ (
      this.StaffMemberSecretModel.findOne({
        where: {
          email: normalizedEmail,
        },
      })
    )
  }

  /**
   * Find the password digest of the member of staff an address row belongs to.
   *
   * Answers null for an address that holds no account, rather than leaving the caller to ask
   * whether there is anybody to look a digest up for. Both nulls mean the same thing to the step
   * that follows — there is no digest to verify against — and that is exactly why the two
   * credential outcomes are refused identically.
   *
   * @param {{
   *   secretEntity: model.StaffMemberSecret | null
   * }} params - Parameters.
   * @returns {Promise<model.StaffMemberPasswordHash | null>} Password digest row, or null when there is none to find.
   */
  async findPasswordHashOfSecret ({
    secretEntity,
  }) {
    if (!secretEntity) {
      return null
    }

    return this.findStaffMemberPasswordHash({
      staffMemberId: secretEntity.StaffMemberId,
    })
  }

  /**
   * Find the current password digest of a member of staff.
   *
   * One row at most: `staff_member_password_hashes` is 1:1 with `staff_members` and its
   * `StaffMemberId` carries a unique index (section 9.5), so no ordering is needed to pick the
   * current digest. A superseded digest lives in the backup table and is not read here.
   *
   * @param {{
   *   staffMemberId: number
   * }} params - Parameters.
   * @returns {Promise<model.StaffMemberPasswordHash | null>} Password digest row, or null when the member of staff holds none.
   */
  async findStaffMemberPasswordHash ({
    staffMemberId,
  }) {
    return /** @type {*} */ (
      this.StaffMemberPasswordHashModel.findOne({
        where: {
          StaffMemberId: staffMemberId,
        },
      })
    )
  }

  /**
   * Whether the presented password matches the digest that was found for it.
   *
   * **Where there is no digest, a compare is still spent and the answer is still false.** The
   * absent-digest path covers both an address holding no account and a member of staff holding no
   * digest, and it goes through the placeholder digest so that refusing costs what verifying
   * costs — section 10's first criterion, read as covering timing and not only wording. The
   * answer of that compare is discarded rather than returned: this path refuses unconditionally,
   * and there is no member of staff to sign in even if some password did match.
   *
   * The compare itself is the model's, which runs it through the encipher and never through an
   * equality.
   *
   * @param {{
   *   password: string
   *   passwordHashEntity: model.StaffMemberPasswordHash | null
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether the presented password verifies.
   */
  async verifiesPresentedPassword ({
    password,
    passwordHashEntity,
  }) {
    if (!passwordHashEntity) {
      // Returned, not awaited, for the reason recorded at `refuseRejectedPassword` (Q17).
      return this.refuseAbsentDigest({
        password,
      })
    }

    return passwordHashEntity.verifiesPassword({
      password,
      passwordEncipher: this.passwordEncipher,
    })
  }

  /**
   * Spend a compare against a stand-in digest, then answer that nothing verified.
   *
   * An address holding no digest must cost what a wrong password costs, or the two refusals
   * section 10 requires to be identical would differ by a measurable ~60ms — which is how an
   * address list gets enumerated. The compare's answer is discarded; this method always answers
   * false.
   *
   * Split from its caller so the `await` does not sit inside an `if` body (Q17).
   *
   * @param {{
   *   password: string
   * }} params - Parameters.
   * @returns {Promise<boolean>} Always false.
   */
  async refuseAbsentDigest ({
    password,
  }) {
    await this.equalizeVerificationDuration({
      password,
    })

    return false
  }

  /**
   * Spend on an address with no digest the work verifying one would have cost.
   *
   * One bcrypt compare against `ABSENT_ACCOUNT_PASSWORD_DIGEST`, whose result is deliberately
   * unused: what is wanted is the time, so that the two refusals of section 10's first criterion
   * cannot be told apart by a clock.
   *
   * @param {{
   *   password: string
   * }} params - Parameters.
   * @returns {Promise<void>} Nothing — the compare's answer is not an answer to anything.
   */
  async equalizeVerificationDuration ({
    password,
  }) {
    await this.passwordEncipher.comparesPassword({
      password,
      passwordHash: ABSENT_ACCOUNT_PASSWORD_DIGEST,
    })
  }

  /**
   * Record the failed attempt and refuse, which are the two consequences of a rejected password.
   *
   * Both belong together: section 7 counts a failed attempt, and section 10 requires the refusal.
   * Holding them in one method is also what keeps the `await` out of `resolve()`'s `if` body —
   * `no-restricted-syntax` matches an `await` anywhere inside an `if` statement, its body
   * included, though the message names only the condition (Q17). The caller returns this without
   * awaiting it; the rejection propagates either way.
   *
   * **Always throws.** It answers nothing.
   *
   * @param {{
   *   email: string
   *   attemptedAt: Date
   * }} params - Parameters.
   * @returns {Promise<never>} Never resolves.
   */
  async refuseRejectedPassword ({
    email,
    attemptedAt,
  }) {
    await this.recordSignInFailure({
      email,
      attemptedAt,
    })

    throw this.errorHash.InvalidCredentials.create()
  }

  /**
   * Record one failed sign-in attempt, for section 7's limit to count.
   *
   * The address is passed as presented: `SignInAttempt` normalizes it on the way in, through
   * `StaffMemberSecret`'s own function, so the row lands under the value the count reads.
   *
   * **Only a failure reaches this method.** A successful sign-in records nothing (section 7), and
   * that is what makes section 10's "ten successful sign-ins in that window are refused nothing"
   * true — there is no successful attempt in the table for the eleventh call to be refused over.
   *
   * @param {{
   *   email: string
   *   attemptedAt: Date
   * }} params - Parameters.
   * @returns {Promise<model.SignInAttempt>} The recorded attempt.
   */
  async recordSignInFailure ({
    email,
    attemptedAt,
  }) {
    return /** @type {*} */ (
      this.SignInAttemptModel.create({
        email,
        attemptedAt,
      })
    )
  }

  /**
   * Start a session for a member of staff who verified — the first token pair of a new series.
   *
   * Called without a transaction, so the clerk self-resolves one: the session is the whole write
   * of this path. Reports rather than throws; the outcome is read off the returned result.
   *
   * @param {{
   *   staffMemberId: number
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<SavingSessionResult>} The error (null on success) and the saved pair.
   */
  async saveSession ({
    staffMemberId,
    now,
  }) {
    return this.sessionClerk.saveSession({
      userId: staffMemberId,
      now,
    })
  }

  /**
   * Create the clerk this request's refresh-token cookie is written through.
   *
   * Built from the context rather than injected: the cookie belongs to the request, and only the
   * three session operations may touch it.
   *
   * @param {{
   *   context: StaffGraphqlContext
   * }} params - Parameters.
   * @returns {RefreshTokenExpressCookieClerk} Cookie clerk of this request.
   */
  createRefreshTokenCookieClerk ({
    context,
  }) {
    return this.Ctor.RefreshTokenExpressCookieClerkCtor.create({
      context,
    })
  }

  /**
   * Format the response — who signed in, and the access token they signed in with.
   *
   * **The refresh token is not here and never will be**: it reaches the browser as an httpOnly
   * cookie alone (spec sections 10.1 and 9.7). Neither is the address, the password or its digest.
   *
   * @param {{
   *   staffMemberId: number
   *   accessTokenEntity: import('../../../../../../app/session/SessionClerk.js').AccessTokenEntity
   * }} params - Parameters.
   * @returns {server.graphql.staff.SignInResult} The member of staff who signed in, and their access token.
   */
  formatResponse ({
    staffMemberId,
    accessTokenEntity,
  }) {
    const { accessToken } = accessTokenEntity

    return {
      staffMemberId,
      accessToken,
    }
  }
}

/**
 * @typedef {import('../../../../contexts/StaffGraphqlContext.js').default} StaffGraphqlContext
 */

/**
 * @typedef {import('../../../../../../app/session/SavingSessionResult.js').default} SavingSessionResult
 */

/**
 * @typedef {{
 *   passwordEncipher: PasswordEncipher
 *   sessionClerk: SessionClerk
 *   errorHash: Record<string, typeof import('@openreachtech/renchan').RenchanGraphqlError>
 * }} SignInMutationResolverParams
 */

/**
 * @typedef {{
 *   passwordEncipher?: PasswordEncipher
 *   sessionClerk?: SessionClerk
 *   errorCodeHash?: Record<string, string>
 * }} SignInMutationResolverFactoryParams
 */
