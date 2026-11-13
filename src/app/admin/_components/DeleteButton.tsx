"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

export function DeleteButton({
  action,
  id,
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this signup?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
        style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
