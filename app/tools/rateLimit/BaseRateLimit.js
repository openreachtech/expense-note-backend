import {
  Op,
} from 'sequelize'

/**
 * A rate limit spec section 7 declares: how many counted events one key may accumulate inside one
 * moving window, and whether it already has.
 *
 * An **event** is one counted occurrence — a failed sign-in for one address, a token minted in one
 * series. A limit reads the table those rows already land in, so nothing here records anything:
 * the count is the rows, and the operation that writes them is the operation's own.
 *
 * A subclass states the five things a limit is made of, and nothing else: the model whose rows are
 * counted, the field the key matches, the field carrying the instant, the length of the window, and
 * the number of events the window allows. That keeps section 7's numbers in one file per limit
 * instead of at every call site.
 *
 * The count happens in SQL — `COUNT(*)` under a `WHERE` — never by loading rows and counting them
 * in this process. Section 7 caps the heaviest read at a few hundred rows, and that is not the
 * reason: a counter that reads rows to count them grows with the data it counts.
 *
 * `pointsAt` is the instant the window ends, held rather than read per call, so one limit answers
 * every question about one request from one clock.
 */
export default class BaseRateLimit {
  /**
   * Constructor.
   *
   * @param {BaseRateLimitParams} params - Parameters.
   */
  constructor ({
    pointsAt,
  }) {
    this.pointsAt = pointsAt
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof BaseRateLimit ? X : never} T, X
   * @param {BaseRateLimitFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    pointsAt = this.generateCurrentDateTime(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        pointsAt,
      })
    )
  }

  /**
   * Generate the instant a window ends when the caller states none.
   *
   * A request that already knows its own instant hands it in — a resolver has `requestedAt` — so
   * this stands in only where nothing upstream carries one.
   *
   * @returns {Date} The current instant.
   */
  static generateCurrentDateTime () {
    return new Date()
  }

  /**
   * get: Model whose rows this limit counts.
   *
   * @abstract
   * @returns {import('sequelize').ModelStatic<import('sequelize').Model>} Model declaration.
   * @throws {Error} A subclass did not state the model.
   */
  get EventModel () {
    throw new Error(`${this.constructor.name}#get:EventModel must be inherited`)
  }

  /**
   * get: Name of the attribute the counted key matches.
   *
   * @abstract
   * @returns {string} Attribute name.
   * @throws {Error} A subclass did not state the attribute.
   */
  get keyFieldName () {
    throw new Error(`${this.constructor.name}#get:keyFieldName must be inherited`)
  }

  /**
   * get: Name of the attribute carrying the instant a counted event happened.
   *
   * @abstract
   * @returns {string} Attribute name.
   * @throws {Error} A subclass did not state the attribute.
   */
  get timestampFieldName () {
    throw new Error(`${this.constructor.name}#get:timestampFieldName must be inherited`)
  }

  /**
   * get: Length of the window, in milliseconds.
   *
   * @abstract
   * @returns {number} Milliseconds.
   * @throws {Error} A subclass did not state the window.
   */
  get windowMilliseconds () {
    throw new Error(`${this.constructor.name}#get:windowMilliseconds must be inherited`)
  }

  /**
   * get: Number of events one key may accumulate inside one window.
   *
   * @abstract
   * @returns {number} Number of events.
   * @throws {Error} A subclass did not state the threshold.
   */
  get maxEventCount () {
    throw new Error(`${this.constructor.name}#get:maxEventCount must be inherited`)
  }

  /**
   * get: Sequelize's operators, as the module publishes them.
   *
   * Behind a getter so a subclass or a test can substitute them, and so this class names its one
   * dependency on the ORM in one place.
   *
   * @returns {typeof Op} Sequelize operators.
   */
  get sequelizeOperators () {
    return Op
  }

  /**
   * Whether the key has already accumulated every event the window allows.
   *
   * True means the next event is one too many: at ten failures already counted, an eleventh is
   * refused. Asked **before** the event is recorded, so the comparison is "at or over", not "over".
   *
   * @param {{
   *   key: string
   * }} params - Parameters.
   * @returns {Promise<boolean>} true: the key may accumulate no further event in this window.
   * @public
   */
  async hasReachedMaxEventCount ({
    key,
  }) {
    const eventCount = await this.countRecentEvents({
      key,
    })

    return eventCount >= this.maxEventCount
  }

  /**
   * Count the events this key accumulated inside the window ending at this limit's instant.
   *
   * @param {{
   *   key: string
   * }} params - Parameters.
   * @returns {Promise<number>} Number of counted events.
   * @public
   */
  async countRecentEvents ({
    key,
  }) {
    const whereClause = this.buildWhereClause({
      key,
    })

    return this.EventModel.count({
      where: whereClause,
    })
  }

  /**
   * Build the clause selecting one key's events inside the window.
   *
   * The window bound is an operator on the timestamp attribute, so the database applies it and
   * answers with a number. `gte` rather than `gt`: an event landing exactly on the opening instant
   * is inside the window, which is the reading that refuses rather than the one that lets through.
   *
   * @param {{
   *   key: string
   * }} params - Parameters.
   * @returns {import('sequelize').WhereOptions} Where clause.
   */
  buildWhereClause ({
    key,
  }) {
    const storedKey = this.generateStoredKey({
      key,
    })
    const windowOpenedAt = this.createWindowOpenedAt()
    const operators = this.sequelizeOperators

    return {
      [this.keyFieldName]: storedKey,
      [this.timestampFieldName]: {
        [operators.gte]: windowOpenedAt,
      },
    }
  }

  /**
   * Generate the stored form of a key.
   *
   * A hook, not a transformation: a key already stored as presented is its own stored form. A
   * subclass whose table normalizes the key on the way in overrides this, or it counts against a
   * value no row holds.
   *
   * @param {{
   *   key: string
   * }} params - Parameters.
   * @returns {string} The key as the counted rows hold it.
   */
  generateStoredKey ({
    key,
  }) {
    return key
  }

  /**
   * Create the instant the window opens.
   *
   * @returns {Date} The instant one window's length before this limit's own instant.
   */
  createWindowOpenedAt () {
    return new Date(this.pointsAt.getTime() - this.windowMilliseconds)
  }
}

/**
 * @typedef {{
 *   pointsAt: Date
 * }} BaseRateLimitParams
 */

/**
 * @typedef {{
 *   pointsAt?: Date
 * }} BaseRateLimitFactoryParams
 */
