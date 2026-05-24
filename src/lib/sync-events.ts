import { and, eq, isNotNull, isNull, lte } from "drizzle-orm";
import pLimit from "p-limit";
import { getDb } from "@/db";
import { events, type EventRow } from "@/db/schema";
import { parseEventDetailHtml } from "./corredor-detail";
import { extractNextPageUrl, parseListingHtml } from "./corredor-listing";
import { computePublishAtAndStatus } from "./event-compute";
import { fetchText } from "./http";
import { pickFinalImageUrl } from "./images";
import { inferCategory, parseListingDateLabel } from "./extract-from-html";

const LISTING_SEED =
  process.env.CORREDOR_LISTING_URL ||
  "https://www.corredorpromedio.com/carreras/argentina/";

const MAX_LISTING_PAGES = Math.min(
  10,
  Math.max(1, Number(process.env.SCRAPE_MAX_LISTING_PAGES || "3"))
);
const DETAIL_CONCURRENCY = Math.min(
  5,
  Math.max(1, Number(process.env.SCRAPE_DETAIL_CONCURRENCY || "2"))
);
const FETCH_DETAIL = process.env.SCRAPE_FETCH_DETAIL !== "false";

export type SyncSummary = {
  listingPagesFetched: number;
  eventsSeen: number;
  upserted: number;
  errors: string[];
};

function todayArgentinaDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

async function collectListingUrls(): Promise<{
  rows: {
    listing: ReturnType<typeof parseListingHtml>[number];
    listingDateIso: string | null;
  }[];
  pagesFetched: number;
}> {
  const aggregated: {
    listing: ReturnType<typeof parseListingHtml>[number];
    listingDateIso: string | null;
  }[] = [];
  let pageUrl: string | null = LISTING_SEED;
  let pagesFetched = 0;
  const seenUrls = new Set<string>();

  while (pageUrl && pagesFetched < MAX_LISTING_PAGES) {
    const html = await fetchText(pageUrl);
    const items = parseListingHtml(html);
    for (const listing of items) {
      if (seenUrls.has(listing.sourceUrl)) continue;
      seenUrls.add(listing.sourceUrl);
      aggregated.push({
        listing,
        listingDateIso: parseListingDateLabel(listing.listingDateLabel),
      });
    }
    pageUrl = extractNextPageUrl(html);
    pagesFetched += 1;
  }

  return { rows: aggregated, pagesFetched };
}

async function upsertEvent(row: {
  sourceUrl: string;
  name: string;
  location: string;
  raceAt: string | null;
  startTime: string | null;
  distances: string;
  category: string;
  imageUrl: string;
  imageSource: "og" | "listing";
  contactInfo: string | null;
  website: string;
  publishedAt: Date;
  publishAt: string | null;
  status: string;
}): Promise<void> {
  const db = await getDb();
  const existing = await db.query.events.findFirst({
    where: eq(events.sourceUrl, row.sourceUrl),
  });

  if (!existing) {
    await db.insert(events).values({
      sourceUrl: row.sourceUrl,
      name: row.name,
      location: row.location,
      raceAt: row.raceAt,
      startTime: row.startTime,
      distances: row.distances,
      category: row.category,
      imageUrl: row.imageUrl,
      imageSource: row.imageSource,
      contactInfo: row.contactInfo,
      website: row.website,
      publishedAt: row.publishedAt,
      publishAt: row.publishAt,
      status: row.status,
    });
    return;
  }

  if (existing.status === "published") {
    await db
      .update(events)
      .set({
        name: row.name,
        location: row.location,
        raceAt: row.raceAt,
        startTime: row.startTime,
        distances: row.distances,
        category: row.category,
        imageUrl: row.imageUrl,
        imageSource: row.imageSource,
        contactInfo: row.contactInfo,
        website: row.website,
        updatedAt: new Date(),
      })
      .where(eq(events.id, existing.id));
    return;
  }

  await db
    .update(events)
    .set({
      name: row.name,
      location: row.location,
      raceAt: row.raceAt,
      startTime: row.startTime,
      distances: row.distances,
      category: row.category,
      imageUrl: row.imageUrl,
      imageSource: row.imageSource,
      contactInfo: row.contactInfo,
      website: row.website,
      publishAt: row.publishAt,
      status: row.status,
      updatedAt: new Date(),
    })
    .where(eq(events.id, existing.id));
}

export async function runSyncEvents(): Promise<SyncSummary> {
  const errors: string[] = [];
  let upserted = 0;
  const { rows: collected, pagesFetched } = await collectListingUrls();
  const limit = pLimit(DETAIL_CONCURRENCY);

  const tasks = collected.map(({ listing, listingDateIso }) =>
    limit(async () => {
      try {
        let detail = {
          descriptionHtml: "",
          ogImageUrl: null as string | null,
          raceAt: listingDateIso,
          location: listing.listingLocation,
          distances: "A confirmar",
          category: inferCategory(listing.name, ""),
          startTime: null as string | null,
          contactJson: "{}",
        };

        if (FETCH_DETAIL) {
          const html = await fetchText(listing.sourceUrl);
          detail = parseEventDetailHtml(html, {
            name: listing.name,
            listingLocation: listing.listingLocation,
            listingDateIso,
          });
        }

        const preferOg = process.env.IMAGE_PREFER_OG !== "false";
        const { url: imageUrl, source: imageSource } = pickFinalImageUrl({
          ogImageUrl: detail.ogImageUrl,
          listingImageUrl: listing.listingImageUrl || null,
          preferOg: preferOg,
        });

        const { publishAt, status } = computePublishAtAndStatus({
          raceAt: detail.raceAt,
          location: detail.location,
          distances: detail.distances,
        });

        await upsertEvent({
          sourceUrl: listing.sourceUrl,
          name: listing.name,
          location: detail.location,
          raceAt: detail.raceAt,
          startTime: detail.startTime,
          distances: detail.distances,
          category: detail.category,
          imageUrl: imageUrl || listing.listingImageUrl,
          imageSource: imageUrl ? imageSource : "listing",
          contactInfo: detail.contactJson === "{}" ? null : detail.contactJson,
          website: listing.sourceUrl,
          publishedAt: new Date(),
          publishAt,
          status,
        });
        upserted += 1;
      } catch (e) {
        errors.push(
          `${listing.sourceUrl}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    })
  );

  await Promise.all(tasks);

  return {
    listingPagesFetched: pagesFetched,
    eventsSeen: collected.length,
    upserted,
    errors,
  };
}

/** Carreras listas para publicar hoy (publish_at <= hoy y no publicadas). */
export async function selectEventsToPublishToday(): Promise<EventRow[]> {
  const db = await getDb();
  const today = todayArgentinaDateString();
  return db.query.events.findMany({
    where: and(
      eq(events.status, "ready"),
      isNotNull(events.publishAt),
      lte(events.publishAt, today),
      isNull(events.publishedRealAt)
    ),
  });
}

export async function markEventPublished(
  id: string,
  instagramPostId: string
): Promise<void> {
  const db = await getDb();
  await db
    .update(events)
    .set({
      status: "published",
      publishedRealAt: new Date(),
      instagramPostId,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));
}
