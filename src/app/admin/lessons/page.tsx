import { AdminNav } from "../_components/AdminNav";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { LessonsClient, type LessonCategory } from "./_components/LessonsClient";
import { CoursesSection, type Course } from "./_components/CoursesSection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadData(): Promise<{ categories: LessonCategory[]; courses: Course[] }> {
  const db = getFirebaseFirestore();
  const [catSnap, courseSnap] = await Promise.all([
    db.collection("community_lesson_categories").orderBy("order").get(),
    db.collection("courses").orderBy("sortOrder").get(),
  ]);

  const categories: LessonCategory[] = catSnap.docs.map((d) => {
    const r = d.data();
    return {
      id: d.id,
      title: (r.title as string) ?? "",
      description: (r.description as string) ?? "",
      minLevel: (r.minLevel as number) ?? 3,
      requiresPro: r.requiresPro === true,
      order: (r.order as number) ?? 0,
      isActive: r.isActive !== false,
    };
  });

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

  return { categories, courses };
}

export default async function LessonsAdminPage() {
  const { categories, courses } = await loadData();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <AdminNav />

        {/* Course builder */}
        <div className="mb-14">
          <h1 className="text-2xl font-bold mb-1">Lessons</h1>
          <p className="text-sm text-gray-400 mb-6">
            Create structured lesson courses with folders, pages, and rich media. Click any card to open the editor.
          </p>
          <CoursesSection initial={courses} />
        </div>

        {/* Fundamentals categories */}
        <div>
          <h2 className="text-xl font-bold mb-1">Fundamentals Categories</h2>
          <p className="text-sm text-gray-400 mb-6">
            Manage which categories appear in the Fundamentals tab and what level / membership is required to unlock each one. Changes are live immediately.
          </p>
          <LessonsClient initial={categories} />
        </div>
      </div>
    </div>
  );
}
