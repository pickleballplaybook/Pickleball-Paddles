"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

// A small TipTap-backed rich-text editor used by /admin/drills for the three
// per-level description fields. Outputs HTML via getHTML() so the mobile app
// can render it the same way it renders existing CKEditor-produced drill
// descriptions.

export default function RichTextBlock({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Start typing…",
      }),
    ],
    content: value,
    // Avoid SSR hydration mismatch in the Next.js App Router.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-content min-h-[8rem] px-3 py-2 focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // If the parent resets the form (e.g. after a successful submit), push the
  // new empty value into the editor without firing onUpdate.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="h-32 rounded border border-gray-800 bg-gray-900 animate-pulse" />
    );
  }

  return (
    <div className="rounded border border-gray-800 bg-gray-900 overflow-hidden focus-within:border-accent-500 transition-colors">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btnClass = (active: boolean) =>
    `px-2 py-1 rounded text-xs font-medium transition ${
      active
        ? "bg-accent-500 text-black"
        : "text-gray-300 hover:bg-gray-800"
    }`;

  function promptForLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const next = window.prompt("Link URL (leave blank to remove)", previous ?? "");
    if (next === null) return;
    if (next === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: next }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-gray-800 bg-slate-900">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive("bold"))}
        title="Bold (⌘B)"
      >
        <span className="font-bold">B</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive("italic"))}
        title="Italic (⌘I)"
      >
        <span className="italic">I</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive("strike"))}
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </button>
      <Sep />
      <button
        type="button"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        className={btnClass(editor.isActive("heading", { level: 2 }))}
        title="Heading"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive("bulletList"))}
        title="Bullet list"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive("orderedList"))}
        title="Numbered list"
      >
        1. List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive("blockquote"))}
        title="Quote"
      >
        ❝❞
      </button>
      <Sep />
      <button
        type="button"
        onClick={promptForLink}
        className={btnClass(editor.isActive("link"))}
        title="Link"
      >
        Link
      </button>
      <button
        type="button"
        onClick={() =>
          editor.chain().focus().unsetAllMarks().clearNodes().run()
        }
        className={btnClass(false)}
        title="Clear formatting"
      >
        Clear
      </button>
      <Sep />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={`${btnClass(false)} disabled:opacity-30`}
        title="Undo (⌘Z)"
      >
        ↶
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={`${btnClass(false)} disabled:opacity-30`}
        title="Redo (⌘⇧Z)"
      >
        ↷
      </button>
    </div>
  );
}

function Sep() {
  return <span className="w-px self-stretch bg-gray-800 mx-1" />;
}
