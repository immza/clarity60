import * as migration_20261025_073946_initial from './20261025_073946_initial';
import * as migration_20261025_080249_article_published_path from './20261025_080249_article_published_path';

export const migrations = [
  {
    up: migration_20261025_073946_initial.up,
    down: migration_20261025_073946_initial.down,
    name: '20261025_073946_initial',
  },
  {
    up: migration_20261025_080249_article_published_path.up,
    down: migration_20261025_080249_article_published_path.down,
    name: '20261025_080249_article_published_path'
  },
];
