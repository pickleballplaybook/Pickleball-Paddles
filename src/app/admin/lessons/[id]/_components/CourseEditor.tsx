"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

type PdfAttachment = { name: string; url: string };

type DrillOption = { id: string; name: string; imageUrl: string };

type CourseNode = {
  id: string;
  title: string;
  subtitle: string | null;
  type: string;
  parentId: string | null;
  sortOrder: number;
  published: boolean;
  content: string;
  thumbnailUrl: string | null;
  pdfAttachments: PdfAttachment[];
  minLevel: number | null;
  minTier: "basic" | "pro" | null;
  drillIds: string[];
  videoStorageUrl: string | null;
  videoThumbnailUrl: string | null;
  category: "technique" | "strategy" | "mindset" | null;
};

type EditState = {
  title: string;
  content: string;
  published: boolean;
  pdfAttachments: PdfAttachment[];
  drillIds: string[];
  videoStorageUrl: string | null;
  videoThumbnailUrl: string | null;
  category: "technique" | "strategy" | "mindset" | null;
};

const PAGE_CATEGORIES = [
  { value: null, label: "None" },
  { value: "technique", label: "Technique" },
  { value: "strategy", label: "Strategy" },
  { value: "mindset", label: "Mindset" },
] as const;

type FolderEditState = {
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  minLevel: number | null;
  minTier: "basic" | "pro" | null;
};

