export type ContactInfo = {
  instagram?: string[];
  whatsapp?: string[];
  email?: string[];
  facebook?: string[];
};

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/** "May 16 2026" o "May 20 - 24 2026" → primera fecha ISO */
export function parseListingDateLabel(label: string): string | null {
  const t = label.trim();
  const re =
    /^([A-Za-z]{3})\s+(\d{1,2})(?:\s*-\s*\d{1,2})?\s+(\d{4})$/;
  const m = t.match(re);
  if (!m) return null;
  const mon = MONTH_MAP[m[1].toLowerCase()];
  if (mon === undefined) return null;
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (!day || !year) return null;
  const mm = String(mon + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** Fechas tipo "7 de febrero de 2026" en HTML/texto */
export function extractRaceDateFromText(html: string): string | null {
  const meses =
    "(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)";
  const re = new RegExp(
    `(?:(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\\s+)?(\\d{1,2})\\s+de\\s+${meses}\\s+de\\s+(202[4-9]|203\\d)`,
    "i"
  );
  const m = html.match(re);
  if (!m) return null;
  const day = Number(m[1]);
  const monthName = m[2].toLowerCase();
  const year = Number(m[3]);
  const monthIdx = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "setiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ].indexOf(monthName);
  if (monthIdx < 0 || !day || !year) return null;
  const mm = String(monthIdx + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function extractDistances(text: string): string | null {
  const m = text.match(/\d+K(?:\s*,\s*\d+K)*/i);
  return m ? m[0].replace(/\s/g, "") : null;
}

export function extractLocationFromText(text: string): string | null {
  const m = text.match(
    /\ben\s+([^,<.\n]{3,80}?),\s*([^,<.\n]{3,40}?),\s*Argentina\b/i
  );
  if (!m) return null;
  const a = m[1].trim();
  const b = m[2].trim();
  const bad = /^(el|la|los|las|de|del|en|un|una)$/i;
  if (bad.test(a) || bad.test(b)) return null;
  return `${a}, ${b}, Argentina`;
}

export function inferCategory(title: string, body: string): string {
  const t = `${title}\n${body}`.toLowerCase();
  if (/\bultra\b/.test(t)) return "Ultra";
  if (/\btrail\b/.test(t)) return "Trail";
  if (/\bcross\b/.test(t)) return "Cross";
  if (/\bnocturna\b|\bnocturno\b/.test(t)) return "Nocturna";
  if (/\bmarat[oó]n\b|\b42k\b/.test(t)) return "Maraton";
  return "Ruta";
}

export function extractContacts(html: string): ContactInfo {
  const plain = html.replace(/<[^>]+>/g, " ");
  const out: ContactInfo = {};

  const ig = [
    ...new Set(
      [...plain.matchAll(/@([a-z0-9._]{2,30})/gi)].map((x) =>
        x[1].toLowerCase()
      )
    ),
  ];
  if (ig.length) out.instagram = ig.slice(0, 5);

  const wa = [
    ...new Set(
      [
        ...html.matchAll(/wa\.me\/\+?(\d[\d\s-]{8,20}\d)/gi),
        ...html.matchAll(/api\.whatsapp\.com\/send\?phone=(\+?\d+)/gi),
      ].map((x) => x[1].replace(/\D/g, ""))
    ),
  ];
  if (wa.length) out.whatsapp = wa.slice(0, 5);

  const emails = [
    ...new Set(
      [...html.matchAll(/mailto:([^"'\s>]+)/gi)].map((x) =>
        decodeURIComponent(x[1])
      )
    ),
  ];
  if (emails.length) out.email = emails.slice(0, 3);

  const fb = [
    ...new Set(
      [...html.matchAll(/facebook\.com\/([a-z0-9._-]{2,50})/gi)].map(
        (x) => x[1]
      )
    ),
  ].filter((h) => !["share", "sharer", "dialog", "plugins"].includes(h));
  if (fb.length) out.facebook = fb.slice(0, 3);

  return out;
}

export function extractStartTime(html: string): string | null {
  const m = html.match(/\b(\d{1,2}:\d{2})\s*(?:hs|h\.?m\.?|horas?)\b/i);
  return m ? m[1] : null;
}

export function extractOgImage(html: string): string | null {
  const m = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  );
  if (m) return m[1];
  const m2 = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
  );
  return m2 ? m2[1] : null;
}
