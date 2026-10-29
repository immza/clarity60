import * as migration_20261025_104521_initial from './20261025_104521_initial';
import * as migration_20261029_155049_media_storage_fields from './20261029_155049_media_storage_fields';

export const migrations = [
  {
    up: migration_20261025_104521_initial.up,
    down: migration_20261025_104521_initial.down,
    name: '20261025_104521_initial',
  },
  {
    up: migration_20261029_155049_media_storage_fields.up,
    down: migration_20261029_155049_media_storage_fields.down,
    name: '20261029_155049_media_storage_fields'
  },
];
