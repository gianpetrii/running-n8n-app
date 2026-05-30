import { getPublicAppUrl, isSideCropEnabled } from "./app-url";

/** Meta debe poder hacer GET a la URL; localhost no sirve. */
function isPubliclyReachableAppUrl(base: string): boolean {
  try {
    const u = new URL(base);
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return false;
    }
    if (host.endsWith(".local")) return false;
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** URL que Instagram descargará (original o endpoint con crop lateral). */
export function imageUrlForInstagramPublish(event: {
  id: string;
  imageUrl: string;
}): string {
  if (!isSideCropEnabled()) {
    return event.imageUrl;
  }
  const base = getPublicAppUrl();
  if (!isPubliclyReachableAppUrl(base)) {
    return event.imageUrl;
  }
  return `${base}/api/media/event-image/${event.id}`;
}
