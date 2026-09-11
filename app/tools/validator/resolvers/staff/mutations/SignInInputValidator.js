import BaseInputValidator from '../../../BaseInputValidator.js'

/*
 * What an email address has to look like to be worth a lookup.
 *
 * **Deliberately permissive, and deliberately not RFC 5322.** It asks for three things: something
 * before an `@`, exactly one `@`, and a domain of at least two dot-separated labels. It does not
 * try to decide which characters a local part may hold, does not know a list of valid top-level
 * domains, and does not reject an address that merely looks unusual — a `+` tag, a dot, a
 * subdomain and a reserved `.example` domain all pass, because every one of them appears among the
 * seeded staff addresses and a real member of staff may hold any of them.
 *
 * The asymmetry is on purpose. Letting a malformed address through costs a lookup that finds
 * nothing and refuses, which is what `signIn` does with an unknown address anyway; refusing a
 * well-formed one locks a member of staff out of the product with no way to tell why. So the rule
 * only has to catch what cannot be an address at all: an empty or blank string, a string with no
 * `@`, one with nothing after it, one with a bare hostname and no domain.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u

/*
 * The longest password bcrypt actually reads (Q32).
 *
 * bcrypt truncates its input at 72 bytes and says nothing about it, so a longer password has its
 * tail silently discarded: two passwords sharing their first 72 bytes produce the same digest and
 * verify interchangeably. Somebody who set a 100-character password from a password manager would
 * get in by typing only its first 72, and nothing would fail. Refusing the input is how that stops
 * being invisible.
 *
 * **A byte count, not a character count.** A multi-byte character makes the two differ — 25
 * Japanese characters are 75 bytes — so a cap measured in characters would let exactly the
 * passwords bcrypt truncates straight through.
 */
const MAX_PASSWORD_BYTE_SIZE = 72

/**
 * What `signIn`'s input must satisfy before the operation looks anybody up.
 *
 * The schema types both fields `String!`, so GraphQL has already refused a missing field and a
 * field of the wrong type before a resolver runs. What is left is what `String!` permits and the
 * operation should not, and it is **four distinct malformed values, so four rules**:
 *
 * 1. an empty address — `String!` permits `""`
 * 2. an address that is not shaped like one — refused as malformed rather than counted as a failed
 * attempt against an account that was never going to exist
 * 3. an empty password — as above
 * 4. a password past bcrypt's 72 bytes, whose tail would be read by nobody
 *
 * **Refusing malformed input with its own code reveals nothing about whose accounts exist.** Spec
 * section 10's requirement that refusals read identically is about `signIn`'s *lookup outcome* —
 * an address with no account against a correct address with the wrong password — and a caller
 * learning that their own request was malformed says nothing about either. So these four are not
 * merged, and the sameness that section 10 requires is the resolver's to keep among the codes it
 * answers *after* the input is trusted.
 *
 * The two presence rules are declared ahead of the two shape rules, because only the first failing
 * rule surfaces: an empty address reported as a malformed one would send somebody looking at what
 * they typed rather than at what they left out.
 *
 * @augments {BaseInputValidator<ErrorHash, SignInInput>}
 */
export default class SignInInputValidator extends BaseInputValidator {
  /**
   * Generate the rules this validator declares, in the order they are answered in.
   *
   * @override
   * @returns {Array<[() => boolean, RenchanGraphqlErrorCtor]>} One pair per rule.
   */
  generateValidationEntries () {
    return [
      [
        () => this.hasEmail(),
        this.errorHash.MissingEmail,
      ],
      [
        () => this.hasPassword(),
        this.errorHash.MissingPassword,
      ],
      [
        () => this.isValidEmailFormat(),
        this.errorHash.MalformedEmail,
      ],
      [
        () => this.isValidPasswordByteSize(),
        this.errorHash.TooLongPassword,
      ],
    ]
  }

  /**
   * Whether an address was presented at all.
   *
   * A blank address is not this rule's business: `"   "` is a string and it is not empty, so this
   * rule is satisfied and the format rule is what refuses it.
   *
   * @returns {boolean} true: a non-empty string was presented.
   */
  hasEmail () {
    const {
      email,
    } = this.input

    return typeof email === 'string'
      && email !== ''
  }

  /**
   * Whether a password was presented at all.
   *
   * **A blank password is accepted here, and by the byte rule too.** A space is a character a
   * password may legitimately be made of, and `signIn` does not set passwords — it compares what
   * was presented against a digest somebody else wrote. Refusing a password for its characters
   * would refuse one a member of staff actually holds.
   *
   * @returns {boolean} true: a non-empty string was presented.
   */
  hasPassword () {
    const {
      password,
    } = this.input

    return typeof password === 'string'
      && password !== ''
  }

  /**
   * Whether the presented address is shaped like an email address.
   *
   * A value that is not a string satisfies this rule rather than failing it. The presence rule
   * above owns whether a string was presented and is declared ahead of this one, so a non-string
   * is already refused as missing; judging it here as well would report one malformed value under
   * two rules, and reading a pattern against a value that is not a string means stringifying it
   * silently first.
   *
   * @returns {boolean} true: the address could be one.
   */
  isValidEmailFormat () {
    const {
      email,
    } = this.input

    if (typeof email !== 'string') {
      return true
    }

    return EMAIL_PATTERN.test(email)
  }

  /**
   * Whether the presented password is short enough for bcrypt to read all of it.
   *
   * Measured in UTF-8 bytes, which is what bcrypt counts. A value that is not a string satisfies
   * this rule for the reason the format rule does — and here the guard also keeps the promise that
   * a predicate never throws, since `Buffer.byteLength` raises on a value it cannot measure.
   *
   * @returns {boolean} true: the password fits in what bcrypt reads.
   */
  isValidPasswordByteSize () {
    const {
      password,
    } = this.input

    if (typeof password !== 'string') {
      return true
    }

    const passwordByteSize = Buffer.byteLength(password, 'utf8')

    return passwordByteSize <= MAX_PASSWORD_BYTE_SIZE
  }
}

/**
 * @typedef {{
 *   MissingEmail: RenchanGraphqlErrorCtor
 *   MissingPassword: RenchanGraphqlErrorCtor
 *   MalformedEmail: RenchanGraphqlErrorCtor
 *   TooLongPassword: RenchanGraphqlErrorCtor
 * }} ErrorHash
 */

/**
 * @typedef {import('../../../BaseInputValidator.js').RenchanGraphqlErrorCtor} RenchanGraphqlErrorCtor
 */

/**
 * @typedef {server.graphql.staff.SignInInput} SignInInput
 */
