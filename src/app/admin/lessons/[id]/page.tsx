import { AdminNav } from "../../_components/AdminNav";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { CourseEditor } from "./_components/CourseEditor";
import { notFound } from "next/navigation";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function LessonEditorPage({ params }: PageProps) {
  const { id } = await params;
  const db = getFirebaseFirestore();

  const [courseDoc, nodesSnap] = await Promise.all([
    db.collection("courses").doc(id).get(),
    db.collection("courses").doc(id).collection("nodes").orderBy("sortOrder").get(),
  ]);

  if (!courseDoc.exists) notFound();

  const r = courseDoc.data()!;
  const course = {
    id: courseDoc.id,
    title: (r.title as string) ?? "",
    description: (r.description as string) ?? "",
    accessType: (r.accessType as string) ?? "open",
    coverImageUrl: (r.coverImageUrl as string | null) ?? null,
    published: r.published === true,
    sortOrder: (r.sortOrder as number) ?? 0,
  };

  const nodes = nodesSnap.docs.map((d) => {
    const nr = d.data();
    return {
      id: d.id,
      title: (nr.title as string) ?? "Untitled",
      subtitle: (nr.subtitle as string | null) ?? null,
      type: (nr.type as string) === "folder" ? "folder" : "page",
      parentId: (nr.parentId as string | null) ?? null,
      sortOrder: (nr.sortOrder as number) ?? 0,
      published: nr.published !== false,
      content: (nr.content as string) ?? "",
      thumbnailUrl: (nr.thumbnailUrl as string | null) ?? null,
      pdfAttachments: Array.isArray(nr.pdfAttachments)
        ? (nr.pdfAttachments as { name: string; url: string }[])
        : [],
      minLevel: typeof nr.minLevel === "number" ? nr.minLevel : null,
      minTier: nr.minTier === "pro" || nr.minTier === "basic" ? nr.minTier : null,
      drillIds: Array.isArray(nr.drillIds) ? (nr.drillIds as string[]).filter((x) => typeof x === "string") : [],
      videoStorageUrl: typeof nr.videoStorageUrl === "string" && nr.videoStorageUrl ? nr.videoStorageUrl : null,
      videoThumbnailUrl: typeof nr.videoThumbnailUrl === "string" && nr.videoThumbnailUrl ? nr.videoThumbnailUrl : null,
      category: nr.category === "technique" || nr.category === "strategy" || nr.category === "mindset" ? nr.category : null,
    };
  });

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <AdminNav />
        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
          <Link href="/admin/lessons" className="hover:text-white transition">
            ← Lessons
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">{course.title || "Untitled"}</span>
        </div>
      </div>
      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <CourseEditor course={course} initialNodes={nodes} />
      </div>
    </div>
  );
}
