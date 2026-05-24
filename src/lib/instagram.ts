const GRAPH = "https://graph.facebook.com/v21.0";

export type IgPublishResult = { postId: string; creationId: string };

export async function instagramCreateMediaContainer(params: {
  igUserId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}): Promise<string> {
  const url = new URL(`${GRAPH}/${params.igUserId}/media`);
  url.searchParams.set("image_url", params.imageUrl);
  url.searchParams.set("caption", params.caption);
  url.searchParams.set("access_token", params.accessToken);
  const res = await fetch(url.toString(), { method: "POST" });
  const json = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message || `create media failed: ${res.status}`);
  }
  return json.id;
}

export async function instagramPublishMedia(params: {
  igUserId: string;
  accessToken: string;
  creationId: string;
}): Promise<string> {
  const url = new URL(`${GRAPH}/${params.igUserId}/media_publish`);
  url.searchParams.set("creation_id", params.creationId);
  url.searchParams.set("access_token", params.accessToken);
  const res = await fetch(url.toString(), { method: "POST" });
  const json = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message || `publish failed: ${res.status}`);
  }
  return json.id;
}

export async function instagramPublishPhoto(
  params: {
    igUserId: string;
    accessToken: string;
    imageUrl: string;
    caption: string;
  }
): Promise<IgPublishResult> {
  const creationId = await instagramCreateMediaContainer(params);
  const postId = await instagramPublishMedia({
    igUserId: params.igUserId,
    accessToken: params.accessToken,
    creationId,
  });
  return { postId, creationId };
}
