import { getPublicAppUrl, isSideCropEnabled } from "./app-url";

/** URL que Instagram descargará (original o endpoint con crop lateral). */
export function imageUrlForInstagramPublish(event: {
  id: string;
  imageUrl: string;
}): string {
  if (!isSideCropEnabled()) {
    return event.imageUrl;
  }
  const base = getPublicAppUrl();
  return `${base}/api/media/event-image/${event.id}`;
}
