import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function extractStoragePath(firebaseUrl: string): string | null {
  try {
    const url = new URL(firebaseUrl);
    const match = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

async function hasActiveSubscription(email: string, uid: string): Promise<boolean> {
  // Check Supabase (Stripe subscribers)
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("subscription_mirror")
      .select("status")
      .eq("email", email.toLowerCase());
    if (data && data.some((row) => row.status === "active" || row.status === "trialing")) {
      return true;
    }
  } catch {
    // fall through to Firestore check
  }

  // Fallback: check Firestore user doc (covers free-forever and RevenueCat subscribers)
  try {
    const db = getFirebaseFirestore();
    const userDoc = await db.collection("users").doc(uid).get();
    const status = userDoc.data()?.lastKnownSubStatus as string | undefined;
    if (status === "pro" || status === "trialing") return true;
    if (userDoc.data()?.isFreeForever === true) return true;
  } catch {
    // fall through
  }

  return false;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idToken = authHeader.slice(7);

  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!email) {
    // Fall back to looking up email from Firestore user doc
    try {
      const userRecord = await getFirebaseAuth().getUser(uid);
      email = userRecord.email;
    } catch {
      return NextResponse.json({ error: "No email on account" }, { status: 403 });
    }
  }

  let body: { courseId?: string; nodeId?: string; pdfIndex?: number } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { courseId, nodeId, pdfIndex } = body ?? {};
  if (!courseId || !nodeId || typeof pdfIndex !== "number") {
    return NextResponse.json({ error: "Missing courseId, nodeId, or pdfIndex" }, { status: 400 });
  }

  const db = getFirebaseFirestore();
  const [courseDoc, nodeDoc] = await Promise.all([
    db.collection("courses").doc(courseId).get(),
    db.collection("courses").doc(courseId).collection("nodes").doc(nodeId).get(),
  ]);

  if (!courseDoc.exists || !nodeDoc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const accessType = (courseDoc.data()?.accessType as string) ?? "open";
  if (accessType !== "open") {
    const subscribed = await hasActiveSubscription(email!, uid);
    if (!subscribed) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }
  }

  const pdfAttachments = (nodeDoc.data()?.pdfAttachments ?? []) as { name: string; url: string }[];
  if (pdfIndex >= pdfAttachments.length) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  const pdf = pdfAttachments[pdfIndex];
  const storagePath = extractStoragePath(pdf.url);

  if (!storagePath) {
    // Non-Firebase-Storage URL — return as-is (shouldn't happen in practice)
    return NextResponse.json({ url: pdf.url });
  }

  const storage = getFirebaseStorage();
  const bucket = storage.bucket("pickleball-playbook.appspot.com");
  const file = bucket.file(storagePath);

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  return NextResponse.json({ url: signedUrl });
}
