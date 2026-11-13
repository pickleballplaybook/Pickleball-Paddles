"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Scores = { austin: number; opp: number };
const ZERO: Scores = { austin: 0, opp: 0 };

// Canvas dimensions (exact pixels exported in the video)
const CW     = 520;
const ROW_T  = 44;   // top strip (original height)
const ROW_M  = 58;   // each team row — ROW_M*2=116 matches the drawn logo image height
const ROW_B  = 46;   // bottom paddle bar (original height)
const CH     = ROW_T + ROW_M * 2 + ROW_B;  // 206
const CLOGO  = 148;
const CSCORE = 88;
const CNAME  = CW - CLOGO - CSCORE;  // 424

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string };

function fillRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
  ctx.fill();
}

export default function ScorecardPage() {
  const [scores,      setScores]     = useState<Scores>(ZERO);
  const [history,     setHistory]    = useState<Scores[]>([]);
  const [paddleName,  setPaddleName] = useState("YOLA");
  const [logoLoaded,  setLogoLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds,  setRecSeconds]  = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef   = useRef<HTMLImageElement | null>(null);
  const mrRef     = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef    = useRef<number | null>(null);
  const drawRef   = useRef<() => void>(() => {});
  const mimeRef   = useRef<string>("video/webm");

  // Load logo once
  useEffect(() => {
    const img = new Image();
    img.src = "/images/pp-logo.png";
    img.onload = () => { logoRef.current = img; setLogoLoaded(true); };
  }, []);

  // Read saved paddle name after mount (avoids SSR/client mismatch)
  useEffect(() => {
    const saved = localStorage.getItem("scorecard_paddle");
    if (saved) setPaddleName(saved);
  }, []);

  // Persist any changes
  useEffect(() => { localStorage.setItem("scorecard_paddle", paddleName); }, [paddleName]);

  // Draw scorecard to canvas on every state change
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as Ctx | null;
    if (!ctx) return;

    ctx.clearRect(0, 0, CW, CH);

    const y2 = ROW_T;
    const y3 = ROW_T + ROW_M;
    const y4 = ROW_T + ROW_M * 2;

    // ── Row 1: top strip ────────────────────────────────────────────────────
    // Only fill the score column black (matches score rows below); no black behind the white bar
    ctx.fillStyle = "#000000";
    ctx.fillRect(CLOGO + CNAME, 0, CSCORE, ROW_T);

    // White bar: full strip height, top corners rounded, bottom flat (connects flush to content below)
    const wW = CLOGO + CNAME;
    const wR = 7;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(wR, 0);
    ctx.lineTo(wW - wR, 0);
    ctx.arcTo(wW, 0,   wW, wR,    wR);   // top-right
    ctx.lineTo(wW, ROW_T);               // right edge, flat to bottom
    ctx.lineTo(0,  ROW_T);               // bottom edge, flat (connects to boxes)
    ctx.lineTo(0,  wR);
    ctx.arcTo(0,   0,   wR, 0,    wR);   // top-left
    ctx.closePath();
    ctx.fill();

    // Text — larger for legibility
    ctx.fillStyle = "#111111";
    ctx.font = "800 14px 'Inter', system-ui, sans-serif";
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "1.6px";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("PLAYBOOKPADDLES.COM", CLOGO + 14, ROW_T / 2);

    // ── Rows 2–3: logo column (blue) ─────────────────────────────────────
    ctx.fillStyle = "#5a9df9";
    ctx.fillRect(0, y2, CLOGO, ROW_M * 2);
    if (logoRef.current) {
      const pad  = 16;
      const side = CLOGO - pad * 2;
      ctx.drawImage(logoRef.current, pad, y2 + (ROW_M * 2 - side) / 2, side, side);
    }

    // ── Row 2: Team Austin ───────────────────────────────────────────────
    const g2 = ctx.createLinearGradient(CLOGO, 0, CLOGO + CNAME, 0);
    g2.addColorStop(0, "#1d1d1d");
    g2.addColorStop(1, "#2c2c2c");
    ctx.fillStyle = g2;
    ctx.fillRect(CLOGO, y2, CNAME, ROW_M);

    ctx.fillStyle = "#111111";
    ctx.fillRect(CLOGO, y2 + ROW_M - 1, CNAME + CSCORE, 1);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 20px 'Inter', system-ui, sans-serif";
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "1.4px";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("TEAM AUSTIN", CLOGO + 22, y2 + ROW_M / 2);

    ctx.fillStyle = "#000000";
    ctx.fillRect(CLOGO + CNAME, y2, CSCORE, ROW_M);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 36px 'Inter', system-ui, sans-serif";
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "-2px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(scores.austin), CLOGO + CNAME + CSCORE / 2, y2 + ROW_M / 2);

    // ── Row 3: Opponent ──────────────────────────────────────────────────
    const g3 = ctx.createLinearGradient(CLOGO, 0, CLOGO + CNAME, 0);
    g3.addColorStop(0, "#111111");
    g3.addColorStop(1, "#1e1e1e");
    ctx.fillStyle = g3;
    ctx.fillRect(CLOGO, y3, CNAME, ROW_M);

    ctx.fillStyle = "#b8b8b8";
    ctx.font = "800 20px 'Inter', system-ui, sans-serif";
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "1.4px";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("OPPONENT", CLOGO + 22, y3 + ROW_M / 2);

    ctx.fillStyle = "#000000";
    ctx.fillRect(CLOGO + CNAME, y3, CSCORE, ROW_M);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 36px 'Inter', system-ui, sans-serif";
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "-2px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(scores.opp), CLOGO + CNAME + CSCORE / 2, y3 + ROW_M / 2);

    // ── Row 4: paddle bar ────────────────────────────────────────────────
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, y4, CW, ROW_B);
    ctx.fillStyle = "#000000";
    ctx.font = "800 18px 'Inter', system-ui, sans-serif";
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "3px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(paddleName.toUpperCase(), CW / 2, y4 + ROW_B / 2);

  }, [scores, paddleName, logoLoaded]);  // logoLoaded triggers redraw once logo arrives

  // Keep drawRef current so the RAF loop always calls the latest draw
  useEffect(() => { drawRef.current = draw; }, [draw]);
  useEffect(() => { draw(); }, [draw]);

  // ── Score logic ────────────────────────────────────────────────────────
  const changeScore = useCallback((team: "austin" | "opp", delta: number) => {
    setScores(prev => {
      const next = Math.max(0, prev[team] + delta);
      if (next === prev[team]) return prev;
      setHistory(h => [...h, { ...prev }]);
      return { ...prev, [team]: next };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (!prev.length) return prev;
      setScores(prev[prev.length - 1]);
      return prev.slice(0, -1);
    });
  }, []);

  const reset = useCallback(() => {
    setScores(cur => {
      if (cur.austin !== 0 || cur.opp !== 0) setHistory(h => [...h, { ...cur }]);
      return ZERO;
    });
  }, []);

  // ── Recording — canvas.captureStream() records ONLY the 660×246 scorecard ──

  function startRafLoop() {
    function loop() {
      drawRef.current();                          // redraw canvas → stream stays alive
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function stopRafLoop() {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }

  function startRecording() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const stream = canvas.captureStream(30);
      chunksRef.current = [];
      // Prefer H.264 MP4 so the file works in Premiere Pro / QuickTime without conversion
      const mimeType =
        MediaRecorder.isTypeSupported("video/mp4;codecs=avc1") ? "video/mp4;codecs=avc1" :
        MediaRecorder.isTypeSupported("video/mp4")             ? "video/mp4"             :
        MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" :
        "video/webm";
      mimeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = exportRecording;
      recorder.start(2000);           // flush chunks every 2s
      mrRef.current = recorder;
      setIsRecording(true);
      setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
      startRafLoop();                 // keeps canvas producing frames even in background tabs
    } catch {
      alert("Canvas recording not supported. Use Chrome.");
    }
  }

  function stopRecording() {
    stopRafLoop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mrRef.current?.state !== "inactive") mrRef.current?.stop();
    setIsRecording(false);
    setRecSeconds(0);
  }

  function exportRecording() {
    const mime = mimeRef.current;
    const ext  = mime.startsWith("video/mp4") ? "mp4" : "webm";
    const blob = new Blob(chunksRef.current, { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `scorecard-${paddleName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  useEffect(() => () => {
    stopRafLoop();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case "a": case "A": changeScore("austin",  1); break;
        case "q": case "Q": changeScore("austin", -1); break;
        case "o": case "O": changeScore("opp",     1); break;
        case "p": case "P": changeScore("opp",    -1); break;
        case "z": case "Z": undo();                    break;
        case "R": if (e.shiftKey) reset();             break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeScore, undo, reset]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0d0d0d; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .blink { animation: blink 1s ease-in-out infinite; }
        button { transition: transform 0.1s; }
        button:active { transform: scale(0.91) !important; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 24px 80px",
      }}>

        {/* Page header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", color: "#3a3a3a", textTransform: "uppercase" }}>
            Pickleball Playbook
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 4 }}>Live Scorecard</h1>
          <p style={{ fontSize: 11, color: "#444", marginTop: 6 }}>
            Recording exports only the scorecard ({CW}&thinsp;×&thinsp;{CH}px) — no page chrome
          </p>
        </div>

        {/* Canvas + record button side-by-side */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            style={{
              borderRadius: 6,
              boxShadow: "0 16px 64px rgba(0,0,0,0.85)",
              maxWidth: "calc(100vw - 80px)",
              display: "block",
            }}
          />

          {/* Record button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingTop: 32 }}>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? "Stop recording & export video" : "Start recording scorecard"}
              style={{
                width: 46, height: 46, borderRadius: "50%",
                background: isRecording ? "#e74c3c" : "#7a1515",
                border: `2.5px solid ${isRecording ? "#ff8a80" : "#c0392b"}`,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
                boxShadow: isRecording ? "0 0 16px rgba(231,76,60,0.6)" : "none",
              }}
              className={isRecording ? "blink" : ""}
            >
              {isRecording ? "⏹" : "⏺"}
            </button>
            {isRecording
              ? <span style={{ fontFamily: "monospace", fontSize: 10, color: "#e74c3c" }}>{fmt(recSeconds)}</span>
              : <span style={{ fontSize: 9, color: "#444", textAlign: "center", maxWidth: 50, lineHeight: 1.4 }}>REC</span>
            }
          </div>

        </div>

        {/* Controls */}
        <div style={{
          marginTop: 32,
          width: CW,
          maxWidth: "calc(100vw - 80px)",
          background: "#141414",
          border: "1px solid #1e1e1e",
          borderRadius: 16,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>

            {/* Team Austin */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#5a9df9", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Team Austin
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <ScoreBtn label="−" onClick={() => changeScore("austin", -1)} />
                <ScoreBtn label="+" onClick={() => changeScore("austin",  1)} primary />
              </div>
              <span style={{ fontSize: 9, color: "#333" }}>Q = −1 · A = +1</span>
            </div>

            {/* Middle */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <ActionBtn label="↩  Undo (Z)"     onClick={undo}  disabled={!history.length} />
              <ActionBtn label="Reset (Shift+R)" onClick={reset} dim />
            </div>

            {/* Opponent */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Opponent
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <ScoreBtn label="−" onClick={() => changeScore("opp", -1)} />
                <ScoreBtn label="+" onClick={() => changeScore("opp",  1)} primary />
              </div>
              <span style={{ fontSize: 9, color: "#333" }}>P = −1 · O = +1</span>
            </div>

          </div>

          {/* Paddle name */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#555", fontWeight: 600, flexShrink: 0 }}>Paddle</span>
            <input
              value={paddleName}
              onChange={e => setPaddleName(e.target.value.toUpperCase())}
              placeholder="YOLA"
              style={{
                flex: 1,
                background: "#0d0d0d",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                padding: "8px 14px",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          {/* Recording status */}
          {isRecording && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 16px", borderRadius: 8,
              background: "#1a0000", border: "1px solid #5a0000",
            }}>
              <span className="blink" style={{ color: "#e74c3c", fontSize: 16 }}>⏺</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#e74c3c", letterSpacing: "0.08em" }}>RECORDING</span>
              <span style={{ fontFamily: "monospace", fontSize: 13, color: "#e74c3c" }}>{fmt(recSeconds)}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: "#6a2a2a" }}>Hit the red circle to stop &amp; save</span>
            </div>
          )}

        </div>

        {/* Premiere Pro guide */}
        <div style={{
          marginTop: 16,
          width: CW,
          maxWidth: "calc(100vw - 80px)",
          background: "#0e1420",
          border: "1px solid #1a2840",
          borderRadius: 16,
          padding: "22px 28px",
        }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", color: "#2a4f7a", textTransform: "uppercase", marginBottom: 10 }}>
            How to use in Premiere Pro
          </p>
          <ol style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "Type the paddle name in the Paddle field below the scorecard.",
              "Click the red circle ⏺ — recording starts immediately (only the scorecard is captured, 660×238px).",
              "Watch your match and hit the score buttons (or keyboard: A/Q for Austin, O/P for Opponent) to update live.",
              "Click the red circle ⏹ — recording stops and an .mp4 video downloads automatically.",
              "In Premiere Pro: File → Import the .mp4 → drag it onto V2 above your match footage. Scale + position to the corner.",
            ].map((step, i) => (
              <li key={i} style={{ fontSize: 12, color: "#4a7aaa", lineHeight: 1.6 }}>
                <span style={{ color: "#3060a0", fontWeight: 700 }}>{i + 1}.</span>{" "}
                {step}
              </li>
            ))}
          </ol>
          <p style={{ fontSize: 11, color: "#1e3a5a", marginTop: 12 }}>
            💡 Chrome on Mac records as MP4 (H.264) directly — no conversion needed. If the file downloads as .webm, open in QuickTime → File → Export As → 1080p.
          </p>
        </div>

      </div>
    </>
  );
}

function ScoreBtn({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} style={{
      width: 60, height: 60, borderRadius: "50%",
      background: primary ? "#5a9df9" : "#1e1e1e",
      border: primary ? "none" : "2px solid #2a2a2a",
      color: primary ? "#000" : "#bbb",
      fontSize: 28, fontWeight: 900, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
    }}>
      {label}
    </button>
  );
}

function ActionBtn({ label, onClick, disabled, dim }: { label: string; onClick: () => void; disabled?: boolean; dim?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "8px 16px", borderRadius: 8,
      background: "#1a1a1a",
      border: `1px solid ${disabled ? "#1e1e1e" : "#2e2e2e"}`,
      color: disabled ? "#2e2e2e" : dim ? "#4a4a4a" : "#777",
      fontSize: 12, fontWeight: 600,
      cursor: disabled ? "default" : "pointer",
      whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );
}
