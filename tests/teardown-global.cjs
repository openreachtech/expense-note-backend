'use strict'

const DATABASE_STORAGE_CONSTANT_HASH = require('../constants/databaseStorageConstants.cjs')
const JestWorkerStorageAllocator = require('../sequelize/tools/JestWorkerStorageAllocator.cjs')

const {
  DATABASE_STORAGE,
} = DATABASE_STORAGE_CONSTANT_HASH

/*
 * Runs once, after every worker has exited, and removes the per-worker copies `setup-global.cjs`
 * made -- so a run leaves the storage directory holding the canonical database and nothing else.
 *
 * The canonical file is out of reach from here by construction: a storage only removes a path it
 * built for a worker id, and never the path it was handed.
 */
module.exports = globalConfig => {
  const allocator = JestWorkerStorageAllocator.create({
    canonicalStoragePath: DATABASE_STORAGE.DEVELOPMENT_PATH,
    maxWorkers: globalConfig.maxWorkers,
  })

  allocator.releaseStorages()
}
