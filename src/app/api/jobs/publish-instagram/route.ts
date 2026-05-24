import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/auth-cron";
import { runPublishInstagram } from "@/lib/publish-instagram";

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    assertCronAuthorized(request, process.env.CRON_SECRET);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const summary = await runPublishInstagram();
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}

