/**
 * /api/prices
 *
 * GET  /api/prices           — return the current price cache
 * POST /api/prices           — trigger a price sync
 *
 * POST body (JSON):
 *   { paddleId?: string }    — sync a single paddle by ID, or all paddles if omitted
 *   { forceResync?: boolean }
 *
 * NOTE: This endpoint does real outbound HTTP requests to retailer pages.
 * Run it from a cron job, admin panel, or developer tooling — not from the
 * browser on every page load.
 *
 * Security: add an ADMIN_SECRET env var check before deploying publicly.
 */

export const runtime = "nodejs"; // Required for fs and fetch with full Node.js APIs

import { NextRequest, NextResponse } from "next/server";
import { paddles } from "@/data/paddles";
import {
  readPriceCache,
  syncPaddlePrice,
  syncAllPaddlePrices,
} from "@/lib/price-sync";

// Optional: protect with a secret header
// const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

export async function GET() {
  const cache = readPriceCache();
  const total = paddles.length;
  const synced = Object.keys(cache).length;
  const active = Object.values(cache).filter((e) => e.status === "active").length;
  const failed = Object.values(cache).filter((e) => e.status === "failed").length;

  return NextResponse.json({
    stats: { total, synced, active, failed, pending: total - synced },
    cache,
  });
}

export async function POST(req: NextRequest) {
  // Uncomment to require authorization:
  // const secret = req.headers.get("x-admin-secret");
  // if (secret !== ADMIN_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { paddleId?: string; forceResync?: boolean } = {};
  try { body = await req.json(); } catch { /* no body */ }

  if (body.paddleId) {
    const paddle = paddles.find((p) => p.id === body.paddleId);
    if (!paddle) {
      return NextResponse.json({ error: "Paddle not found" }, { status: 404 });
    }
    const entry = await syncPaddlePrice(paddle);
    return NextResponse.json({ paddleId: body.paddleId, entry });
  }

  // Sync all paddles
  const results: { id: string; name: string; status: string; price: number | null }[] = [];

  const cache = await syncAllPaddlePrices(paddles, {
    forceResync: body.forceResync ?? false,
    concurrency: 3,
    onProgress(done, total, paddle, entry) {
      console.log(`[price-sync] ${done}/${total} ${paddle.brand} ${paddle.name} → ${entry.status} ${entry.currentPrice ?? "n/a"}`);
      results.push({
        id:     paddle.id,
        name:   `${paddle.brand} ${paddle.name}`,
        status: entry.status,
        price:  entry.currentPrice,
      });
    },
  });

  const active = Object.values(cache).filter((e) => e.status === "active").length;
  return NextResponse.json({
    synced: results.length,
    active,
    results,
  });
}
