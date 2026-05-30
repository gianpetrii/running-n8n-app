import { buildInstagramCaption } from "./caption";
import { imageUrlForInstagramPublish } from "./instagram-image-url";
import { instagramPublishPhoto } from "./instagram";
import { markEventPublished, selectEventsToPublishToday } from "./sync-events";
import type { EventRow } from "@/db/schema";

export type PublishSummary = {
  candidates: number;
  published: number;
  skippedDueToLimit: number;
  failures: { id: string; message: string }[];
};

function publishMaxPerRun(): number | undefined {
  const raw = process.env.PUBLISH_MAX_PER_RUN;
  if (!raw?.trim()) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

export async function runPublishInstagram(): Promise<PublishSummary> {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!igUserId || !token) {
    throw new Error(
      "INSTAGRAM_BUSINESS_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN must be set"
    );
  }

  const allDue = await selectEventsToPublishToday();
  const sorted = [...allDue].sort((a, b) => {
    const pa = a.publishAt ?? "";
    const pb = b.publishAt ?? "";
    if (pa !== pb) return pa.localeCompare(pb);
    return a.createdAt.toISOString().localeCompare(b.createdAt.toISOString());
  });
  const maxPerRun = publishMaxPerRun();
  const rows =
    maxPerRun != null ? sorted.slice(0, maxPerRun) : sorted;
  const skippedDueToLimit =
    maxPerRun != null ? Math.max(0, sorted.length - rows.length) : 0;

  const failures: { id: string; message: string }[] = [];
  let published = 0;

  for (const row of rows) {
    try {
      await publishOneEvent(row, igUserId, token);
      published += 1;
    } catch (e) {
      failures.push({
        id: row.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    candidates: allDue.length,
    published,
    skippedDueToLimit,
    failures,
  };
}

async function publishOneEvent(
  row: EventRow,
  igUserId: string,
  token: string
): Promise<void> {
  const caption = buildInstagramCaption({
    name: row.name,
    location: row.location,
    raceAt: row.raceAt,
    startTime: row.startTime,
    distances: row.distances,
    category: row.category,
    contactInfo: row.contactInfo,
  });

  if (!row.imageUrl) {
    throw new Error("Missing image_url");
  }

  const igImageUrl = imageUrlForInstagramPublish({
    id: row.id,
    imageUrl: row.imageUrl,
  });

  const { postId } = await instagramPublishPhoto({
    igUserId,
    accessToken: token,
    imageUrl: igImageUrl,
    caption,
  });

  await markEventPublished(row.id, postId);
}
