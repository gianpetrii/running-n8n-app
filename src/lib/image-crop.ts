import sharp from "sharp";

export function computeSideCropRect(
  width: number,
  height: number,
  sidePercent: number
): { left: number; top: number; width: number; height: number } {
  const pct = Math.min(Math.max(sidePercent, 0), 40);
  const left = Math.floor((width * pct) / 100);
  const cropWidth = width - left * 2;
  if (cropWidth < 200) {
    return { left: 0, top: 0, width, height };
  }
  return { left, top: 0, width: cropWidth, height };
}

export async function fetchAndCropSides(
  imageUrl: string,
  sidePercent: number
): Promise<Buffer> {
  const res = await fetch(imageUrl, {
    headers: { "User-Agent": "RunningArgentinaBot/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status}`);
  }
  const input = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) {
    throw new Error("Invalid image dimensions");
  }

  const rect = computeSideCropRect(w, h, sidePercent);
  return sharp(input)
    .extract(rect)
    .jpeg({ quality: 90 })
    .toBuffer();
}
