'use strict'

const DATABASE_STORAGE_CONSTANT_HASH = require('../constants/databaseStorageConstants.cjs')
const JestWorkerStorageAllocator = require('../sequelize/tools/JestWorkerStorageAllocator.cjs')

const {
  DATABASE_STORAGE,
} = DATABASE_STORAGE_CONSTANT_HASH

/*
 * Runs once, in jest's own main process, after `test.sh` has migrated and seeded the canonical
 * database and before the first worker is spawned. It gives every worker of this run its own copy
 * of that database, so the parallel suites contend for no SQLite writer lock and read none of one
 * another's rows -- see `sequelize/tools/JestWorkerStorage.cjs` for the failure this answers.
 *
 * The module exports a bare function rather than a class because that is the shape jest requires of
 * `globalSetup`; the work itself lives in the allocator, which is a class and has its own tests.
 *
 * `JEST_WORKER_ID` is absent in this process, so `DATABASE_STORAGE.DEVELOPMENT_PATH` is read here as
 * the canonical file it names -- the same constant the workers read their own copy from.
 */
module.exports = globalConfig => {
  const allocator = JestWorkerStorageAllocator.create({
    canonicalStoragePath: DATABASE_STORAGE.DEVELOPMENT_PATH,
    maxWorkers: globalConfig.maxWorkers,
  })

  allocator.allocateStorages()
}
