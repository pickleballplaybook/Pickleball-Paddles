import { AdminNav } from "../_components/AdminNav";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { CoursesSection, type Course } from "./_components/CoursesSection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadData(): Promise<{ courses: Course[] }> {
  const db = getFirebaseFirestore();
  const courseSnap = await db.collection("courses").orderBy("sortOrder").get();

  const courses: Course[] = courseSnap.docs.map((d) => {
    const r = d.data();
    return {
      id: d.id,
      title: (r.title as string) ?? "",
      description: (r.description as string) ?? "",
      accessType: (r.accessType as string) ?? "open",
      coverImageUrl: (r.coverImageUrl as string | null) ?? null,
      published: r.published === true,
      sortOrder: (r.sortOrder as number) ?? 0,
    };
  });

  return { courses };
}

export default async function LessonsAdminPage() {
  const { courses } = await loadData();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <AdminNav />
        <h1 className="text-2xl font-bold mb-1">Lessons</h1>
        <p className="text-sm text-gray-400 mb-6">
          Create structured lesson courses with folders, pages, and rich media. Click any card to open the editor.
        </p>
        <CoursesSection initial={courses} />
      </div>
    </div>
  );
}
