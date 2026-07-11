import { AdminNav } from "../_components/AdminNav";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { ChallengesClient, type Challenge } from "./_components/ChallengesClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadChallenges(): Promise<Challenge[]> {
  const db = getFirebaseFirestore();
  const snap = await db
    .collection("community_challenges")
    .orderBy("startsAt", "desc")
    .get();
  return snap.docs.map((d) => {
    const raw = d.data();
    return {
      id: d.id,
      title: (raw.title as string) ?? "",
      description: (raw.description as string) ?? "",
      hashtag: (raw.hashtag as string) ?? "",
      startsAt:
        (raw.startsAt as Timestamp | undefined)?.toDate().toISOString() ??
        null,
      endsAt:
        (raw.endsAt as Timestamp | undefined)?.toDate().toISOString() ?? null,
      active: raw.active === true,
    };
  });
}

export default async function ChallengesPage() {
  const initial = await loadChallenges();
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <AdminNav />
        <h1 className="text-2xl font-bold mb-1">Community Challenges</h1>
        <p className="text-sm text-gray-400 mb-6">
          The Flutter app reads the newest doc where <code>active == true</code>{" "}
          (ordered by <code>startsAt</code> desc).
        </p>
        <ChallengesClient initial={initial} />
      </div>
    </div>
  );
}
