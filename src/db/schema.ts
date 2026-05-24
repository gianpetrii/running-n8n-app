import {
  pgTable,
  text,
  timestamp,
  date,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Postgres (Neon o Supabase): misma `DATABASE_URL` estándar. */
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceUrl: text("source_url").notNull(),
    name: text("name").notNull(),
    location: text("location").notNull(),
    raceAt: date("race_at"),
    startTime: text("start_time"),
    distances: text("distances").notNull(),
    category: text("category").notNull(),
    imageUrl: text("image_url").notNull(),
    /** og | listing — de dónde salió la URL final (ver lib/images.ts) */
    imageSource: text("image_source").notNull().default("listing"),
    contactInfo: text("contact_info"),
    website: text("website").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishAt: date("publish_at"),
    status: text("status").notNull(),
    publishedRealAt: timestamp("published_real_at", { withTimezone: true }),
    instagramPostId: text("instagram_post_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("events_source_url_uidx").on(t.sourceUrl)]
);

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
