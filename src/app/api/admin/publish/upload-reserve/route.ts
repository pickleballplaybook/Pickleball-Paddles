const BACKEND_URL = process.env.SHORTS_BACKEND_URL || "http://localhost:3001";
const TOKEN = process.env.SHORTS_BACKEND_TOKEN || "";

export async function POST() {
  try {
    const upstream = await fetch(`${BACKEND_URL}/api/upload-reserve`, {
      method: "POST",
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      cache: "no-store",
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      return Response.json(data, { status: upstream.status });
    }
    // Hand the browser the direct Railway upload URL. The Railway URL leaks
    // into client JS but the upload endpoint requires the signed token.
    return Response.json({
      ...data,
      uploadUrl: `${BACKEND_URL}/api/file-upload/${encodeURIComponent(data.uploadId)}`,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Backend unreachable" },
      { status: 502 }
    );
  }
}
