const GRAPH = "https://graph.facebook.com/v21.0";

export type IgPublishResult = { postId: string; creationId: string };

type GraphError = { message: string; error_subcode?: number };

async function graphJson<T>(res: Response): Promise<T & { error?: GraphError }> {
  return res.json() as Promise<T & { error?: GraphError }>;
}

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
  const json = await graphJson<{ id?: string }>(res);
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message || `create media failed: ${res.status}`);
  }
  return json.id;
}

async function waitForMediaContainerReady(
  creationId: string,
  accessToken: string
): Promise<void> {
  const maxAttempts = 20;
  const delayMs = 3000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const url = new URL(`${GRAPH}/${creationId}`);
    url.searchParams.set("fields", "status_code");
    url.searchParams.set("access_token", accessToken);
    const res = await fetch(url.toString());
    const json = await graphJson<{ status_code?: string }>(res);
    if (!res.ok) {
      throw new Error(json.error?.message || `status check failed: ${res.status}`);
    }

    const status = json.status_code;
    if (status === "FINISHED") return;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Instagram container ${status.toLowerCase()}`);
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw new Error("Instagram media not ready after waiting");
}

export async function instagramPublishMedia(params: {
  igUserId: string;
  accessToken: string;
  creationId: string;
  accessTokenForStatus: string;
}): Promise<string> {
  await waitForMediaContainerReady(
    params.creationId,
    params.accessTokenForStatus
  );

  const url = new URL(`${GRAPH}/${params.igUserId}/media_publish`);
  url.searchParams.set("creation_id", params.creationId);
  url.searchParams.set("access_token", params.accessToken);
  const res = await fetch(url.toString(), { method: "POST" });
  const json = await graphJson<{ id?: string }>(res);
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message || `publish failed: ${res.status}`);
  }
  return json.id;
}

export async function instagramPublishPhoto(params: {
  igUserId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}): Promise<IgPublishResult> {
  const creationId = await instagramCreateMediaContainer(params);
  const postId = await instagramPublishMedia({
    igUserId: params.igUserId,
    accessToken: params.accessToken,
    creationId,
    accessTokenForStatus: params.accessToken,
  });
  return { postId, creationId };
}
