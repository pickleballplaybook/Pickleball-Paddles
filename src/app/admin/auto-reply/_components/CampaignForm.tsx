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

  const handleSubmit = () => {
    // Mock submission - just log for now
    console.log("Form submitted:", form);
    alert(
      `Mock ${mode}:\n\n${JSON.stringify(form, null, 2)}\n\n(Backend will be wired in Step 3+)`
    );
  };

  const ytEnabled = form.platforms.includes("youtube");
  const dmCapable = form.platforms.some((p) => p === "instagram" || p === "facebook");

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/auto-reply"
              className="text-sm text-stone-500 hover:text-stone-900"
            >
              ← Campaigns
            </Link>
            <span className="text-stone-300">/</span>
            <h1 className="text-xl font-semibold tracking-tight">
              {mode === "create" ? "New Campaign" : form.name || "Edit Campaign"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/auto-reply"
              className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium hover:bg-stone-50"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              {mode === "create" ? "Create campaign" : "Save changes"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* LEFT: form */}
        <div className="space-y-6">
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
                      className="inline-flex items-center gap-1.5 rounded border border-stone-200 bg-white px-2 py-1 text-xs font-mono text-stone-700"
                    >
                      {kw}
                      <button
                        onClick={() => removeKeyword(kw)}
                        className="text-stone-400 hover:text-stone-900"
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
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                      on
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white hover:border-stone-300"
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
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
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
                    className={`rounded-md border p-3 text-left text-sm ${
                      form.target_mode === m
                        ? "border-stone-900 bg-stone-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="font-medium">
                      {m === "all" ? "All posts" : "Specific posts"}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
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
                        className="flex items-center justify-between rounded border border-stone-200 bg-white px-3 py-1.5 text-xs font-mono"
                      >
                        <span className="truncate">{id}</span>
                        <button
                          onClick={() =>
                            update(
                              "target_post_ids",
                              form.target_post_ids.filter((x) => x !== id)
                            )
                          }
                          className="text-stone-400 hover:text-stone-900 ml-2"
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
              <p className="text-xs text-stone-500 bg-stone-100 rounded px-3 py-2">
                Enable Instagram or Facebook to send DMs. YouTube doesn't support DMs.
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
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium">Only fire once per user</div>
                <div className="text-xs text-stone-500">
                  Recommended. Prevents spamming someone who comments multiple times.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => update("is_active", e.target.checked)}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-stone-500">
                  Inactive campaigns won't trigger on new comments.
                </div>
              </div>
            </label>
          </Section>
        </div>

        {/* RIGHT: live preview */}
        <aside className="lg:sticky lg:top-6 self-start space-y-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-medium px-1">
            Preview
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
            <div className="text-xs text-stone-500">Comment from @username</div>
            <div className="rounded bg-stone-50 px-3 py-2 text-sm">
              {form.keywords.length > 0
                ? `"Hey can I get the ${form.keywords[0]}?"`
                : '"Their comment will appear here"'}
            </div>

            <div className="text-xs text-stone-500 pt-2">Your auto-reply</div>
            <div className="rounded bg-stone-900 text-white px-3 py-2 text-sm">
              {form.reply_text || (
                <span className="text-stone-400">Your reply text...</span>
              )}
            </div>

            {dmCapable && form.dm_text && (
              <>
                <div className="text-xs text-stone-500 pt-2">DM sent</div>
                <div className="rounded bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-900">
                  <div>{form.dm_text.replace(/\{\{name\}\}/g, "Austin")}</div>
                  {form.cta_link && (
                    <div className="mt-2 text-xs text-blue-700 underline truncate">
                      {form.cta_link}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Will fire on
            </div>
            {form.platforms.length === 0 ? (
              <p className="text-xs text-stone-500">Pick at least one platform</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {form.platforms.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <PlatformIcon platform={p} className="h-3.5 w-3.5" />
                    <span className="capitalize">{p === "youtube" ? "YouTube" : p}</span>
                    {p === "youtube" && (
                      <span className="text-[10px] text-stone-500">(reply only)</span>
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
          border-radius: 6px;
          border: 1px solid rgb(231 229 228);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(28 25 23);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: rgb(28 25 23);
          box-shadow: 0 0 0 3px rgb(28 25 23 / 0.08);
        }
        .btn-secondary {
          border-radius: 6px;
          border: 1px solid rgb(231 229 228);
          background: white;
          padding: 0.5rem 0.875rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgb(68 64 60);
        }
        .btn-secondary:hover {
          background: rgb(250 250 249);
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
      className={`rounded-lg border border-stone-200 bg-white p-5 space-y-4 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
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
      <label className="text-sm font-medium text-stone-800 block mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-stone-500 mt-1.5">{hint}</p>}
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
