"use client";

import { useState } from "react";
import Link from "next/link";
import type { Campaign, Platform } from "./types";
import { PlatformIcon } from "./PlatformIcon";

const ALL_PLATFORMS: Platform[] = ["instagram", "facebook", "youtube"];

const EMPTY: Omit<Campaign, "id" | "created_at"> = {
  name: "",
  keywords: [],
  platforms: [],
  target_mode: "all",
  target_post_ids: [],
  reply_text: "",
  dm_text: "",
  cta_link: "",
  is_active: true,
  starts_at: null,
  ends_at: null,
  match_once_per_user: true,
};

export function CampaignForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Campaign;
}) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial ?? {}) }));
  const [keywordInput, setKeywordInput] = useState("");
  const [postIdInput, setPostIdInput] = useState("");

  const update = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !form.keywords.includes(kw)) {
      update("keywords", [...form.keywords, kw]);
    }
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) =>
    update(
      "keywords",
      form.keywords.filter((k) => k !== kw)
    );

  const togglePlatform = (p: Platform) =>
    update(
      "platforms",
      form.platforms.includes(p)
        ? form.platforms.filter((x) => x !== p)
        : [...form.platforms, p]
    );

  const addPostId = () => {
    const id = postIdInput.trim();
    if (id && !form.target_post_ids.includes(id)) {
      update("target_post_ids", [...form.target_post_ids, id]);
    }
    setPostIdInput("");
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/auto-reply/campaigns"
          : `/api/admin/auto-reply/campaigns/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `request failed: ${res.status}`);
      }

      // Redirect to list page on success
      window.location.href = "/admin/auto-reply";
    } catch (err: any) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  const ytEnabled = form.platforms.includes("youtube");
  const dmCapable = form.platforms.some((p) => p === "instagram" || p === "facebook");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div className="lg:col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/auto-reply"
              className="text-sm text-gray-400 hover:text-white"
            >
              ← Campaigns
            </Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "create" ? "New Campaign" : form.name || "Edit Campaign"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/auto-reply"
              className="rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 px-4 py-2 text-sm font-medium"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-2 text-sm font-bold text-black"
            >
              {submitting
                ? "Saving..."
                : mode === "create"
                ? "Create campaign"
                : "Save changes"}
            </button>
          </div>
        </div>

        {/* LEFT: form */}
        <div className="space-y-6">
          {submitError && (
            <div className="rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
              <strong>Couldn&apos;t save:</strong> {submitError}
            </div>
          )}
          <Section title="Basics">
            <Field label="Campaign name">
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. SixZero Coral Code Drop"
                className="input"
              />
            </Field>

            <Field
              label="Trigger keywords"
              hint="When a comment contains any of these words, the campaign fires. Case-insensitive."
            >
              <div className="flex gap-2">
                <input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                  placeholder="Type a keyword and press Enter"
                  className="input flex-1"
                />
                <button onClick={addKeyword} className="btn-secondary">
                  Add
                </button>
              </div>
              {form.keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs font-mono text-gray-300"
                    >
                      {kw}
                      <button
                        onClick={() => removeKeyword(kw)}
                        className="text-gray-500 hover:text-white"
                        aria-label={`Remove ${kw}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
          </Section>

          <Section title="Platforms">
            <div className="grid grid-cols-3 gap-3">
              {ALL_PLATFORMS.map((p) => {
                const on = form.platforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      on
                        ? "border-green-500 bg-green-500/10 text-white"
                        : "border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                    }`}
                  >
                    <PlatformIcon platform={p} className="h-5 w-5" />
                    <div className="text-sm font-medium capitalize">
                      {p === "youtube" ? "YouTube" : p}
                    </div>
                  </button>
                );
              })}
            </div>
            {ytEnabled && (
              <p className="mt-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800 rounded px-3 py-2">
                ⓘ YouTube has no DM system. The DM step will be skipped on YouTube; only the public reply will be posted.
              </p>
            )}
          </Section>

          <Section title="Targeting">
            <Field label="Which posts/videos?">
              <div className="grid grid-cols-2 gap-2">
                {(["all", "specific"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => update("target_mode", m)}
                    className={`rounded-xl border p-3 text-left text-sm transition ${
                      form.target_mode === m
                        ? "border-green-500 bg-green-500/10"
                        : "border-gray-800 bg-gray-950 hover:border-gray-700"
                    }`}
                  >
                    <div className="font-medium text-white">
                      {m === "all" ? "All posts" : "Specific posts"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {m === "all"
                        ? "Trigger on any comment matching keywords"
                        : "Only listen to specific post/video IDs"}
                    </div>
                  </button>
                ))}
              </div>
            </Field>

            {form.target_mode === "specific" && (
              <Field
                label="Post / video IDs"
                hint="IG media id, FB post id, or YouTube video id (the part after watch?v=)"
              >
                <div className="flex gap-2">
                  <input
                    value={postIdInput}
                    onChange={(e) => setPostIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPostId();
                      }
                    }}
                    placeholder="Paste a post or video ID"
                    className="input flex-1"
                  />
                  <button onClick={addPostId} className="btn-secondary">
                    Add
                  </button>
                </div>
                {form.target_post_ids.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {form.target_post_ids.map((id) => (
                      <div
                        key={id}
                        className="flex items-center justify-between rounded border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs font-mono text-gray-300"
                      >
                        <span className="truncate">{id}</span>
                        <button
                          onClick={() =>
                            update(
                              "target_post_ids",
                              form.target_post_ids.filter((x) => x !== id)
                            )
                          }
                          className="text-gray-500 hover:text-white ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            )}
          </Section>

          <Section title="Public reply (posted as a comment)">
            <Field label="Reply text" hint="Use {{name}} to insert the commenter's name.">
              <textarea
                value={form.reply_text}
                onChange={(e) => update("reply_text", e.target.value)}
                rows={3}
                placeholder="Just sent you a DM with the code! 🏓"
                className="input resize-none"
              />
            </Field>
          </Section>

          <Section title="Direct message" disabled={!dmCapable}>
            {!dmCapable && (
              <p className="text-xs text-gray-500 bg-gray-950 rounded px-3 py-2 border border-gray-800">
                Enable Instagram or Facebook to send DMs. YouTube doesn&apos;t support DMs.
              </p>
            )}
            {dmCapable && (
              <>
                <Field label="DM text" hint="Use {{name}} to personalize.">
                  <textarea
                    value={form.dm_text ?? ""}
                    onChange={(e) => update("dm_text", e.target.value)}
                    rows={4}
                    placeholder="Hey {{name}}! Here's your code: PLAYBOOK10..."
                    className="input resize-none"
                  />
                </Field>
                <Field label="Call-to-action link (optional)">
                  <input
                    value={form.cta_link ?? ""}
                    onChange={(e) => update("cta_link", e.target.value)}
                    placeholder="https://pickleballplaybook.com/sixzero-coral"
                    className="input"
                  />
                </Field>
              </>
            )}
          </Section>

          <Section title="Schedule & behavior">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts at (optional)">
                <input
                  type="datetime-local"
                  value={toLocalDt(form.starts_at)}
                  onChange={(e) =>
                    update("starts_at", e.target.value ? new Date(e.target.value).toISOString() : null)
                  }
                  className="input"
                />
              </Field>
              <Field label="Ends at (optional)">
                <input
                  type="datetime-local"
                  value={toLocalDt(form.ends_at)}
                  onChange={(e) =>
                    update("ends_at", e.target.value ? new Date(e.target.value).toISOString() : null)
                  }
                  className="input"
                />
              </Field>
            </div>

            <label className="flex items-start gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.match_once_per_user}
                onChange={(e) => update("match_once_per_user", e.target.checked)}
                className="mt-0.5 accent-green-500"
              />
              <div>
                <div className="text-sm font-medium">Only fire once per user</div>
                <div className="text-xs text-gray-500">
                  Recommended. Prevents spamming someone who comments multiple times.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => update("is_active", e.target.checked)}
                className="mt-0.5 accent-green-500"
              />
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-gray-500">
                  Inactive campaigns won&apos;t trigger on new comments.
                </div>
              </div>
            </label>
          </Section>
        </div>

        {/* RIGHT: live preview */}
        <aside className="lg:sticky lg:top-6 self-start space-y-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-medium px-1">
            Preview
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 space-y-3">
            <div className="text-xs text-gray-500">Comment from @username</div>
            <div className="rounded bg-gray-950 border border-gray-800 px-3 py-2 text-sm text-gray-300">
              {form.keywords.length > 0
                ? `"Hey can I get the ${form.keywords[0]}?"`
                : '"Their comment will appear here"'}
            </div>

            <div className="text-xs text-gray-500 pt-2">Your auto-reply</div>
            <div className="rounded bg-green-500/20 border border-green-500/40 text-green-100 px-3 py-2 text-sm">
              {form.reply_text || (
                <span className="text-gray-500">Your reply text...</span>
              )}
            </div>

            {dmCapable && form.dm_text && (
              <>
                <div className="text-xs text-gray-500 pt-2">DM sent</div>
                <div className="rounded bg-blue-950/50 border border-blue-800/60 px-3 py-2 text-sm text-blue-100">
                  <div>{form.dm_text.replace(/\{\{name\}\}/g, "Austin")}</div>
                  {form.cta_link && (
                    <div className="mt-2 text-xs text-blue-300 underline truncate">
                      {form.cta_link}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Will fire on
            </div>
            {form.platforms.length === 0 ? (
              <p className="text-xs text-gray-500">Pick at least one platform</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {form.platforms.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-gray-300">
                    <PlatformIcon platform={p} className="h-3.5 w-3.5" />
                    <span className="capitalize">{p === "youtube" ? "YouTube" : p}</span>
                    {p === "youtube" && (
                      <span className="text-[10px] text-gray-500">(reply only)</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 8px;
          border: 1px solid rgb(31 41 55);
          background: rgb(3 7 18);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(243 244 246);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: rgb(34 197 94);
          box-shadow: 0 0 0 3px rgb(34 197 94 / 0.15);
        }
        .input::placeholder {
          color: rgb(75 85 99);
        }
        .btn-secondary {
          border-radius: 8px;
          border: 1px solid rgb(55 65 81);
          background: transparent;
          padding: 0.5rem 0.875rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgb(209 213 219);
        }
        .btn-secondary:hover {
          background: rgb(31 41 55);
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  children,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-800 bg-gray-900 p-5 space-y-4 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-200 block mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function toLocalDt(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
