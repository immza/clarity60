import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_promotions_style" AS ENUM('notice', 'wide', 'video');
  ALTER TABLE "promotions" ADD COLUMN "style" "enum_promotions_style" DEFAULT 'notice' NOT NULL;
  ALTER TABLE "promotions" ADD COLUMN "video_id" integer;
  ALTER TABLE "promotions" ADD CONSTRAINT "promotions_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "promotions_video_idx" ON "promotions" USING btree ("video_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "promotions" DROP CONSTRAINT "promotions_video_id_media_id_fk";
  
  DROP INDEX "promotions_video_idx";
  ALTER TABLE "promotions" DROP COLUMN "style";
  ALTER TABLE "promotions" DROP COLUMN "video_id";
  DROP TYPE "public"."enum_promotions_style";`)
}
