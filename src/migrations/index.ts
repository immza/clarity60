import * as migration_20261025_080824_initial from './20261025_080824_initial';
import * as migration_20261025_093601_masthead_ears from './20261025_093601_masthead_ears';

export const migrations = [
  {
    up: migration_20261025_080824_initial.up,
    down: migration_20261025_080824_initial.down,
    name: '20261025_080824_initial',
  },
  {
    up: migration_20261025_093601_masthead_ears.up,
    down: migration_20261025_093601_masthead_ears.down,
    name: '20261025_093601_masthead_ears'
  },
];
