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
 * The longest address either table that stores one can hold.
 *
 * **191 is not a policy, it is the column.** `staff_member_secrets.email` is `varchar(191)`
 * (spec section 9.4) and `sign_in_attempts.email` is `varchar(191)` (section 10.3), so an address
 * longer than this has nowhere to go. Left unrefused it passed every rule below, was counted by
 * section 7's limit, spent the equalizing bcrypt compare, and was then written as a failed
 * attempt — where MariaDB in strict mode raises `Data too long`, which nothing on that path
 * catches, so the caller received the framework's `104.X000.001` instead of a refusal this
 * operation names. Under a permissive `sql_mode` it truncated instead, and two long addresses
 * differing only past their 191st character then shared one counted key.
 *
 * **A character count, not a byte count — and this is the opposite of the password rule below.**
 * `varchar(191)` in MySQL and MariaDB bounds *characters*, not bytes; the 191 itself comes from
 * `utf8mb4`'s four bytes a character against the 767-byte index prefix limit, and the server
 * applies it as a character count. So a 191-character address of multi-byte characters fits and
 * must not be refused. The password cap below counts bytes for an unrelated reason — bcrypt reads
 * 72 bytes of its input and no more — and the two must not be confused.
 *
 * Counted in code points rather than with `String#length`, because `String#length` counts UTF-16
 * code units: a character outside the basic multilingual plane counts twice there and once in the
 * database, so a length-based cap would refuse an address the column would have accepted.
 */
const MAX_EMAIL_CHARACTER_COUNT = 191

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
 * operation should not, and it is **five distinct malformed values, so five rules**:
 *
 * 1. an empty address — `String!` permits `""`
 * 2. an address that is not shaped like one — refused as malformed rather than counted as a failed
 * attempt against an account that was never going to exist
 * 3. an address longer than the 191 characters either table that stores one can hold
 * 4. an empty password — as above
 * 5. a password past bcrypt's 72 bytes, whose tail would be read by nobody
 *
 * **Refusing malformed input with its own code reveals nothing about whose accounts exist.** Spec
 * section 10's requirement that refusals read identically is about `signIn`'s *lookup outcome* —
 * an address with no account against a correct address with the wrong password — and a caller
 * learning that their own request was malformed says nothing about either. So these five are not
 * merged, and the sameness that section 10 requires is the resolver's to keep among the codes it
 * answers *after* the input is trusted.
 *
 * The two presence rules are declared ahead of the three shape rules, because only the first
 * failing rule surfaces: an empty address reported as a malformed one would send somebody looking
 * at what they typed rather than at what they left out.
 *
 * **Rules 2 and 3 refuse under one error, `MalformedEmail`, and that is a decision worth stating.**
 * Every other rule here carries a name of its own, and an over-long address would read better as a
 * `TooLongEmail` — but a validator may only refuse with a name the resolver's `errorCodeHash`
 * declares, since the base reads the error class off `this.errorHash` and a name that is not there
 * raises a `TypeError` instead of refusing. Adding that declaration is not this unit's to make.
 * Sharing the existing code costs a caller nothing — both are `203.M001.003`, an input refused
 * before anything was looked up — and `MalformedEmail` is true of an address that no table of this
 * product can hold. To split them later, declare `TooLongEmail: '203.M001.005'` in
 * `SignInMutationResolver.errorCodeHash` and point rule 3's entry at it; nothing else changes.
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
        () => this.isValidEmailCharacterCount(),
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
   * Whether the presented address is short enough for the tables that store one to hold it.
   *
   * Measured in code points, which is what `varchar(191)` counts — see
   * `MAX_EMAIL_CHARACTER_COUNT` for why that is characters here and bytes for the password. A
   * value that is not a string satisfies this rule for the reason the format rule above does: the
   * presence rule owns it and is declared first.
   *
   * @returns {boolean} true: the address fits in the column that has to hold it.
   */
  isValidEmailCharacterCount () {
    const {
      email,
    } = this.input

    if (typeof email !== 'string') {
      return true
    }

    const emailCharacterCount = Array.from(email).length

    return emailCharacterCount <= MAX_EMAIL_CHARACTER_COUNT
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
