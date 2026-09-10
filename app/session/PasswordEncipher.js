import bcrypt from 'bcryptjs'

const PASSWORD_HASH_COST_FACTOR = 10

/**
 * Hashes a password, and answers whether a candidate matches a stored digest.
 *
 * **Why the compare goes through bcrypt and never through an equality.** The stored value is a
 * one-way hash carrying its own salt, so `storedDigest === candidate` could only ever be false.
 * Only bcrypt's own `compare` can re-derive the digest from the candidate, and it compares the
 * two in constant time, so a caller cannot learn how much of a digest it guessed from how long
 * the answer took.
 *
 * **Why `bcryptjs` and not native `bcrypt`.** The native package builds through node-gyp, which
 * puts a whole C toolchain back on the install path. `bcryptjs` is plain JavaScript with no
 * dependencies and produces the same `$2b$` digests, so a digest written by either verifies
 * against the other.
 *
 * **Why the cost factor is a constant and not a stored field.** bcrypt writes the factor it used
 * into the digest itself (`$2b$10$…`), and `compare` reads it back from there. Raising the
 * constant therefore changes only digests written afterwards, and every digest already stored
 * keeps verifying — no schema change and no migration to raise it.
 *
 * **Neither a password nor a digest is returned or logged anywhere but to the caller that asked
 * for it.** This class writes no log line at all, so there is no line for either to appear on.
 */
export default class PasswordEncipher {
  /**
   * Constructor.
   *
   * @param {PasswordEncipherParams} params - Parameters.
   */
  constructor ({
    costFactor,
  }) {
    this.costFactor = costFactor
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof PasswordEncipher ? X : never} T, X
   * @param {PasswordEncipherFactoryParams} [params] - Parameters.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    costFactor = PASSWORD_HASH_COST_FACTOR,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        costFactor,
      })
    )
  }

  /**
   * get: The bcrypt library.
   *
   * Reached through a getter rather than referenced directly in the methods below, so a test can
   * stub the library without reaching into the module registry.
   *
   * @returns {typeof bcrypt} The bcrypt library.
   */
  static get bcryptClient () {
    return bcrypt
  }

  /**
   * get: Class itself — reach own statics through the instance.
   *
   * @returns {typeof PasswordEncipher} The class.
   */
  get Ctor () {
    return /** @type {typeof PasswordEncipher} */ (this.constructor)
  }

  /**
   * Hash a password for storage.
   *
   * A salt is generated per call by bcrypt itself, so the same password hashes to a different
   * digest every time and two members of staff sharing a password do not share a digest.
   *
   * @param {{
   *   password: string
   * }} params - Parameters.
   * @returns {Promise<string>} The digest, salt and cost factor included.
   * @public
   */
  async hashPassword ({
    password,
  }) {
    return this.Ctor.bcryptClient.hash(password, this.costFactor)
  }

  /**
   * Answer whether a candidate password matches a stored digest.
   *
   * The cost factor of this instance is not consulted: bcrypt reads the factor and the salt out
   * of the digest handed in, which is what lets a digest written under an older factor keep
   * verifying.
   *
   * @param {{
   *   password: string
   *   passwordHash: string
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether the candidate password matches the digest.
   * @public
   */
  async comparesPassword ({
    password,
    passwordHash,
  }) {
    return this.Ctor.bcryptClient.compare(password, passwordHash)
  }
}

/**
 * @typedef {{
 *   costFactor: number
 * }} PasswordEncipherParams
 */

/**
 * @typedef {Partial<PasswordEncipherParams>} PasswordEncipherFactoryParams
 */
