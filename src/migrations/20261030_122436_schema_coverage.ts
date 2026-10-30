import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "poster_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "contact_email" varchar DEFAULT 'hello@clarity60.com' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "faq_schema" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "socials_tiktok" varchar;
  ALTER TABLE "media" ADD CONSTRAINT "media_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "media_poster_idx" ON "media" USING btree ("poster_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP CONSTRAINT "media_poster_id_media_id_fk";
  
  DROP INDEX "media_poster_idx";
  ALTER TABLE "media" DROP COLUMN "poster_id";
  ALTER TABLE "site_settings" DROP COLUMN "contact_email";
  ALTER TABLE "site_settings" DROP COLUMN "faq_schema";
  ALTER TABLE "site_settings" DROP COLUMN "socials_tiktok";`)
}
