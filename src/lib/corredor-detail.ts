import * as cheerio from "cheerio";
import {
  extractContacts,
  extractDistances,
  extractLocationFromText,
  extractOgImage,
  extractRaceDateFromText,
  extractStartTime,
  inferCategory,
} from "./extract-from-html";

export type DetailPayload = {
  descriptionHtml: string;
  ogImageUrl: string | null;
  raceAt: string | null;
  location: string;
  distances: string;
  category: string;
  startTime: string | null;
  contactJson: string;
};

export function parseEventDetailHtml(
  html: string,
  fallback: { name: string; listingLocation: string; listingDateIso: string | null }
): DetailPayload {
  const $ = cheerio.load(html);
  const desc = $(".mec-single-event-description, .mec-events-content").first();
  const descriptionHtml = desc.html() ?? "";
  const textBlob = desc.text() + "\n" + fallback.name;
  const ogImageUrl = extractOgImage(html);

  let raceAt =
    extractRaceDateFromText(descriptionHtml) ||
    extractRaceDateFromText(textBlob);
  if (!raceAt && fallback.listingDateIso) {
    raceAt = fallback.listingDateIso;
  }

  let location =
    extractLocationFromText(descriptionHtml) ||
    extractLocationFromText(textBlob);
  if (!location) {
    const locEl = $(".mec-single-event-location").first().text().replace(/\s+/g, " ").trim();
    location = locEl || fallback.listingLocation;
  }

  let distances = extractDistances(descriptionHtml) || extractDistances(textBlob);
  if (!distances) distances = "A confirmar";

  const category = inferCategory(fallback.name, textBlob);
  const startTime = extractStartTime(descriptionHtml);
  const contacts = extractContacts(descriptionHtml);
  const contactJson = JSON.stringify(contacts);

  return {
    descriptionHtml,
    ogImageUrl,
    raceAt,
    location,
    distances,
    category,
    startTime,
    contactJson,
  };
}
