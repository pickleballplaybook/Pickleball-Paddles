"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LANGUAGE_OPTIONS = [
  { code: "es", label: "Spanish" },
  { code: "zh", label: "Mandarin Chinese" },
  { code: "pt", label: "Brazilian Portuguese" },
  { code: "vi", label: "Vietnamese" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
];

type JobStatus =
  | "idle"
  | "uploading"
  | "queued"
  | "downloading"
  | "transcribing"
  | "translating"
  | "synthesizing"
  | "muxing"
  | "done"
  | "error";

interface JobState {
  jobId: string;
  status: JobStatus;
  progress: string;
  outputs: Record<string, string>;
}

const LANG_NAMES: Record<string, string> = {
  es: "Spanish", zh: "Mandarin Chinese", pt: "Brazilian Portuguese",
  vi: "Vietnamese", fr: "French", de: "German", ja: "Japanese", ko: "Korean",
};

export default function DubClient() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [languages, setLanguages] = useState<string[]>(["es", "zh", "pt", "vi"]);
  const [hd, setHd] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [job, setJob] = useState<JobState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = (jobId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/dub/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setJob((prev) => ({ ...prev!, ...data }));
        if (data.status === "done" || data.status === "error") {
          stopPolling();
        }
      } catch {
        // ignore transient errors
      }
    }, 5000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) setFile(f);
  }, []);

  const toggleLang = (code: string) => {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    if (!file || languages.length === 0) return;
    setError(null);
    setUploadProgress(0);

    try {
      // 1. Get a signed upload URL from the server
      const urlRes = await fetch("/api/admin/dub/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, storagePath } = await urlRes.json();

      // 2. Upload directly to Firebase Storage, tracking progress
      setJob({ jobId: "", status: "uploading", progress: "Uploading video...", outputs: {} });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Upload network error"));
        xhr.send(file);
      });

      // 3. Start the Modal job
      const startRes = await fetch("/api/admin/dub/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath, languages, hd }),
      });
      if (!startRes.ok) throw new Error("Failed to start job");
      const { jobId } = await startRes.json();

      setJob({ jobId, status: "queued", progress: "Job queued...", outputs: {} });
      startPolling(jobId);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setJob(null);
    }
  };

  const reset = () => {
    stopPolling();
    setFile(null);
    setJob(null);
    setError(null);
    setUploadProgress(0);
  };

  const isRunning = job !== null && job.status !== "done" && job.status !== "error";
  const isDone = job?.status === "done";

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer ${
          dragging
            ? "border-accent-400 bg-accent-500/10"
            : file
            ? "border-gray-600 bg-gray-900"
            : "border-gray-700 hover:border-gray-500 bg-gray-900"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />
        {file ? (
          <div>
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-gray-400 text-sm mt-1">{(file.size / 1e9).toFixed(2)} GB</p>
            {!isRunning && !isDone && (
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="mt-3 text-xs text-gray-500 hover:text-white underline"
              >
                Remove
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-300 font-medium">Drop video file here</p>
            <p className="text-gray-500 text-sm mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {/* Language selector */}
      {!isRunning && !isDone && (
        <>
          <div>
            <p className="text-sm text-gray-400 mb-3 font-medium">Languages</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGE_OPTIONS.map(({ code, label }) => {
                const active = languages.includes(code);
                return (
                  <button
                    key={code}
                    onClick={() => toggleLang(code)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                      active
                        ? "bg-accent-500 border-accent-500 text-black"
                        : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHd((v) => !v)}
              className={`w-10 h-6 rounded-full transition relative ${hd ? "bg-accent-500" : "bg-gray-700"}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  hd ? "left-5" : "left-1"
                }`}
              />
            </button>
            <span className="text-sm text-gray-400">
              HD voice{" "}
              <span className="text-gray-600">(tts-1-hd, ~2× cost)</span>
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!file || languages.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-accent-500 text-black hover:bg-accent-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Start Dubbing ({languages.length} language{languages.length !== 1 ? "s" : ""})
          </button>
        </>
      )}

      {/* Progress */}
      {job && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          {job.status === "uploading" && (
            <>
              <p className="text-sm text-gray-300">Uploading video...</p>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-accent-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{uploadProgress}%</p>
            </>
          )}

          {job.status !== "uploading" && !isDone && job.status !== "error" && (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-sm text-gray-300">{job.progress}</p>
            </div>
          )}

          {isDone && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-green-400">Done! Download your dubbed videos:</p>
              {Object.entries(job.outputs).map(([lang, url]) => (
                <a
                  key={lang}
                  href={url}
                  download
                  className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                >
                  <span className="text-sm font-medium">{LANG_NAMES[lang] ?? lang}</span>
                  <span className="text-xs text-gray-400">Download MP4</span>
                </a>
              ))}
              <button onClick={reset} className="text-xs text-gray-500 hover:text-white underline pt-1">
                Dub another video
              </button>
            </div>
          )}

          {job.status === "error" && (
            <div className="space-y-2">
              <p className="text-sm text-red-400 font-medium">Something went wrong</p>
              <p className="text-xs text-gray-500">{job.progress}</p>
              <button onClick={reset} className="text-xs text-gray-500 hover:text-white underline">
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
