'use strict'

const fs = require('fs')
const path = require('path')

const env = require('../../app/globals/env.cjs')

const JEST_WORKER_FILE_NAME_INFIX = 'jest-worker'

/**
 * The SQLite storage file one jest worker works in.
 *
 * **The defect this exists for.** SQLite serializes writers across a whole database file. jest runs
 * test files in parallel worker processes, so `--maxWorkers=3` puts three writers on one file:
 * one holds the writer lock while the others wait, and a transaction slow enough to outlast their
 * busy timeout hands them `SQLITE_BUSY: database is locked`. The workers also read one another's
 * uncoordinated rows, so an assertion over a listing counts records a different test file inserted.
 * Both faults are timing-dependent, which is why the same commit failed 1, 12, 16 and 23 tests on
 * successive runs and passed outright at `--maxWorkers=1`.
 *
 * **Why a copy of the file rather than a longer timeout or a retry.** A timeout or a retry makes
 * the lock failure rarer without making it impossible, and does nothing at all about workers
 * reading each other's rows -- it would trade a failing suite for a slow flaky one. Lowering
 * `--maxWorkers` in CI would leave the suite green only under a command chosen to dodge the
 * problem. Giving each worker its own file removes the sharing, so there is no lock to contend for
 * and no foreign row to read.
 *
 * **Why a copy rather than migrating and seeding per worker.** `test.sh` tears the database down,
 * migrates it and seeds it exactly once, before jest starts; the seeding step has no per-worker
 * hook to run in. Copying the already-seeded file gives every worker a database that is already
 * migrated and already seeded, at the cost of one 200 KB file copy per worker.
 *
 * **Outside jest this class returns the canonical path unchanged.** `JEST_WORKER_ID` is set by jest
 * in every worker process and by nothing else -- it is absent even in jest's own main process,
 * which is what lets `globalSetup` read the canonical path from the same configuration the workers
 * read a copy from. So `npm run db:refresh`, the `db:*` scripts, `npm run dev` and the server all
 * keep opening `sequelize/storage/development.sqlite3` itself.
 */
class JestWorkerStorage {
  /**
   * Constructor.
   *
   * @param {JestWorkerStorageParams} params - Parameters.
   */
  constructor ({
    canonicalStoragePath,
    jestWorkerId,
  }) {
    this.canonicalStoragePath = canonicalStoragePath
    this.jestWorkerId = jestWorkerId
  }

  /**
   * Factory method.
   *
   * `jestWorkerId` defaults to the environment rather than being read inside a method, so a test
   * states the worker it is describing instead of editing the environment the whole process shares.
   *
   * @template {X extends typeof JestWorkerStorage ? X : never} T, X
   * @param {JestWorkerStorageFactoryParams} params - Parameters.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    canonicalStoragePath,
    jestWorkerId = env.JEST_WORKER_ID,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        canonicalStoragePath,
        jestWorkerId,
      })
    )
  }

  /**
   * get: The file system module.
   *
   * Reached through a getter rather than referenced directly in the methods below, so a test can
   * stub it without writing to a real disk.
   *
   * @returns {typeof fs} The file system module.
   */
  static get fileSystemClient () {
    return fs
  }

  /**
   * get: The path module.
   *
   * @returns {typeof path} The path module.
   */
  static get pathClient () {
    return path
  }

  /**
   * get: Class itself -- reach own statics through the instance.
   *
   * @returns {typeof JestWorkerStorage} The class.
   */
  get Ctor () {
    return /** @type {typeof JestWorkerStorage} */ (this.constructor)
  }

  /**
   * Whether this storage belongs to a jest worker at all.
   *
   * @returns {boolean} true: a worker id was given, so the storage is a worker's own copy.
   * @public
   */
  runsInJestWorker () {
    return Boolean(this.jestWorkerId)
  }

  /**
   * Generate the path of the storage file to open.
   *
   * Outside a jest worker this is the canonical file itself, unchanged -- nothing that is not jest
   * ever opens a copy.
   *
   * @returns {string} Path of the storage file.
   * @public
   */
  generateStoragePath () {
    if (!this.runsInJestWorker()) {
      return this.canonicalStoragePath
    }

    return this.generateWorkerStoragePath()
  }

  /**
   * Generate the path of this worker's own copy.
   *
   * The worker id goes before the extension rather than after it, so the copy still ends in
   * `.sqlite3` and is swept by `npm run db:teardown`, which removes `sequelize/storage/*.sqlite3`.
   *
   * @returns {string} Path of this worker's copy of the storage file.
   */
  generateWorkerStoragePath () {
    const extension = this.Ctor.pathClient.extname(this.canonicalStoragePath)
    const pathWithoutExtension = this.canonicalStoragePath.slice(0, -extension.length)

    return `${pathWithoutExtension}.${JEST_WORKER_FILE_NAME_INFIX}-${this.jestWorkerId}${extension}`
  }

  /**
   * Copy the canonical storage file onto this worker's own copy.
   *
   * Copying a seeded SQLite file needs no re-migration and no re-seeding: the copy is the same
   * database, byte for byte, as the one `test.sh` had just finished preparing.
   *
   * A missing canonical file is not an error. `NODE_ENV=live` never writes one, and a bare `npx
   * jest` run that skipped the setup script would previously have had SQLite create an empty file
   * on connect -- which it still does, in the worker's copy.
   *
   * @returns {string | null} Path written, or null when there was nothing to copy.
   * @public
   */
  copyFromCanonicalStorage () {
    if (!this.runsInJestWorker()) {
      return null
    }

    if (!this.Ctor.fileSystemClient.existsSync(this.canonicalStoragePath)) {
      return null
    }

    const workerStoragePath = this.generateWorkerStoragePath()

    this.Ctor.fileSystemClient.copyFileSync(this.canonicalStoragePath, workerStoragePath)

    return workerStoragePath
  }

  /**
   * Remove this worker's own copy.
   *
   * Guarded on the worker id so that no call here can ever reach the canonical file, which is the
   * one file in this directory that a run must not delete behind its own back.
   *
   * @returns {string | null} Path removed, or null when there was no copy to remove.
   * @public
   */
  removeWorkerStorage () {
    if (!this.runsInJestWorker()) {
      return null
    }

    const workerStoragePath = this.generateWorkerStoragePath()

    this.Ctor.fileSystemClient.rmSync(
      workerStoragePath,
      {
        force: true,
      }
    )

    return workerStoragePath
  }
}

module.exports = JestWorkerStorage

/**
 * @typedef {{
 *   canonicalStoragePath: string
 *   jestWorkerId: string | null
 * }} JestWorkerStorageParams
 */

/**
 * @typedef {{
 *   canonicalStoragePath: string
 *   jestWorkerId?: string | null
 * }} JestWorkerStorageFactoryParams
 */
