export type EventStatus =
  | "pending"
  | "incomplete"
  | "ready"
  | "published"
  | "expired"
  | "cancelled";

function ymdTodayArgentina(): string {
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

function parseYmd(s: string): Date {
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d));
}

function subUtcMonths(ymd: string, months: number): string {
  const dt = parseYmd(ymd);
  dt.setUTCMonth(dt.getUTCMonth() - months);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function computePublishAtAndStatus(input: {
  raceAt: string | null;
  location: string;
  distances: string;
}): { publishAt: string | null; status: EventStatus } {
  const today = ymdTodayArgentina();
  const { raceAt, location, distances } = input;

  const dist = distances?.trim();
  if (!raceAt || !location?.trim() || !dist || dist === "A confirmar") {
    return { publishAt: null, status: "incomplete" };
  }

  if (raceAt <= today) {
    return { publishAt: null, status: "expired" };
  }

  const threeMonthsBefore = subUtcMonths(raceAt, 3);
  let publishAt: string | null;
  if (threeMonthsBefore >= today) {
    publishAt = threeMonthsBefore;
  } else {
    publishAt = today;
  }

  return { publishAt, status: "ready" };
}
