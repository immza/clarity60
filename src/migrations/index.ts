import * as migration_20261025_080824_initial from './20261025_080824_initial';
import * as migration_20261025_093601_masthead_ears from './20261025_093601_masthead_ears';
import * as migration_20261025_093956_ears_off_by_default from './20261025_093956_ears_off_by_default';
import * as migration_20261025_103045_revenue from './20261025_103045_revenue';

export const migrations = [
  {
    up: migration_20261025_080824_initial.up,
    down: migration_20261025_080824_initial.down,
    name: '20261025_080824_initial',
  },
  {
    up: migration_20261025_093601_masthead_ears.up,
    down: migration_20261025_093601_masthead_ears.down,
    name: '20261025_093601_masthead_ears',
  },
  {
    up: migration_20261025_093956_ears_off_by_default.up,
    down: migration_20261025_093956_ears_off_by_default.down,
    name: '20261025_093956_ears_off_by_default',
  },
  {
    up: migration_20261025_103045_revenue.up,
    down: migration_20261025_103045_revenue.down,
    name: '20261025_103045_revenue'
  },
];
