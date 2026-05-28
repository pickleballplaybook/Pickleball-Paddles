const BACKEND_URL = process.env.SHORTS_BACKEND_URL || "http://localhost:3001";
const TOKEN = process.env.SHORTS_BACKEND_TOKEN || "";

function authHeaders(): HeadersInit {
  return TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
}

export async function forwardJson(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<Response> {
  const method = init.method || "GET";
  try {
    const upstream = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        ...authHeaders(),
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Backend unreachable" },
      { status: 502 }
    );
  }
}

export async function forwardStream(
  path: string,
  req: Request,
  fallbackContentType: string
): Promise<Response> {
  try {
    const range = req.headers.get("range") || undefined;
    const upstream = await fetch(`${BACKEND_URL}${path}`, {
      headers: {
        ...authHeaders(),
        ...(range ? { Range: range } : {}),
      },
      cache: "no-store",
    });

    const headers = new Headers();
    const passthrough = [
      "content-type",
      "content-length",
      "content-disposition",
      "accept-ranges",
      "content-range",
      "cache-control",
      "last-modified",
      "etag",
    ];
    for (const name of passthrough) {
      const v = upstream.headers.get(name);
      if (v) headers.set(name, v);
    }
    if (!headers.has("content-type")) headers.set("content-type", fallbackContentType);

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Backend unreachable" },
      { status: 502 }
    );
  }
}
