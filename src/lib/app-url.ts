/** URL pública de la app (Instagram debe poder GET la imagen). */
export function getPublicAppUrl(): string {
  const raw = process.env.APP_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (!raw) {
    throw new Error("APP_URL (o VERCEL_URL) must be set for cropped Instagram images");
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }
  return `https://${raw.replace(/\/$/, "")}`;
}

export function isSideCropEnabled(): boolean {
  return process.env.IMAGE_CROP_SIDES === "true";
}

export function sideCropPercent(): number {
  const n = Number(process.env.IMAGE_CROP_SIDE_PERCENT ?? "10");
  if (!Number.isFinite(n) || n < 0 || n >= 45) return 10;
  return n;
}
