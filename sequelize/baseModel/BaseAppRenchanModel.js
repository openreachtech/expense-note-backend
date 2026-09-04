import {
  RenchanModel,
} from '@openreachtech/renchan-sequelize'

/**
 * Base model of this application.
 *
 * Every model in this repository extends this class rather than `RenchanModel` or Sequelize's
 * own `Model`, so that shared behavior can be added in one place later.
 *
 * @augments {RenchanModel}
 */
export default class BaseAppRenchanModel extends RenchanModel {
  // noop
}