type DndCtx = {
  dragId: string | null;
  dropInfo: { targetId: string; position: "before" | "after" | "into" } | null;
  onDragStart: (id: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, targetId: string, targetType: "page" | "folder") => void;
  onDrop: (e: React.DragEvent) => void;
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
      ? { title: first.title, content: first.content, published: first.published, pdfAttachments: first.pdfAttachments ?? [], drillIds: first.drillIds ?? [], videoStorageUrl: first.videoStorageUrl ?? null, videoThumbnailUrl: first.videoThumbnailUrl ?? null, category: first.category ?? null }
      : null;
  });
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`lesson-folders-${course.id}`);
      if (saved) return new Set(JSON.parse(saved) as string[]);
    } catch {}
    return new Set(initialNodes.filter((n) => n.type === "folder").map((n) => n.id));
  });
  const [showMenu, setShowMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [folderEditState, setFolderEditState] = useState<FolderEditState | null>(null);
  const [folderSaving, setFolderSaving] = useState(false);
  const [folderSavedFlash, setFolderSavedFlash] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailDragOver, setThumbnailDragOver] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfDragOver, setPdfDragOver] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [allDrills, setAllDrills] = useState<DrillOption[]>([]);
  const [drillSearch, setDrillSearch] = useState("");

  // ── Drag-and-drop state ──────────────────────────────────────────────────
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropInfo, setDropInfo] = useState<{
    targetId: string;
    position: "before" | "after" | "into";
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/drills/list-all")
      .then((r) => r.json())
      .then((json: { drills?: { id: string; name: string; imageUrl: string }[] }) => {
        if (Array.isArray(json.drills)) setAllDrills(json.drills);
      })
      .catch(() => {});
  }, []);

  // Auto-generate thumbnail for any lesson that has a video but no thumbnail
  useEffect(() => {
    if (!editState?.videoStorageUrl || editState.videoThumbnailUrl || !selectedId) return;
    const nodeId = selectedId;
    const videoUrl = editState.videoStorageUrl;
    let cancelled = false;

    (async () => {
      try {
        // First call request-video-upload to ensure bucket CORS includes GET
        const slotRes = await fetch("/api/admin/lessons/request-video-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: "thumbnail.jpg", contentType: "image/jpeg" }),
        });
        const slot = (await slotRes.json().catch(() => null)) as { signedUrl?: string; publicUrl?: string } | null;
        if (cancelled || !slot?.signedUrl) return;

        // Extract frame from the already-uploaded video using canvas
        const thumbBlob = await new Promise<Blob | null>((resolve) => {
          const video = document.createElement("video");
          video.crossOrigin = "anonymous";
          video.muted = true;
          video.preload = "metadata";
          video.src = videoUrl;
          const timer = setTimeout(() => { video.src = ""; resolve(null); }, 30000);
          video.onloadeddata = () => {
            video.currentTime = Math.min(2, video.duration * 0.05);
          };
          video.onseeked = () => {
            clearTimeout(timer);
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const ctx = canvas.getContext("2d");
            if (!ctx) { video.src = ""; resolve(null); return; }
            try { ctx.drawImage(video, 0, 0); } catch { video.src = ""; resolve(null); return; }
            video.src = "";
            canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
          };
          video.onerror = () => { clearTimeout(timer); video.src = ""; resolve(null); };
        });

        if (cancelled || !thumbBlob) return;

        await fetch(slot.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: thumbBlob,
        });

        if (cancelled) return;
        const thumbUrl = slot.publicUrl!;

        setEditState((s) => s ? { ...s, videoThumbnailUrl: thumbUrl } : s);

        // Auto-save thumbnail URL to Firestore immediately
        await fetch(`/api/admin/courses/${course.id}/nodes/${nodeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoThumbnailUrl: thumbUrl }),
        });
      } catch {
        // Silent fail — thumbnail stays null, user can upload manually
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, editState?.videoStorageUrl, editState?.videoThumbnailUrl]);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const selectPage = useCallback((node: CourseNode) => {
    if (node.type !== "page") return;
    setSelectedId(node.id);
    setEditState({ title: node.title, content: node.content, published: node.published, pdfAttachments: node.pdfAttachments ?? [], drillIds: node.drillIds ?? [], videoStorageUrl: node.videoStorageUrl ?? null, videoThumbnailUrl: node.videoThumbnailUrl ?? null, category: node.category ?? null });
    setFolderEditState(null);
    setSaveError(null);
  }, []);

  const selectFolder = useCallback((node: CourseNode) => {
    if (node.type !== "folder") return;
    setSelectedId(node.id);
    setEditState(null);
    setFolderEditState({ title: node.title, subtitle: node.subtitle ?? "", thumbnailUrl: node.thumbnailUrl ?? "", minLevel: node.minLevel ?? null, minTier: node.minTier ?? null });
  }, []);

  const uploadThumbnail = async (file: File) => {
    if (!folderEditState) return;
    setThumbnailUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/drills/upload-asset", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json?.error ?? "Upload failed.");
      setFolderEditState((s) => s ? { ...s, thumbnailUrl: json.url! } : s);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setThumbnailUploading(false);
    }
  };

  const uploadPdf = async (file: File) => {
    if (!editState) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) { alert("Only PDF files are accepted."); return; }
    setPdfUploading(true);
    try {
      const initRes = await fetch("/api/admin/lessons/request-pdf-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      const init = (await initRes.json().catch(() => null)) as {
        signedUrl?: string; publicUrl?: string; objectPath?: string; downloadToken?: string; name?: string; error?: string;
      } | null;
      if (!initRes.ok || !init?.signedUrl) throw new Error(init?.error ?? `Request failed (HTTP ${initRes.status}).`);

      const putRes = await fetch(init.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Storage upload failed (HTTP ${putRes.status}).`);

      const finalRes = await fetch("/api/admin/lessons/finalize-pdf-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectPath: init.objectPath, downloadToken: init.downloadToken }),
      });
      const final = (await finalRes.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!finalRes.ok || !final?.ok) throw new Error(final?.error ?? `Finalize failed (HTTP ${finalRes.status}).`);

      setEditState((s) => s ? { ...s, pdfAttachments: [...s.pdfAttachments, { name: init.name ?? file.name, url: init.publicUrl! }] } : s);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setPdfUploading(false);
    }
  };

  const removePdf = (url: string) => {
    setEditState((s) => s ? { ...s, pdfAttachments: s.pdfAttachments.filter((a) => a.url !== url) } : s);
  };

  const extractVideoThumbnail = (file: File): Promise<Blob | null> =>
    new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.muted = true;
      video.preload = "metadata";
      video.src = url;
      video.onloadeddata = () => {
        video.currentTime = Math.min(2, video.duration * 0.05);
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
        ctx.drawImage(video, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
      };
      video.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    });

  const uploadVideo = async (file: File) => {
    if (!editState) return;
    if (!file.type.startsWith("video/")) { alert("Only video files are accepted."); return; }
    setVideoUploading(true);
    setVideoUploadProgress(0);
    try {
      // Request signed URLs for video and thumbnail in parallel
      const [initRes, thumbBlob] = await Promise.all([
        fetch("/api/admin/lessons/request-video-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        }),
        extractVideoThumbnail(file),
      ]);

      const init = (await initRes.json().catch(() => null)) as {
        signedUrl?: string; publicUrl?: string; error?: string;
      } | null;
      if (!initRes.ok || !init?.signedUrl) throw new Error(init?.error ?? `Request failed (HTTP ${initRes.status}).`);

      // Request thumbnail signed URL if we extracted a frame
      let thumbPublicUrl: string | null = null;
      if (thumbBlob) {
        const thumbInitRes = await fetch("/api/admin/lessons/request-video-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: "thumbnail.jpg", contentType: "image/jpeg" }),
        });
        const thumbInit = (await thumbInitRes.json().catch(() => null)) as {
          signedUrl?: string; publicUrl?: string;
        } | null;
        if (thumbInit?.signedUrl) {
          await fetch(thumbInit.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": "image/jpeg" },
            body: thumbBlob,
          });
          thumbPublicUrl = thumbInit.publicUrl ?? null;
        }
      }

      // Upload video with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setVideoUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Storage upload failed (HTTP ${xhr.status}).`));
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.open("PUT", init.signedUrl!);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setEditState((s) => s ? { ...s, videoStorageUrl: init.publicUrl!, videoThumbnailUrl: thumbPublicUrl } : s);

      // Auto-persist so thumbnail is never lost if the user navigates away before saving
      if (selectedId) {
        await fetch(`/api/admin/courses/${course.id}/nodes/${selectedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoStorageUrl: init.publicUrl!, videoThumbnailUrl: thumbPublicUrl }),
        }).catch(() => {});
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setVideoUploading(false);
      setVideoUploadProgress(0);
    }
  };

  const saveFolder = async () => {
    if (!selectedNode || selectedNode.type !== "folder" || !folderEditState) return;
    setFolderSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/nodes/${selectedNode.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: folderEditState.title,
          subtitle: folderEditState.subtitle || null,
          thumbnailUrl: folderEditState.thumbnailUrl || null,
          minLevel: folderEditState.minLevel,
          minTier: folderEditState.minTier,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json?.error ?? "Save failed.");
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedNode.id
            ? { ...n, title: folderEditState.title, subtitle: folderEditState.subtitle || null, thumbnailUrl: folderEditState.thumbnailUrl || null, minLevel: folderEditState.minLevel, minTier: folderEditState.minTier }
            : n
        )
      );
      setFolderSavedFlash(true);
      setTimeout(() => setFolderSavedFlash(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setFolderSaving(false);
    }
  };

  const toggleFolder = (id: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem(`lesson-folders-${course.id}`, JSON.stringify(Array.from(next)));
      } catch {}
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
        subtitle: null,
        type,
        parentId,
        sortOrder: nodes.length + 1,
        published: true,
        content: "",
        thumbnailUrl: null,
        pdfAttachments: [],
        minLevel: null,
        minTier: null,
        drillIds: [],
        videoStorageUrl: null,
        videoThumbnailUrl: null,
        category: null,
      };
      setNodes((prev) => [...prev, newNode]);
      if (type === "page") selectPage(newNode);
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
          pdfAttachments: editState.pdfAttachments,
          drillIds: editState.drillIds,
          videoStorageUrl: editState.videoStorageUrl,
          videoThumbnailUrl: editState.videoThumbnailUrl,
          category: editState.category ?? null,
          courseTitle: course.title,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json?.error ?? "Save failed.");
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedNode.id
            ? { ...n, title: editState.title, content: editState.content, published: editState.published, pdfAttachments: editState.pdfAttachments, drillIds: editState.drillIds, videoStorageUrl: editState.videoStorageUrl, videoThumbnailUrl: editState.videoThumbnailUrl, category: editState.category }
            : n
        )
      );
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const moveNode = async (nodeId: string, siblings: CourseNode[], direction: -1 | 1) => {
    const idx = siblings.findIndex((n) => n.id === nodeId);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const newOrderA = swapIdx * 10;
    const newOrderB = idx * 10;
    try {
      await Promise.all([
        fetch(`/api/admin/courses/${course.id}/nodes/${siblings[idx].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: newOrderA }),
        }),
        fetch(`/api/admin/courses/${course.id}/nodes/${siblings[swapIdx].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: newOrderB }),
        }),
      ]);
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === siblings[idx].id) return { ...n, sortOrder: newOrderA };
          if (n.id === siblings[swapIdx].id) return { ...n, sortOrder: newOrderB };
          return n;
        })
      );
    } catch {
      alert("Failed to reorder.");
    }
  };

  // ── DnD handlers ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback((id: string, e: React.DragEvent) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    // Make ghost image less jarring
    e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 12, 12);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDropInfo(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string, targetType: "page" | "folder") => {
      if (!dragId || dragId === targetId) return;
      e.preventDefault();
      e.stopPropagation();

      const dragNode = nodes.find((n) => n.id === dragId);
      if (!dragNode) return;

      if (dragNode.type === "page" && targetType === "folder") {
        // Page over folder → drop into that folder
        setDropInfo({ targetId, position: "into" });
        return;
      }

      // For everything else: top-half = before, bottom-half = after
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const fraction = (e.clientY - rect.top) / rect.height;
      setDropInfo({ targetId, position: fraction < 0.5 ? "before" : "after" });
    },
    [dragId, nodes]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const info = dropInfo;
      const id = dragId;
      setDragId(null);
      setDropInfo(null);
      if (!id || !info) return;

      const dragNode = nodes.find((n) => n.id === id);
      const targetNode = nodes.find((n) => n.id === info.targetId);
      if (!dragNode || !targetNode || id === info.targetId) return;

      if (dragNode.type === "folder") {
        // Reorder top-level folders (never into another folder)
        if (targetNode.type !== "folder" || info.position === "into") return;
        const allFolders = nodes
          .filter((n) => !n.parentId && n.type === "folder")
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const without = allFolders.filter((n) => n.id !== id);
        const targetIdx = without.findIndex((n) => n.id === info.targetId);
        const insertIdx = info.position === "before" ? targetIdx : targetIdx + 1;
        without.splice(insertIdx, 0, dragNode);
        const updates = without.map((n, i) => ({ id: n.id, sortOrder: i * 10 }));
        await Promise.all(
          updates.map((u) =>
            fetch(`/api/admin/courses/${course.id}/nodes/${u.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sortOrder: u.sortOrder }),
            })
          )
        );
        setNodes((prev) =>
          prev.map((n) => {
            const u = updates.find((up) => up.id === n.id);
            return u ? { ...n, sortOrder: u.sortOrder } : n;
          })
        );
        return;
      }

      // Dragging a page
      if (info.position === "into") {
        // Move page into a folder
        if (targetNode.type !== "folder") return;
        const siblings = nodes
          .filter((n) => n.parentId === targetNode.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const newSortOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.sortOrder)) + 10 : 0;
        await fetch(`/api/admin/courses/${course.id}/nodes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: targetNode.id, sortOrder: newSortOrder }),
        });
        setNodes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, parentId: targetNode.id, sortOrder: newSortOrder } : n))
        );
        // Expand target folder so user sees the page land
        setCollapsedFolders((prev) => {
          const next = new Set(prev);
          next.delete(targetNode.id);
          try { localStorage.setItem(`lesson-folders-${course.id}`, JSON.stringify(Array.from(next))); } catch {}
          return next;
        });
      } else {
        // Drop before/after another page (may change parent)
        if (targetNode.type !== "page") return;
        const newParentId = targetNode.parentId;
        const siblings = nodes
          .filter((n) => n.parentId === newParentId && n.type === "page")
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const without = siblings.filter((n) => n.id !== id);
        const targetIdx = without.findIndex((n) => n.id === info.targetId);
        const insertIdx = info.position === "before" ? targetIdx : targetIdx + 1;
        without.splice(insertIdx, 0, dragNode);
        const updates = without.map((n, i) => ({ id: n.id, sortOrder: i * 10 }));
        const parentChanged = dragNode.parentId !== newParentId;
        await Promise.all(
          updates.map((u) =>
            fetch(`/api/admin/courses/${course.id}/nodes/${u.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                u.id === id && parentChanged
                  ? { parentId: newParentId, sortOrder: u.sortOrder }
                  : { sortOrder: u.sortOrder }
              ),
            })
          )
        );
        setNodes((prev) =>
          prev.map((n) => {
            const u = updates.find((up) => up.id === n.id);
            if (!u) return n;
            return {
              ...n,
              sortOrder: u.sortOrder,
              ...(u.id === id && parentChanged ? { parentId: newParentId } : {}),
            };
          })
        );
      }
    },
    [dragId, dropInfo, nodes, course.id]
  );

  const dnd: DndCtx = {
    dragId,
    dropInfo,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  const topLevel = nodes.filter((n) => !n.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const childrenOf = (folderId: string) =>
    nodes.filter((n) => n.parentId === folderId).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex h-full">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-800 bg-gray-900/40 flex flex-col">
        {/* Course title + menu */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base leading-snug truncate">{course.title}</h2>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full">
                  <div className="h-1.5 bg-accent-500 rounded-full w-0" />
                </div>
                <span className="text-xs text-gray-500">0%</span>
              </div>
            </div>
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
        <div
          className="flex-1 overflow-y-auto py-2 px-1"
          onDragOver={(e) => e.preventDefault()}
        >
          {topLevel.length === 0 ? (
            <p className="text-xs text-gray-500 px-4 py-6 text-center leading-relaxed">
              No content yet.<br />Click ••• to add a page or folder.
            </p>
          ) : (
            topLevel.map((node, i) =>
              node.type === "folder" ? (
                <FolderItem
                  key={node.id}
                  folder={node}
                  children={childrenOf(node.id)}
                  collapsed={collapsedFolders.has(node.id)}
                  selectedId={selectedId}
                  onToggle={() => toggleFolder(node.id)}
                  onSelectPage={selectPage}
                  onSelectFolder={selectFolder}
                  onAddPage={() => createNode("page", node.id)}
                  onDelete={deleteNode}
                  onRename={renameNode}
                  isFirst={i === 0}
                  isLast={i === topLevel.length - 1}
                  onMoveUp={() => moveNode(node.id, topLevel, -1)}
                  onMoveDown={() => moveNode(node.id, topLevel, 1)}
                  onMoveChild={(childId, dir) => moveNode(childId, childrenOf(node.id), dir)}
                  dnd={dnd}
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
                  isFirst={i === 0}
                  isLast={i === topLevel.length - 1}
                  onMoveUp={() => moveNode(node.id, topLevel, -1)}
                  onMoveDown={() => moveNode(node.id, topLevel, 1)}
                  dnd={dnd}
                />
              )
            )
          )}
        </div>
      </div>

      {/* ── Right pane ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedNode?.type === "folder" && folderEditState ? (
          <>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-lg">
              <h3 className="text-lg font-bold text-white mb-6">Folder Settings</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Folder name</label>
                  <input
                    type="text"
                    value={folderEditState.title}
                    onChange={(e) => setFolderEditState({ ...folderEditState, title: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Subtitle</label>
                  <input
                    type="text"
                    value={folderEditState.subtitle}
                    onChange={(e) => setFolderEditState({ ...folderEditState, subtitle: e.target.value })}
                    placeholder="Optional — shown below the folder title"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent-500 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Thumbnail image</label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) uploadThumbnail(file);
                    }}
                  />
                  {folderEditState.thumbnailUrl ? (
                    <div className="relative group/thumb w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={folderEditState.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-40 object-cover rounded-xl border border-gray-700"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition rounded-xl flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg font-medium transition"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setFolderEditState((s) => s ? { ...s, thumbnailUrl: "" } : s)}
                          className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs rounded-lg font-medium transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setThumbnailDragOver(true); }}
                      onDragLeave={() => setThumbnailDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setThumbnailDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file?.type.startsWith("image/")) uploadThumbnail(file);
                      }}
                      onClick={() => thumbnailInputRef.current?.click()}
                      className={`w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                        thumbnailDragOver
                          ? "border-accent-400 bg-accent-500/10"
                          : "border-gray-700 hover:border-gray-500 bg-gray-800/40"
                      }`}
                    >
                      {thumbnailUploading ? (
                        <div className="text-sm text-gray-400">Uploading…</div>
                      ) : (
                        <>
                          <div className="text-3xl text-gray-600">🖼</div>
                          <p className="text-sm text-gray-400">Drop image here or <span className="text-accent-400 underline">click to browse</span></p>
                          <p className="text-xs text-gray-600">PNG, JPG, WebP</p>
                        </>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-1.5">Shown as the background on the category card in the app.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min level to unlock</label>
                  <div className="flex items-center gap-3">
                    <select
                      value={folderEditState.minLevel ?? ""}
                      onChange={(e) =>
                        setFolderEditState({
                          ...folderEditState,
                          minLevel: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
                    >
                      <option value="">No level requirement</option>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
                        <option key={l} value={l}>Level {l}+</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Users below this level will see a lock. Level 1 = everyone.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subscription tier required</label>
                  <div className="flex gap-2">
                    {(["none", "basic", "pro"] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() =>
                          setFolderEditState({
                            ...folderEditState,
                            minTier: tier === "none" ? null : tier,
                          })
                        }
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          (tier === "none" && folderEditState.minTier === null) ||
                          folderEditState.minTier === tier
                            ? "bg-accent-500 border-accent-500 text-black"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                        }`}
                      >
                        {tier === "none" ? "Open" : tier === "basic" ? "Silver" : "Gold"}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Silver and Gold members bypass the level requirement. Bronze members must meet the level gate.</p>
                </div>

              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 px-8 py-3 flex items-center justify-end gap-3 bg-gray-950/80 flex-shrink-0">
            {folderSavedFlash && (
              <span className="text-xs text-green-400 font-medium">Saved ✓</span>
            )}
            <button
              onClick={saveFolder}
              disabled={folderSaving}
              className="px-6 py-1.5 bg-accent-500 hover:bg-accent-400 text-black text-sm font-bold rounded-lg disabled:opacity-50 transition"
            >
              {folderSaving ? "Saving…" : "Save folder"}
            </button>
          </div>
          </>
        ) : !selectedNode ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-sm">Select a page or folder from the sidebar</p>
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
              <input
                type="text"
                value={editState.title}
                onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                placeholder="Page title"
                className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none mb-3 border-none"
              />

              {/* Page-level category */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs text-gray-500 font-medium flex-shrink-0">Page category:</span>
                <div className="flex gap-1.5">
                  {PAGE_CATEGORIES.map((cat) => (
                    <button
                      key={String(cat.value)}
                      type="button"
                      onClick={() => setEditState((s) => s ? { ...s, category: cat.value } : s)}
                      className={`px-3 py-0.5 rounded-full text-xs font-semibold border transition ${
                        editState.category === cat.value
                          ? "border-accent-500 bg-accent-500/15 text-accent-400"
                          : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <RichTextBlock
                value={editState.content}
                onChange={(next) => setEditState({ ...editState, content: next })}
                placeholder="Start writing your content here…"
              />

              {/* Video upload */}
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Video</p>
                {editState.videoStorageUrl ? (
                  <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3">
                    <span className="text-2xl flex-shrink-0">🎬</span>
                    <a
                      href={editState.videoStorageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-gray-200 hover:text-white truncate underline underline-offset-2"
                    >
                      {editState.videoStorageUrl.split("/").pop()?.split("?")[0] ?? "video"}
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditState((s) => s ? { ...s, videoStorageUrl: null, videoThumbnailUrl: null } : s)}
                      className="text-gray-600 hover:text-red-400 transition text-lg leading-none flex-shrink-0"
                      title="Remove video"
                    >×</button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setVideoDragOver(true); }}
                    onDragLeave={() => setVideoDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setVideoDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file?.type.startsWith("video/")) uploadVideo(file);
                    }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "video/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) uploadVideo(file);
                      };
                      input.click();
                    }}
                    className={`w-full h-24 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 cursor-pointer transition ${
                      videoDragOver
                        ? "border-accent-400 bg-accent-500/10"
                        : "border-gray-700 hover:border-gray-500 bg-gray-800/30"
                    }`}
                  >
                    {videoUploading ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm text-gray-400">Uploading… {videoUploadProgress}%</span>
                        <div className="w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-400 transition-all"
                            style={{ width: `${videoUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl text-gray-600">🎬</span>
                        <div>
                          <p className="text-sm text-gray-400">Drop video here or <span className="text-accent-400 underline">click to browse</span></p>
                          <p className="text-xs text-gray-600 mt-0.5">MP4, MOV, WebM — replaces the Vimeo iframe in-app</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">PDF Attachments</p>
                {editState.pdfAttachments.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {editState.pdfAttachments.map((pdf) => (
                      <div key={pdf.url} className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
                        <span className="text-red-400 text-lg flex-shrink-0">📄</span>
                        <input
                          type="text"
                          value={pdf.name}
                          onChange={(e) => setEditState((s) => s ? {
                            ...s,
                            pdfAttachments: s.pdfAttachments.map((p) =>
                              p.url === pdf.url ? { ...p, name: e.target.value } : p
                            ),
                          } : s)}
                          className="flex-1 text-sm text-gray-200 bg-transparent border-b border-transparent hover:border-gray-600 focus:border-accent-500 focus:outline-none py-0.5 min-w-0"
                          placeholder="PDF name"
                        />
                        <a
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-300 transition flex-shrink-0 text-sm"
                          title="Open PDF"
                        >
                          ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => removePdf(pdf.url)}
                          className="text-gray-600 hover:text-red-400 transition text-lg leading-none flex-shrink-0"
                          title="Remove PDF"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) uploadPdf(file);
                  }}
                />
                <div
                  onDragOver={(e) => { e.preventDefault(); setPdfDragOver(true); }}
                  onDragLeave={() => setPdfDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setPdfDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) uploadPdf(file);
                  }}
                  onClick={() => pdfInputRef.current?.click()}
                  className={`w-full h-24 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 cursor-pointer transition ${
                    pdfDragOver
                      ? "border-accent-400 bg-accent-500/10"
                      : "border-gray-700 hover:border-gray-500 bg-gray-800/30"
                  }`}
                >
                  {pdfUploading ? (
                    <span className="text-sm text-gray-400">Uploading…</span>
                  ) : (
                    <>
                      <span className="text-2xl text-gray-600">📎</span>
                      <div>
                        <p className="text-sm text-gray-400">Drop a PDF here or <span className="text-accent-400 underline">click to browse</span></p>
                        <p className="text-xs text-gray-600 mt-0.5">Max 50 MB</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Drills section */}
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Drills</p>
                {editState.drillIds.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {editState.drillIds.map((id) => {
                      const drill = allDrills.find((d) => d.id === id);
                      return (
                        <div key={id} className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
                          {drill?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={drill.imageUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-700 flex-shrink-0 flex items-center justify-center text-gray-500 text-sm">▶</div>
                          )}
                          <span className="flex-1 text-sm text-gray-200 truncate">{drill?.name ?? id}</span>
                          <button
                            type="button"
                            onClick={() => setEditState((s) => s ? { ...s, drillIds: s.drillIds.filter((x) => x !== id) } : s)}
                            className="text-gray-600 hover:text-red-400 transition text-lg leading-none flex-shrink-0"
                            title="Remove drill"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Search drills to add…"
                  value={drillSearch}
                  onChange={(e) => setDrillSearch(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-500 mb-2"
                />
                {drillSearch.trim().length > 0 && (
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-700 bg-gray-900">
                    {allDrills
                      .filter(
                        (d) =>
                          d.name.toLowerCase().includes(drillSearch.toLowerCase()) &&
                          !editState.drillIds.includes(d.id)
                      )
                      .slice(0, 20)
                      .map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setEditState((s) => s ? { ...s, drillIds: [...s.drillIds, d.id] } : s);
                            setDrillSearch("");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 transition text-left"
                        >
                          {d.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={d.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-700 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs">▶</div>
                          )}
                          <span className="text-sm text-gray-200 truncate">{d.name}</span>
                        </button>
                      ))}
                    {allDrills.filter(
                      (d) => d.name.toLowerCase().includes(drillSearch.toLowerCase()) && !editState.drillIds.includes(d.id)
                    ).length === 0 && (
                      <p className="text-xs text-gray-600 px-3 py-3">No drills found.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-800 px-8 py-3 flex items-center justify-between bg-gray-950/80 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditState((s) => s ? { ...s, published: !s.published } : s)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className={`w-9 h-5 rounded-full relative transition-colors ${editState.published ? "bg-green-500" : "bg-gray-600"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editState.published ? "translate-x-4" : ""}`} />
                </div>
                <span className={`text-xs font-medium ${editState.published ? "text-green-400" : "text-gray-400"}`}>
                  {editState.published ? "Published" : "Draft"}
                </span>
              </button>

              <div className="flex items-center gap-3">
                {savedFlash && <span className="text-xs text-green-400 font-medium">Saved ✓</span>}
                {saveError && <span className="text-xs text-red-400 font-medium" title={saveError}>Save failed</span>}
                <button
                  type="button"
                  onClick={() => {
                    setEditState({
                      title: selectedNode.title,
                      content: selectedNode.content,
                      published: selectedNode.published,
                      pdfAttachments: selectedNode.pdfAttachments ?? [],
                      drillIds: selectedNode.drillIds ?? [],
                      videoStorageUrl: selectedNode.videoStorageUrl ?? null,
                      videoThumbnailUrl: selectedNode.videoThumbnailUrl ?? null,
                      category: selectedNode.category ?? null,
                    });
                    setSaveError(null);
                  }}
                  className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
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
  onToggle, onSelectPage, onSelectFolder, onAddPage, onDelete, onRename,
  isFirst, isLast, onMoveUp, onMoveDown, onMoveChild, dnd,
}: {
  folder: CourseNode;
  children: CourseNode[];
  collapsed: boolean;
  selectedId: string | null;
  onToggle: () => void;
  onSelectPage: (n: CourseNode) => void;
  onSelectFolder: (n: CourseNode) => void;
  onAddPage: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveChild?: (nodeId: string, direction: -1 | 1) => void;
  dnd: DndCtx;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(folder.title);
  const [showOpts, setShowOpts] = useState(false);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== folder.title) onRename(folder.id, draft);
    else setDraft(folder.title);
  };

  const isDragging = dnd.dragId === folder.id;
  const dropPos = dnd.dropInfo?.targetId === folder.id ? dnd.dropInfo.position : null;

  return (
    <div className="mb-0.5">
      {/* Drop indicator: before */}
      {dropPos === "before" && (
        <div className="h-0.5 bg-blue-400 rounded mx-1 mb-0.5" />
      )}

      {/* Folder row */}
      <div
        draggable
        onDragStart={(e) => dnd.onDragStart(folder.id, e)}
        onDragEnd={dnd.onDragEnd}
        onDragOver={(e) => dnd.onDragOver(e, folder.id, "folder")}
        onDrop={dnd.onDrop}
        className={`flex items-center gap-1 px-2 py-1.5 group rounded-lg transition ${
          isDragging ? "opacity-40" : ""
        } ${
          dropPos === "into"
            ? "bg-blue-500/10 ring-1 ring-blue-400/50"
            : selectedId === folder.id
            ? "bg-yellow-400/10"
            : "hover:bg-gray-800/50"
        }`}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {/* Drag handle */}
        <span className="text-gray-700 group-hover:text-gray-500 text-xs flex-shrink-0 select-none" title="Drag to reorder">⠿</span>
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
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-gray-200 truncate cursor-pointer"
            onClick={() => onSelectFolder(folder)}
            onDoubleClick={() => { setDraft(folder.title); setEditing(true); }}
          >
            {folder.title}
          </span>
        )}
        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 flex-shrink-0">
          <button onClick={onMoveUp} disabled={isFirst} title="Move up" className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-gray-600 text-xs disabled:opacity-20 disabled:cursor-not-allowed">↑</button>
          <button onClick={onMoveDown} disabled={isLast} title="Move down" className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-gray-600 text-xs disabled:opacity-20 disabled:cursor-not-allowed">↓</button>
          <div className="relative">
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
      </div>

      {/* Drop indicator: after */}
      {dropPos === "after" && (
        <div className="h-0.5 bg-blue-400 rounded mx-1 mt-0.5" />
      )}

      {/* Children */}
      {!collapsed && (
        <div className="ml-5 border-l border-gray-800 pl-1">
          {children.map((child, i) => (
            <PageItem
              key={child.id}
              node={child}
              selected={selectedId === child.id}
              indent
              onSelect={() => onSelectPage(child)}
              onDelete={() => onDelete(child.id)}
              onRename={onRename}
              isFirst={i === 0}
              isLast={i === children.length - 1}
              onMoveUp={() => onMoveChild?.(child.id, -1)}
              onMoveDown={() => onMoveChild?.(child.id, 1)}
              dnd={dnd}
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
  isFirst, isLast, onMoveUp, onMoveDown, dnd,
}: {
  node: CourseNode;
  selected: boolean;
  indent: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (id: string, title: string) => void;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  dnd: DndCtx;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const [showOpts, setShowOpts] = useState(false);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== node.title) onRename(node.id, draft);
    else setDraft(node.title);
  };

  const isDragging = dnd.dragId === node.id;
  const dropPos = dnd.dropInfo?.targetId === node.id ? dnd.dropInfo.position : null;

  return (
    <div>
      {/* Drop indicator: before */}
      {dropPos === "before" && (
        <div className="h-0.5 bg-blue-400 rounded mx-1 mb-0.5" />
      )}

      <div
        draggable
        onDragStart={(e) => dnd.onDragStart(node.id, e)}
        onDragEnd={dnd.onDragEnd}
        onDragOver={(e) => dnd.onDragOver(e, node.id, "page")}
        onDrop={dnd.onDrop}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg group transition mb-0.5 ${
          isDragging
            ? "opacity-40"
            : selected
            ? "bg-yellow-400/15 text-yellow-200"
            : "hover:bg-gray-800/50 text-gray-400"
        }`}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {/* Drag handle */}
        <span className="text-gray-700 group-hover:text-gray-500 text-xs flex-shrink-0 select-none">⠿</span>
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
        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} title="Move up" className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-gray-600 text-xs disabled:opacity-20 disabled:cursor-not-allowed">↑</button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} title="Move down" className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-gray-600 text-xs disabled:opacity-20 disabled:cursor-not-allowed">↓</button>
          <div className="relative">
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
      </div>

      {/* Drop indicator: after */}
      {dropPos === "after" && (
        <div className="h-0.5 bg-blue-400 rounded mx-1 mt-0.5" />
      )}
    </div>
  );
}
