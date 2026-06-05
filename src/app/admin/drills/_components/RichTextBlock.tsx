"use client";

import {
  useEditor,
  EditorContent,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Node, mergeAttributes } from "@tiptap/core";
import { useEffect, useRef } from "react";

// A small TipTap-backed rich-text editor used by /admin/drills for the three
// per-level description fields. Outputs HTML via getHTML() so the mobile app
// can render it the same way it renders existing drill descriptions.
//
// Supports:
//   • Bold, italic, strike, headings, lists, blockquote, code, links
//   • Inline images (toolbar button + paste from clipboard + drag-and-drop)
//   • Video embeds via YouTube / Vimeo URLs (toolbar button) rendered as a
//     responsive 16:9 iframe.

// ── Embedded video (YouTube / Vimeo) as a TipTap node ─────────────────────
//
// We can't rely on a third-party extension for "any iframe" because TipTap
// strips unknown nodes on parse. This minimal node renders/parses an
// <iframe> wrapped in a div for responsive sizing.

const Iframe = Node.create({
  name: "iframe",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      src: { default: null },
      title: { default: "Embedded video" },
      allow: {
        default:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      },
      allowfullscreen: {
        default: true,
        renderHTML: (attrs) =>
          attrs.allowfullscreen ? { allowfullscreen: "" } : {},
      },
      frameborder: { default: "0" },
    };
  },
  parseHTML() {
    return [{ tag: "iframe" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "iframe-embed-wrapper" },
      ["iframe", mergeAttributes(HTMLAttributes)],
    ];
  },
});

// ── URL → embed URL ────────────────────────────────────────────────────────

function toEmbedUrl(input: string): string | null {
  const url = input.trim();
  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]+)/
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo: vimeo.com/ID, vimeo.com/video/ID, player.vimeo.com/video/ID
  const vm = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

// ── Upload helper (used by toolbar, paste, and drop) ──────────────────────

async function uploadAsset(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/drills/upload-asset", {
    method: "POST",
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) {
    throw new Error(json?.error ?? `Upload failed (${res.status})`);
  }
  return json.url as string;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function RichTextBlock({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      Image.configure({
        // Allow http(s) src only — keeps things safe even though we upload
        // to Firebase Storage HTTPS URLs.
        allowBase64: false,
        HTMLAttributes: { class: "tiptap-image" },
      }),
      Iframe,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-content min-h-[8rem] px-3 py-2 focus:outline-none",
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (!file) continue;
            event.preventDefault();
            uploadAsset(file)
              .then((url) => {
                const { state, dispatch } = view;
                const node = state.schema.nodes.image.create({ src: url });
                dispatch(state.tr.replaceSelectionWith(node));
              })
              .catch((err) =>
                window.alert(`Image upload failed: ${err.message}`)
              );
            return true;
          }
        }
        return false;
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        let handled = false;
        for (const file of Array.from(files)) {
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            handled = true;
            uploadAsset(file)
              .then((url) => {
                const { state, dispatch } = view;
                const node = state.schema.nodes.image.create({ src: url });
                dispatch(state.tr.replaceSelectionWith(node));
              })
              .catch((err) =>
                window.alert(`Image upload failed: ${err.message}`)
              );
          }
        }
        return handled;
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  function pickAndUploadImage() {
    fileInputRef.current?.click();
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !editor) return;
    try {
      const url = await uploadAsset(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err: any) {
      window.alert(`Image upload failed: ${err?.message ?? "unknown error"}`);
    }
  }

  function promptForVideo() {
    if (!editor) return;
    const input = window.prompt(
      "YouTube or Vimeo URL:",
      ""
    );
    if (!input) return;
    const embedUrl = toEmbedUrl(input);
    if (!embedUrl) {
      window.alert(
        "Unrecognized video URL. Paste a YouTube (youtube.com / youtu.be) or Vimeo (vimeo.com) link."
      );
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent({ type: "iframe", attrs: { src: embedUrl } })
      .run();
  }

  if (!editor) {
    return (
      <div className="h-32 rounded border border-gray-800 bg-gray-900 animate-pulse" />
    );
  }

  return (
    <div className="rounded border border-gray-800 bg-gray-900 overflow-hidden focus-within:border-accent-500 transition-colors">
      <Toolbar
        editor={editor}
        onPickImage={pickAndUploadImage}
        onInsertVideo={promptForVideo}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFilePicked}
      />
    </div>
  );
}

function Toolbar({
  editor,
  onPickImage,
  onInsertVideo,
}: {
  editor: Editor;
  onPickImage: () => void;
  onInsertVideo: () => void;
}) {
  const btnClass = (active: boolean) =>
    `px-2 py-1 rounded text-xs font-medium transition ${
      active
        ? "bg-accent-500 text-black"
        : "text-gray-300 hover:bg-gray-800"
    }`;

  function promptForLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const next = window.prompt(
      "Link URL (leave blank to remove)",
      previous ?? ""
    );
    if (next === null) return;
    if (next === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: next })
      .run();
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
        onClick={onPickImage}
        className={btnClass(false)}
        title="Insert image (or paste / drag one in)"
      >
        Image
      </button>
      <button
        type="button"
        onClick={onInsertVideo}
        className={btnClass(false)}
        title="Embed YouTube or Vimeo video"
      >
        Video
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
