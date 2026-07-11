"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const RichTextBlock = dynamic(
  () => import("@/app/admin/drills/_components/RichTextBlock"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-lg border border-gray-800 bg-gray-900 animate-pulse" />
    ),
  }
);

type Course = {
  id: string;
  title: string;
  description: string;
  accessType: string;
  coverImageUrl: string | null;
  published: boolean;
  sortOrder: number;
};

type CourseNode = {
  id: string;
  title: string;
  type: string;
  parentId: string | null;
  sortOrder: number;
  published: boolean;
  content: string;
};

type EditState = {
  title: string;
  content: string;
  published: boolean;
};

export function CourseEditor({
  course,
  initialNodes,
}: {
  course: Course;
  initialNodes: CourseNode[];
}) {
  const [nodes, setNodes] = useState<CourseNode[]>(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNodes.find((n) => n.type === "page")?.id ?? null
  );
  const [editState, setEditState] = useState<EditState | null>(() => {
    const first = initialNodes.find((n) => n.type === "page");
    return first
      ? { title: first.title, content: first.content, published: first.published }
      : null;
  });
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const selectPage = useCallback((node: CourseNode) => {
    if (node.type !== "page") return;
    setSelectedId(node.id);
    setEditState({ title: node.title, content: node.content, published: node.published });
    setSaveError(null);
  }, []);

  const toggleFolder = (id: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const createNode = async (type: "page" | "folder", parentId: string | null = null) => {
    setShowMenu(false);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, parentId }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok) throw new Error(json?.error ?? "Create failed.");
      const newNode: CourseNode = {
        id: json.id!,
        title: type === "folder" ? "New folder" : "New page",
        type,
        parentId,
        sortOrder: nodes.length + 1,
        published: true,
        content: "",
      };
      setNodes((prev) => [...prev, newNode]);
      if (type === "page") selectPage(newNode);
      // Expand parent folder if one was specified
      if (parentId) {
        setCollapsedFolders((prev) => {
          const next = new Set(prev);
          next.delete(parentId);
          return next;
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create.");
    }
  };

  const deleteNode = async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const label = node.type === "folder" ? "folder and all its pages" : "page";
    if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/courses/${course.id}/nodes/${nodeId}`, { method: "DELETE" });
      setNodes((prev) => prev.filter((n) => n.id !== nodeId && n.parentId !== nodeId));
      if (selectedId === nodeId || nodes.find((n) => n.parentId === nodeId && n.id === selectedId)) {
        setSelectedId(null);
        setEditState(null);
      }
    } catch {
      alert("Delete failed.");
    }
  };

  const renameNode = async (nodeId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, title: newTitle } : n)));
    // If this is the currently selected page, update edit state title too
    if (selectedId === nodeId && editState) {
      setEditState((s) => (s ? { ...s, title: newTitle } : s));
    }
    await fetch(`/api/admin/courses/${course.id}/nodes/${nodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    }).catch(() => {});
  };

  const savePage = async () => {
    if (!selectedNode || !editState) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/nodes/${selectedNode.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editState.title,
          content: editState.content,
          published: editState.published,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json?.error ?? "Save failed.");
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedNode.id
            ? { ...n, title: editState.title, content: editState.content, published: editState.published }
            : n
        )
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const topLevel = nodes.filter((n) => !n.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const childrenOf = (folderId: string) =>
    nodes.filter((n) => n.parentId === folderId).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex" style={{ height: "calc(100vh - 130px)" }}>
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-800 bg-gray-900/40 flex flex-col">
        {/* Course title + menu */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base leading-snug truncate">{course.title}</h2>
              {/* Progress bar */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full">
                  <div className="h-1.5 bg-accent-500 rounded-full w-0" />
                </div>
                <span className="text-xs text-gray-500">0%</span>
              </div>
            </div>
            {/* ··· menu */}
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition font-bold tracking-widest text-xs"
                title="Add page or folder"
              >
                •••
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-44 overflow-hidden z-20">
                    <button
                      onClick={() => createNode("page")}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition flex items-center gap-2"
                    >
                      <span className="text-gray-400">▤</span> Add page
                    </button>
                    <button
                      onClick={() => createNode("folder")}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition flex items-center gap-2"
                    >
                      <span className="text-gray-400">📁</span> Add folder
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Node tree */}
        <div className="flex-1 overflow-y-auto py-2 px-1">
          {topLevel.length === 0 ? (
            <p className="text-xs text-gray-500 px-4 py-6 text-center leading-relaxed">
              No content yet.<br />Click ••• to add a page or folder.
            </p>
          ) : (
            topLevel.map((node) =>
              node.type === "folder" ? (
                <FolderItem
                  key={node.id}
                  folder={node}
                  children={childrenOf(node.id)}
                  collapsed={collapsedFolders.has(node.id)}
                  selectedId={selectedId}
                  onToggle={() => toggleFolder(node.id)}
                  onSelectPage={selectPage}
                  onAddPage={() => createNode("page", node.id)}
                  onDelete={deleteNode}
                  onRename={renameNode}
                />
              ) : (
                <PageItem
                  key={node.id}
                  node={node}
                  selected={selectedId === node.id}
                  indent={false}
                  onSelect={() => selectPage(node)}
                  onDelete={() => deleteNode(node.id)}
                  onRename={renameNode}
                />
              )
            )
          )}
        </div>
      </div>

      {/* ── Right pane ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedNode || selectedNode.type === "folder" ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-sm">Select a page from the sidebar to edit its content</p>
              <button
                onClick={() => createNode("page")}
                className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition"
              >
                + Add first page
              </button>
            </div>
          </div>
        ) : editState ? (
          <>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {saveError && (
                <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">
                  {saveError}
                </div>
              )}
              {/* Page title */}
              <input
                type="text"
                value={editState.title}
                onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                placeholder="Page title"
                className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none mb-6 border-none"
              />
              {/* Rich text editor */}
              <RichTextBlock
                value={editState.content}
                onChange={(next) => setEditState({ ...editState, content: next })}
                placeholder="Start writing your content here…"
              />
            </div>

            {/* Bottom save bar */}
            <div className="border-t border-gray-800 px-8 py-3 flex items-center justify-between bg-gray-950/80 flex-shrink-0">
              <button
                type="button"
                onClick={() =>
                  setEditState({
                    title: selectedNode.title,
                    content: selectedNode.content,
                    published: selectedNode.published,
                  })
                }
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className={`w-9 h-5 rounded-full relative transition-colors ${editState.published ? "bg-green-500" : "bg-gray-600"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditState({ ...editState, published: !editState.published });
                  }}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editState.published ? "translate-x-4" : ""}`}
                  />
                </div>
                <span className={`text-xs font-medium ${editState.published ? "text-green-400" : "text-gray-400"}`}>
                  {editState.published ? "Published" : "Draft"}
                </span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditState({
                      title: selectedNode.title,
                      content: selectedNode.content,
                      published: selectedNode.published,
                    });
                    setSaveError(null);
                  }}
                  className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={savePage}
                  disabled={saving}
                  className="px-6 py-1.5 bg-accent-500 hover:bg-accent-400 text-black text-sm font-bold rounded-lg disabled:opacity-50 transition"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ── Folder sidebar item ──────────────────────────────────────────────────────

