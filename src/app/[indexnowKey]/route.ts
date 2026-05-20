import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { indexnowKey: string } },
) {
  const key = process.env.INDEXNOW_KEY;
  if (!key || `${params.indexnowKey}` !== `${key}.txt`) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(key, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
