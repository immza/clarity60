import * as migration_20261025_080824_initial from './20261025_080824_initial';

export const migrations = [
  {
    up: migration_20261025_080824_initial.up,
    down: migration_20261025_080824_initial.down,
    name: '20261025_080824_initial',
  },
];
