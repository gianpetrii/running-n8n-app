import { buildInstagramCaption } from "./caption";
import { instagramPublishPhoto } from "./instagram";
import { markEventPublished, selectEventsToPublishToday } from "./sync-events";
import type { EventRow } from "@/db/schema";

export type PublishSummary = {
  candidates: number;
  published: number;
  failures: { id: string; message: string }[];
};

export async function runPublishInstagram(): Promise<PublishSummary> {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!igUserId || !token) {
    throw new Error(
      "INSTAGRAM_BUSINESS_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN must be set"
    );
  }

  const rows = await selectEventsToPublishToday();
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

  return { candidates: rows.length, published, failures };
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

  const { postId } = await instagramPublishPhoto({
    igUserId,
    accessToken: token,
    imageUrl: row.imageUrl,
    caption,
  });

  await markEventPublished(row.id, postId);
}
