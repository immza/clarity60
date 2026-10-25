import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_ad_slots_mode" ADD VALUE 'house' BEFORE 'adsense';
  CREATE TABLE "promotions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"label" varchar DEFAULT 'From Clarity60',
  	"headline" varchar NOT NULL,
  	"text" varchar,
  	"cta_label" varchar DEFAULT 'Learn more',
  	"link" varchar NOT NULL,
  	"image_id" integer,
  	"active" boolean DEFAULT true,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"weight" numeric DEFAULT 1,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "promotions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"ad_slots_id" integer,
  	"sections_id" integer,
  	"categories_id" integer
  );
  
  CREATE TABLE "affiliate_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"partner" varchar,
  	"url" varchar NOT NULL,
  	"notes" varchar,
  	"clicks" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "articles" ADD COLUMN "sponsorship_is_sponsored" boolean;
  ALTER TABLE "articles" ADD COLUMN "sponsorship_sponsor_name" varchar;
  ALTER TABLE "articles" ADD COLUMN "sponsorship_sponsor_url" varchar;
  ALTER TABLE "articles" ADD COLUMN "has_affiliate_links" boolean;
  ALTER TABLE "_articles_v" ADD COLUMN "version_sponsorship_is_sponsored" boolean;
  ALTER TABLE "_articles_v" ADD COLUMN "version_sponsorship_sponsor_name" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_sponsorship_sponsor_url" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_has_affiliate_links" boolean;
  ALTER TABLE "ad_slots" ADD COLUMN "direct_starts_at" timestamp(3) with time zone;
  ALTER TABLE "ad_slots" ADD COLUMN "direct_ends_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "promotions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "affiliate_links_id" integer;
  ALTER TABLE "promotions" ADD CONSTRAINT "promotions_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "promotions_rels" ADD CONSTRAINT "promotions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "promotions_rels" ADD CONSTRAINT "promotions_rels_ad_slots_fk" FOREIGN KEY ("ad_slots_id") REFERENCES "public"."ad_slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "promotions_rels" ADD CONSTRAINT "promotions_rels_sections_fk" FOREIGN KEY ("sections_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "promotions_rels" ADD CONSTRAINT "promotions_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "promotions_image_idx" ON "promotions" USING btree ("image_id");
  CREATE INDEX "promotions_updated_at_idx" ON "promotions" USING btree ("updated_at");
  CREATE INDEX "promotions_created_at_idx" ON "promotions" USING btree ("created_at");
  CREATE INDEX "promotions_rels_order_idx" ON "promotions_rels" USING btree ("order");
  CREATE INDEX "promotions_rels_parent_idx" ON "promotions_rels" USING btree ("parent_id");
  CREATE INDEX "promotions_rels_path_idx" ON "promotions_rels" USING btree ("path");
  CREATE INDEX "promotions_rels_ad_slots_id_idx" ON "promotions_rels" USING btree ("ad_slots_id");
  CREATE INDEX "promotions_rels_sections_id_idx" ON "promotions_rels" USING btree ("sections_id");
  CREATE INDEX "promotions_rels_categories_id_idx" ON "promotions_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX "affiliate_links_slug_idx" ON "affiliate_links" USING btree ("slug");
  CREATE INDEX "affiliate_links_updated_at_idx" ON "affiliate_links" USING btree ("updated_at");
  CREATE INDEX "affiliate_links_created_at_idx" ON "affiliate_links" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_promotions_fk" FOREIGN KEY ("promotions_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_affiliate_links_fk" FOREIGN KEY ("affiliate_links_id") REFERENCES "public"."affiliate_links"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_promotions_id_idx" ON "payload_locked_documents_rels" USING btree ("promotions_id");
  CREATE INDEX "payload_locked_documents_rels_affiliate_links_id_idx" ON "payload_locked_documents_rels" USING btree ("affiliate_links_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "promotions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "promotions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "affiliate_links" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "promotions" CASCADE;
  DROP TABLE "promotions_rels" CASCADE;
  DROP TABLE "affiliate_links" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_promotions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_affiliate_links_fk";
  
  ALTER TABLE "ad_slots" ALTER COLUMN "mode" SET DATA TYPE text;
  ALTER TABLE "ad_slots" ALTER COLUMN "mode" SET DEFAULT 'off'::text;
  DROP TYPE "public"."enum_ad_slots_mode";
  CREATE TYPE "public"."enum_ad_slots_mode" AS ENUM('off', 'adsense', 'direct');
  ALTER TABLE "ad_slots" ALTER COLUMN "mode" SET DEFAULT 'off'::"public"."enum_ad_slots_mode";
  ALTER TABLE "ad_slots" ALTER COLUMN "mode" SET DATA TYPE "public"."enum_ad_slots_mode" USING "mode"::"public"."enum_ad_slots_mode";
  DROP INDEX "payload_locked_documents_rels_promotions_id_idx";
  DROP INDEX "payload_locked_documents_rels_affiliate_links_id_idx";
  ALTER TABLE "articles" DROP COLUMN "sponsorship_is_sponsored";
  ALTER TABLE "articles" DROP COLUMN "sponsorship_sponsor_name";
  ALTER TABLE "articles" DROP COLUMN "sponsorship_sponsor_url";
  ALTER TABLE "articles" DROP COLUMN "has_affiliate_links";
  ALTER TABLE "_articles_v" DROP COLUMN "version_sponsorship_is_sponsored";
  ALTER TABLE "_articles_v" DROP COLUMN "version_sponsorship_sponsor_name";
  ALTER TABLE "_articles_v" DROP COLUMN "version_sponsorship_sponsor_url";
  ALTER TABLE "_articles_v" DROP COLUMN "version_has_affiliate_links";
  ALTER TABLE "ad_slots" DROP COLUMN "direct_starts_at";
  ALTER TABLE "ad_slots" DROP COLUMN "direct_ends_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "promotions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "affiliate_links_id";`)
}
