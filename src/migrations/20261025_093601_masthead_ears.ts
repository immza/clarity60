import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_left_ear_kind" AS ENUM('custom', 'storiesToday');
  CREATE TYPE "public"."enum_site_settings_right_ear_kind" AS ENUM('custom', 'storiesToday');
  ALTER TABLE "site_settings" ADD COLUMN "left_ear_enabled" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "left_ear_kind" "enum_site_settings_left_ear_kind" DEFAULT 'custom' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "left_ear_label" varchar DEFAULT 'Follow @theclarity60';
  ALTER TABLE "site_settings" ADD COLUMN "left_ear_text" varchar DEFAULT 'The 60-second version, on Instagram.';
  ALTER TABLE "site_settings" ADD COLUMN "left_ear_link" varchar DEFAULT 'https://www.instagram.com/theclarity60/';
  ALTER TABLE "site_settings" ADD COLUMN "right_ear_enabled" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "right_ear_kind" "enum_site_settings_right_ear_kind" DEFAULT 'storiesToday' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "right_ear_label" varchar DEFAULT 'Today';
  ALTER TABLE "site_settings" ADD COLUMN "right_ear_text" varchar DEFAULT 'Fresh stories, every day.';
  ALTER TABLE "site_settings" ADD COLUMN "right_ear_link" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "left_ear_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "left_ear_kind";
  ALTER TABLE "site_settings" DROP COLUMN "left_ear_label";
  ALTER TABLE "site_settings" DROP COLUMN "left_ear_text";
  ALTER TABLE "site_settings" DROP COLUMN "left_ear_link";
  ALTER TABLE "site_settings" DROP COLUMN "right_ear_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "right_ear_kind";
  ALTER TABLE "site_settings" DROP COLUMN "right_ear_label";
  ALTER TABLE "site_settings" DROP COLUMN "right_ear_text";
  ALTER TABLE "site_settings" DROP COLUMN "right_ear_link";
  DROP TYPE "public"."enum_site_settings_left_ear_kind";
  DROP TYPE "public"."enum_site_settings_right_ear_kind";`)
}
