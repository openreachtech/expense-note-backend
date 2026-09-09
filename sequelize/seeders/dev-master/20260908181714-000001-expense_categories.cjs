'use strict'

/*
 * dev-master duplicate: apply the same four expense categories as the production master in dev / CI
 * (db:refresh, and test.sh's db:seed:master step). The real data lives in the production master
 * directory (DRY), which no script in this repository loads.
 */
module.exports = require('../master/20260908181714-000001-expense_categories.cjs')
