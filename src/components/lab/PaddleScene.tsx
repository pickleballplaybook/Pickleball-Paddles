"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// ── Procedural face texture (carbon weave + crosshair) ────────────────────────
function buildFaceTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round(size * 1.2);
  const ctx = canvas.getContext("2d")!;

  // Carbon-dark base
  ctx.fillStyle = "#080f0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Carbon weave pattern — small diagonal rectangles
  const cell = 12;
  for (let y = 0; y < canvas.height; y += cell) {
    for (let x = 0; x < canvas.width; x += cell) {
      const phase = Math.floor(y / cell) % 2;
      const shade = (Math.floor(x / cell) + phase) % 2;
      ctx.fillStyle = shade === 0 ? "rgba(163,230,53,0.038)" : "rgba(163,230,53,0.018)";
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }

  // Fine grid overlay
  ctx.strokeStyle = "rgba(163,230,53,0.05)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < canvas.width; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Center crosshair
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.strokeStyle = "rgba(163,230,53,0.14)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
  ctx.setLineDash([]);

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(163,230,53,0.4)";
  ctx.fill();

  // Concentric measurement rings
  for (const r of [60, 120, 180]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(163,230,53,0.06)";
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }

  // "PLAYBOOK LAB" watermark (safe system font — custom font may not load in canvas)
  ctx.textAlign = "center";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillStyle = "rgba(163,230,53,0.08)";
  ctx.letterSpacing = "8px";
  ctx.fillText("PLAYBOOK", cx, cy - 10);
  ctx.font = "12px Arial, sans-serif";
  ctx.fillStyle = "rgba(163,230,53,0.05)";
  ctx.fillText("LAB SERIES", cx, cy + 14);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Paddle mesh ───────────────────────────────────────────────────────────────
function PaddleMesh() {
  const groupRef = useRef<THREE.Group>(null);

  const faceTexture = useMemo(() => buildFaceTexture(), []);

  // Edge glow geometry — a slightly larger plane behind the face
  const edgeGlowGeo = useMemo(() => new THREE.PlaneGeometry(0.90, 1.08), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Slow continuous Y rotation
    groupRef.current.rotation.y += delta * 0.22;
    // Mouse-driven X tilt (subtle pitch)
    const targetX = state.mouse.y * -0.14;
    groupRef.current.rotation.x +=
      (targetX - groupRef.current.rotation.x) * 0.045;
  });

  return (
    <group ref={groupRef}>
      {/* ── Paddle head ──────────────────────────────────────────────── */}
      <RoundedBox
        args={[0.86, 1.06, 0.056]}
        radius={0.11}
        smoothness={4}
        position={[0, 0.26, 0]}
      >
        <meshStandardMaterial
          color="#0a1208"
          roughness={0.22}
          metalness={0.45}
          envMapIntensity={0.6}
        />
      </RoundedBox>

      {/* Edge glow — slightly larger plane at same Z as face */}
      <mesh position={[0, 0.26, 0.029]} geometry={edgeGlowGeo}>
        <meshBasicMaterial
          color="#a3e635"
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* ── Face surface with carbon texture ─────────────────────────── */}
      <mesh position={[0, 0.26, 0.030]}>
        <planeGeometry args={[0.84, 1.04]} />
        <meshStandardMaterial
          map={faceTexture}
          roughness={0.08}
          metalness={0.15}
        />
      </mesh>

      {/* ── Throat taper connecting head to handle ────────────────────── */}
      <mesh position={[0, -0.265, 0]}>
        <cylinderGeometry args={[0.055, 0.075, 0.12, 20]} />
        <meshStandardMaterial color="#0d140b" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* ── Handle core ───────────────────────────────────────────────── */}
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.052, 0.046, 0.46, 20]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* ── Grip wrap (slightly larger cylinder, ribbed look) ─────────── */}
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.058, 0.052, 0.42, 20, 12]} />
        <meshStandardMaterial
          color="#141a12"
          roughness={0.92}
          metalness={0.0}
        />
      </mesh>

      {/* ── Butt cap ──────────────────────────────────────────────────── */}
      <mesh position={[0, -0.665, 0]}>
        <cylinderGeometry args={[0.055, 0.052, 0.025, 20]} />
        <meshStandardMaterial color="#a3e635" roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
}

// ── Scene wrapper ─────────────────────────────────────────────────────────────
export default function PaddleScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 3.4], fov: 46 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      {/* Soft fill from above */}
      <ambientLight intensity={0.18} color="#f0faf2" />
      {/* Key light — slightly warm, from upper-left */}
      <directionalLight position={[3, 5, 4]}  intensity={2.2}  color="#e8f4e8" />
      {/* Rim light — lime accent, from right */}
      <directionalLight position={[-4, 2, 2]} intensity={0.65} color="#a3e635" />
      {/* Fill light — orange secondary, from below-right */}
      <directionalLight position={[2, -3, 1]} intensity={0.35} color="#fb923c" />
      {/* Back light — creates depth separation */}
      <directionalLight position={[0, 0, -4]} intensity={0.25} color="#1a2018" />

      <PaddleMesh />
    </Canvas>
  );
}
