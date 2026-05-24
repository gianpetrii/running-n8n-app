const UA =
  "Mozilla/5.0 (compatible; RunningArgentinaBot/1.0; +https://github.com/)";

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status}`);
  }
  return res.text();
}
