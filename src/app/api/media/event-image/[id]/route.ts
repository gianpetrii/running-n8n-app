import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { fetchAndCropSides } from "@/lib/image-crop";
import { sideCropPercent } from "@/lib/app-url";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Imagen recortada (lados) para que Meta la descargue al publicar. Público, sin auth. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  const row = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!row?.imageUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const jpeg = await fetchAndCropSides(row.imageUrl, sideCropPercent());
    return new NextResponse(new Uint8Array(jpeg), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
