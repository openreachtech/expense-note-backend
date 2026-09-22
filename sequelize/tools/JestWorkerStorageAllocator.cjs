'use strict'

const JestWorkerStorage = require('./JestWorkerStorage.cjs')

/**
 * The whole set of per-worker storage copies a single jest run needs.
 *
 * **Why the copies are made in one process before any worker starts.** jest exposes `maxWorkers` to
 * `globalSetup`, which runs once, in jest's own main process, after `test.sh` has finished seeding
 * and before the first worker is spawned. Making every copy there means no copy is ever written
 * over a file some worker already has open -- which on Windows would fail outright -- and no two
 * processes race to create the same one.
 *
 * **Why the ids are simply 1..maxWorkers.** jest numbers its workers from 1 and never issues an id
 * above `maxWorkers`; a run it decides to take in band is worker 1. Allocating the full range
 * therefore covers every id that can appear, and allocating an id no worker claims costs one 200 KB
 * file that the teardown removes again.
 *
 * **Accumulation.** `releaseStorages()` runs from `globalTeardown` after every run, and every
 * `npm test` begins with `db:teardown`, which is `rm sequelize/storage/*.sqlite3`. The directory is
 * `.gitignore`d in full, so no copy can reach a commit either.
 */
class JestWorkerStorageAllocator {
  /**
   * Constructor.
   *
   * @param {JestWorkerStorageAllocatorParams} params - Parameters.
   */
  constructor ({
    canonicalStoragePath,
    maxWorkers,
  }) {
    this.canonicalStoragePath = canonicalStoragePath
    this.maxWorkers = maxWorkers
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof JestWorkerStorageAllocator ? X : never} T, X
   * @param {JestWorkerStorageAllocatorFactoryParams} params - Parameters.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    canonicalStoragePath,
    maxWorkers,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        canonicalStoragePath,
        maxWorkers,
      })
    )
  }

  /**
   * get: Declaration of the storage class this allocator builds.
   *
   * @returns {typeof JestWorkerStorage} Storage class declaration.
   */
  static get JestWorkerStorageCtor () {
    return JestWorkerStorage
  }

  /**
   * get: Class itself -- reach own statics through the instance.
   *
   * @returns {typeof JestWorkerStorageAllocator} The class.
   */
  get Ctor () {
    return /** @type {typeof JestWorkerStorageAllocator} */ (this.constructor)
  }

  /**
   * Give every worker of this run its own copy of the canonical storage file.
   *
   * A copy left behind by an interrupted run is removed first rather than written over, so a run
   * that finds no canonical file to copy leaves no stale database for a worker to open and pass
   * against.
   *
   * @returns {Array<string>} Paths written.
   * @public
   */
  allocateStorages () {
    this.releaseStorages()

    return this.buildWorkerStorages()
      .map(it => it.copyFromCanonicalStorage())
      .filter(it => it !== null)
  }

  /**
   * Remove every per-worker copy of this run.
   *
   * @returns {Array<string>} Paths removed.
   * @public
   */
  releaseStorages () {
    return this.buildWorkerStorages()
      .map(it => it.removeWorkerStorage())
      .filter(it => it !== null)
  }

  /**
   * Build one storage per worker id this run can issue.
   *
   * @returns {Array<JestWorkerStorage>} Storages, one per worker id.
   */
  buildWorkerStorages () {
    return this.generateJestWorkerIds()
      .map(jestWorkerId =>
        this.Ctor.JestWorkerStorageCtor.create({
          canonicalStoragePath: this.canonicalStoragePath,
          jestWorkerId,
        })
      )
  }

  /**
   * Generate the worker ids this run can issue, as jest writes them into `JEST_WORKER_ID`.
   *
   * They are strings because that is what an environment variable is, and the storage compares one
   * against the other nowhere -- but a test reading `'1'` here and `1` there would have to know
   * which of the two it was looking at.
   *
   * @returns {Array<string>} Worker ids, `'1'` upwards.
   */
  generateJestWorkerIds () {
    return Array.from(
      Array(this.maxWorkers)
        .keys()
    )
      .map(index => String(index + 1))
  }
}

module.exports = JestWorkerStorageAllocator

/**
 * @typedef {{
 *   canonicalStoragePath: string
 *   maxWorkers: number
 * }} JestWorkerStorageAllocatorParams
 */

/**
 * @typedef {JestWorkerStorageAllocatorParams} JestWorkerStorageAllocatorFactoryParams
 */
