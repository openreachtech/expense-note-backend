export default {
  /*
   * The per-worker database copies are made here, before the first worker starts, and removed after
   * the last one exits. See `sequelize/tools/JestWorkerStorage.cjs` for why each worker needs a
   * database of its own.
   */
  globalSetup: '<rootDir>/tests/setup-global.cjs',
  globalTeardown: '<rootDir>/tests/teardown-global.cjs',

  setupFilesAfterEnv: [
    '<rootDir>/tests/setup-after-env.js',
  ],
  moduleNameMapper: {
    '^(@.*)$': '<rootDir>/node_modules/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^sequelize/(.*)$': '<rootDir>/node_modules/sequelize/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/',
  ],
}
