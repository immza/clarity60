import * as migration_20261025_080824_initial from './20261025_080824_initial';
import * as migration_20261025_081706_site_launch_date from './20261025_081706_site_launch_date';

export const migrations = [
  {
    up: migration_20261025_080824_initial.up,
    down: migration_20261025_080824_initial.down,
    name: '20261025_080824_initial',
  },
  {
    up: migration_20261025_081706_site_launch_date.up,
    down: migration_20261025_081706_site_launch_date.down,
    name: '20261025_081706_site_launch_date'
  },
];
