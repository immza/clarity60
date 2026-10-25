import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" ADD COLUMN "published_path" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_published_path" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" DROP COLUMN "published_path";
  ALTER TABLE "_articles_v" DROP COLUMN "version_published_path";`)
}