function FolderItem({
  folder, children, collapsed, selectedId,
  onToggle, onSelectPage, onAddPage, onDelete, onRename,
}: {
  folder: CourseNode;
  children: CourseNode[];
  collapsed: boolean;
  selectedId: string | null;
  onToggle: () => void;
  onSelectPage: (n: CourseNode) => void;
  onAddPage: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(folder.title);
  const [showOpts, setShowOpts] = useState(false);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== folder.title) onRename(folder.id, draft);
    else setDraft(folder.title);
  };

  return (
    <div className="mb-0.5">
      {/* Folder row */}
      <div className="flex items-center gap-1 px-2 py-1.5 group rounded-lg hover:bg-gray-800/50 transition">
        <button onClick={onToggle} className="w-4 text-gray-500 text-xs flex-shrink-0 hover:text-gray-300">
          {collapsed ? "▶" : "▾"}
        </button>
        <span className="text-gray-500 text-sm flex-shrink-0">📁</span>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(folder.title); setEditing(false); }
            }}
            className="flex-1 text-sm bg-gray-700 rounded px-2 py-0.5 text-white focus:outline-none"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-gray-200 truncate cursor-default"
            onDoubleClick={() => { setDraft(folder.title); setEditing(true); }}
          >
            {folder.title}
          </span>
        )}
        <div className="relative opacity-0 group-hover:opacity-100 transition flex-shrink-0">
          <button
            onClick={() => setShowOpts((v) => !v)}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-600 text-xs font-bold"
          >
            •••
          </button>
          {showOpts && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowOpts(false)} />
              <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-36 overflow-hidden z-20">
                <button onClick={() => { setShowOpts(false); onAddPage(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition">
                  Add page
                </button>
                <button onClick={() => { setShowOpts(false); setDraft(folder.title); setEditing(true); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition">
                  Rename
                </button>
                <button onClick={() => { setShowOpts(false); onDelete(folder.id); }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 transition">
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Children */}
      {!collapsed && (
        <div className="ml-5 border-l border-gray-800 pl-1">
          {children.map((child) => (
            <PageItem
              key={child.id}
              node={child}
              selected={selectedId === child.id}
              indent
              onSelect={() => onSelectPage(child)}
              onDelete={() => onDelete(child.id)}
              onRename={onRename}
            />
          ))}
          <button
            onClick={onAddPage}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:text-gray-400 transition"
          >
            + Add page
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page sidebar item ────────────────────────────────────────────────────────

function PageItem({
  node, selected, indent, onSelect, onDelete, onRename,
}: {
  node: CourseNode;
  selected: boolean;
  indent: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const [showOpts, setShowOpts] = useState(false);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== node.title) onRename(node.id, draft);
    else setDraft(node.title);
  };

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg group transition mb-0.5 ${
        selected
          ? "bg-yellow-400/15 text-yellow-200"
          : "hover:bg-gray-800/50 text-gray-400"
      } ${indent ? "" : ""}`}
    >
      <span className="text-xs flex-shrink-0 text-gray-600">▤</span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(node.title); setEditing(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-sm bg-gray-700 rounded px-2 py-0.5 text-white focus:outline-none"
        />
      ) : (
        <span
          onClick={onSelect}
          className="flex-1 text-sm truncate cursor-pointer"
          onDoubleClick={(e) => { e.stopPropagation(); setDraft(node.title); setEditing(true); }}
        >
          {node.title}
        </span>
      )}
      {!node.published && <span className="text-[10px] text-gray-600 flex-shrink-0" title="Draft">●</span>}
      <div className="relative opacity-0 group-hover:opacity-100 transition flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setShowOpts((v) => !v); }}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-gray-600 text-xs font-bold"
        >
          •••
        </button>
        {showOpts && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowOpts(false)} />
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-32 overflow-hidden z-20">
              <button
                onClick={(e) => { e.stopPropagation(); setShowOpts(false); setDraft(node.title); setEditing(true); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition"
              >
                Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowOpts(false); onDelete(); }}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 transition"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
