"use client";

import { useEffect, useState } from "react";

// CKEditor 5 must load only in the browser (it touches `window` and
// `document` at import time). Dynamic-load via useEffect so this file
// stays SSR-safe even though it's a client component.

type Loaded = {
  CKEditor: any;
  ClassicEditor: any;
};

export default function CKEditorBlock({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import("@ckeditor/ckeditor5-react"),
      import("@ckeditor/ckeditor5-build-classic"),
    ])
      .then(([reactPkg, buildPkg]) => {
        if (cancelled) return;
        setLoaded({
          CKEditor: reactPkg.CKEditor,
          ClassicEditor: (buildPkg as any).default ?? buildPkg,
        });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message ?? "Editor failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="p-3 rounded border border-red-700 bg-red-900/30 text-xs text-red-200">
        Editor failed to load: {loadError}. Try refreshing the page.
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="h-32 rounded border border-gray-800 bg-gray-900 animate-pulse" />
    );
  }

  const { CKEditor, ClassicEditor } = loaded;
  return (
    <div className="ckeditor-host rounded overflow-hidden border border-gray-800">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          // Acknowledge the GPL license — without this CKEditor 5 v38+ falls
          // back to read-only mode and the editor silently ignores keystrokes.
          licenseKey: "GPL",
          placeholder,
          mediaEmbed: { previewsInData: true },
        }}
        onChange={(_event: unknown, editor: any) => {
          onChange(editor.getData());
        }}
      />
    </div>
  );
}
