export function assertCronAuthorized(
  request: Request,
  cronSecret: string | undefined
): void {
  if (!cronSecret) {
    throw new Error("CRON_SECRET is not configured");
  }
  // Vercel Cron envía este header; con CRON_SECRET en env también manda Bearer
  if (request.headers.get("x-vercel-cron") === "1") {
    return;
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    throw new Error("Unauthorized");
  }
}
