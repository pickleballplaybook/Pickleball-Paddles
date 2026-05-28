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

// Streams the request body upstream (multipart uploads, etc.). The platform's
// request-body size limit still applies — for big files use Vercel Blob instead.
export async function forwardStreamingPost(
  path: string,
  req: Request
): Promise<Response> {
  try {
    const upstream = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": req.headers.get("content-type") || "application/octet-stream",
      },
      body: req.body,
      // @ts-expect-error - duplex is required for streaming bodies in undici
      duplex: "half",
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

// Follows the upstream's redirect manually and re-issues it to the browser —
// used for OAuth start endpoints where the backend returns a 302 to Google.
export async function forwardRedirect(path: string): Promise<Response> {
  try {
    const upstream = await fetch(`${BACKEND_URL}${path}`, {
      headers: authHeaders(),
      redirect: "manual",
      cache: "no-store",
    });
    const location = upstream.headers.get("location");
    if (!location) {
      const body = await upstream.text();
      return new Response(body || "Backend did not redirect", {
        status: upstream.status || 502,
      });
    }
    return Response.redirect(location, 302);
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
