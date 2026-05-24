import * as cheerio from "cheerio";

export type ListingEvent = {
  sourceUrl: string;
  name: string;
  listingDateLabel: string;
  listingLocation: string;
  listingImageUrl: string;
};

export function parseListingHtml(html: string): ListingEvent[] {
  const $ = cheerio.load(html);
  const out: ListingEvent[] = [];
  $("article.mec-event-article").each((_, el) => {
    const root = $(el);
    const link = root.find("h4.mec-event-title a").first();
    const href = link.attr("href")?.trim();
    if (!href) return;
    const name = link.text().trim() || root.find("img").attr("alt")?.trim();
    if (!name) return;
    const dateLabel = root.find(".mec-start-date-label").first().text().trim();
    const loc = root.find(".mec-event-loc-place").first().text().replace(/\s+/g, " ").trim();
    const locClean = loc.replace(/^.*?map-marker[^>]*>\s*/i, "").trim();
    const img = root.find("img.wp-post-image").first().attr("src")?.trim() ?? "";
    out.push({
      sourceUrl: href,
      name,
      listingDateLabel: dateLabel,
      listingLocation: locClean || "Argentina",
      listingImageUrl: img,
    });
  });
  return out;
}

export function extractNextPageUrl(html: string): string | null {
  const $ = cheerio.load(html);
  const next = $('a.next.page-numbers, link[rel="next"]').first().attr("href");
  return next?.trim() ?? null;
}
