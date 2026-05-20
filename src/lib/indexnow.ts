/**
 * Submit URLs to IndexNow for rapid search-engine indexing.
 * Never throws — logs errors and returns silently so callers continue normally.
 */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || urls.length === 0) return;

  const body = {
    host: "playbookpaddles.com",
    key,
    keyLocation: `https://playbookpaddles.com/${key}.txt`,
    urlList: urls,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok || res.status === 202) {
      console.log(`[IndexNow] Submitted ${urls.length} URL(s) — status ${res.status}`);
    } else {
      const text = await res.text().catch(() => "");
      console.error(`[IndexNow] Failed — status ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error("[IndexNow] Network error:", err);
  }
}
