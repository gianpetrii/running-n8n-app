import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseListingHtml, extractNextPageUrl } from "@/lib/corredor-listing";
import { parseEventDetailHtml } from "@/lib/corredor-detail";
import {
  extractDistances,
  extractLocationFromText,
  extractOgImage,
  extractRaceDateFromText,
  parseListingDateLabel,
} from "@/lib/extract-from-html";
import { computePublishAtAndStatus } from "@/lib/event-compute";
import { pickFinalImageUrl, upsizeWordPressThumb } from "@/lib/images";

const fixturePath = path.join(
  process.cwd(),
  "src/tests/fixtures/listing-fragment.html"
);
const fixture = readFileSync(fixturePath, "utf8");

describe("parseListingHtml", () => {
  it("parses event URL, title, date label, location, image", () => {
    const rows = parseListingHtml(fixture);
    expect(rows).toHaveLength(1);
    expect(rows[0].sourceUrl).toBe(
      "https://www.corredorpromedio.com/evento/desafio-capri/"
    );
    expect(rows[0].name).toBe("DESAFÍO CAPRI");
    expect(rows[0].listingDateLabel).toBe("May 16 2026");
    expect(rows[0].listingLocation).toContain("Esquel");
    expect(rows[0].listingImageUrl).toContain("desafio_capri");
  });
});

describe("extractNextPageUrl", () => {
  it("reads link rel=next", () => {
    const html =
      '<html><head><link rel="next" href="https://example.com/page/2/" /></head></html>';
    expect(extractNextPageUrl(html)).toBe("https://example.com/page/2/");
  });
});

describe("parseListingDateLabel", () => {
  it("parses single day", () => {
    expect(parseListingDateLabel("May 16 2026")).toBe("2026-05-16");
  });
  it("parses range using first day", () => {
    expect(parseListingDateLabel("May 20 - 24 2026")).toBe("2026-05-20");
  });
});

describe("parseEventDetailHtml", () => {
  it("extracts og:image, distances, Spanish race date", () => {
    const detailHtml = `
      <meta property="og:image" content="https://cdn.example/og.jpg" />
      <div class="mec-single-event-description">
        <p>El evento será el sábado 16 de mayo de 2026 en Esquel, Chubut, Argentina.</p>
        <p>21K, 10K</p>
      </div>`;
    const r = parseEventDetailHtml(detailHtml, {
      name: "Trail Test",
      listingLocation: "Esquel",
      listingDateIso: "2026-05-16",
    });
    expect(r.ogImageUrl).toBe("https://cdn.example/og.jpg");
    expect(r.distances).toMatch(/21K/);
    expect(r.raceAt).toBe("2026-05-16");
    expect(r.location).toMatch(/Esquel/);
  });
});

describe("extract helpers", () => {
  it("extractDistances", () => {
    expect(extractDistances("Distancias: 42K, 21K, 10K")).toBe("42K,21K,10K");
  });
  it("extractLocationFromText", () => {
    const t = "La carrera en Rosario, Santa Fe, Argentina el domingo";
    expect(extractLocationFromText(t)).toBe("Rosario, Santa Fe, Argentina");
  });
  it("extractRaceDateFromText", () => {
    expect(extractRaceDateFromText("sábado 7 de febrero de 2026")).toBe(
      "2026-02-07"
    );
  });
  it("extractOgImage second attribute order", () => {
    const h = `<meta content="https://x/og.png" property="og:image" />`;
    expect(extractOgImage(h)).toBe("https://x/og.png");
  });
});

describe("computePublishAtAndStatus", () => {
  it("incomplete when distances placeholder", () => {
    const r = computePublishAtAndStatus({
      raceAt: "2027-01-01",
      location: "X, Y, Argentina",
      distances: "A confirmar",
    });
    expect(r.status).toBe("incomplete");
    expect(r.publishAt).toBeNull();
  });
});

describe("images", () => {
  it("prefers og when enabled", () => {
    const p = pickFinalImageUrl({
      ogImageUrl: "https://a/og.jpg",
      listingImageUrl: "https://a/thumb-150x150.jpg",
      preferOg: true,
    });
    expect(p.url).toBe("https://a/og.jpg");
    expect(p.source).toBe("og");
  });
  it("upsizeWordPressThumb strips size suffix", () => {
    expect(
      upsizeWordPressThumb(
        "https://x/wp-content/uploads/2022/03/foo-150x150.jpg"
      )
    ).toBe("https://x/wp-content/uploads/2022/03/foo.jpg");
  });
});
