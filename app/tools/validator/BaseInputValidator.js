/**
 * What one operation's input must satisfy before the operation trusts it, written as a list of
 * rules rather than as a procedure.
 *
 * A subclass declares nothing but its rules: `generateValidationEntries()` answers with one
 * `[predicate, error]` pair per rule, and this class runs them. A rule is therefore a small
 * boolean method reading `this.input`, and refusing is returning `false` — **a predicate never
 * throws**, and never reaches for the error it would raise. That keeps a rule readable on its own
 * and testable without the operation it guards.
 *
 * **The declared order is the answer's order, because only the first failing rule surfaces.** So
 * the rules that establish a field is there at all are declared ahead of the rules that read its
 * shape: a missing address would otherwise be reported as a malformed one.
 *
 * **`validateInput()` returns the error; it does not throw it.** The caller — a resolver — decides
 * what to do with it, which is what lets the resolver's own `throw` sit in one place next to every
 * other reason it refuses. The error arrives already created, so the caller never has to know that
 * an entry carried a class rather than an instance.
 *
 * @template {Record<string, RenchanGraphqlErrorCtor>} E
 * @template I
 * @abstract
 */
export default class BaseInputValidator {
  /**
   * Constructor.
   *
   * @param {{
   *   input: I
   *   errorHash: E
   * }} params - Parameters.
   */
  constructor ({
    input,
    errorHash,
  }) {
    this.input = input
    this.errorHash = errorHash
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof BaseInputValidator ? X : never} T, X
   * @template {Record<string, RenchanGraphqlErrorCtor>} E
   * @template I
   * @param {{
   *   input: I
   *   errorHash: E
   * }} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    input,
    errorHash,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        input,
        errorHash,
      })
    )
  }

  /**
   * Validate the input against every rule this validator declares.
   *
   * @returns {import('@openreachtech/renchan').RenchanGraphqlError | null} The error of the first
   * rule the input fails, already created. null: the input satisfies every rule.
   * @public
   */
  validateInput () {
    const validationEntries = this.generateValidationEntries()

    const failedEntry = validationEntries
      .find(([isValid]) => !isValid())

    if (!failedEntry) {
      return null
    }

    const [, FailedErrorCtor] = failedEntry

    return FailedErrorCtor.create()
  }

  /**
   * Generate the rules this validator declares, in the order they are answered in.
   *
   * @abstract
   * @returns {Array<[() => boolean, RenchanGraphqlErrorCtor]>} One pair per rule: the predicate
   * answering whether the input satisfies it, and the error refusing the input when it does not.
   * @throws {Error} A subclass did not declare its rules.
   */
  generateValidationEntries () {
    throw new Error(`${this.constructor.name}#generateValidationEntries() must be inherited`)
  }
}

/**
 * @typedef {typeof import('@openreachtech/renchan').RenchanGraphqlError} RenchanGraphqlErrorCtor
 */
