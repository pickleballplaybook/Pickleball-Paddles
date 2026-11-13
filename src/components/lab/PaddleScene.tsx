"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// Paddle geometry derived from pixel analysis of Boomstik-ST-Elongated-16mm.png
// Image: 1000×1000, paddle bounds px: x346–652, y160–834, handle split y553
// Scale: 2.1 scene units = 1000px  →  0.0021 u/px
//
// Head:   W=0.56, H=0.74, centre Y=+0.302, depth=0.088 (16mm)
// Handle: W=0.13, H=0.52, centre Y=−0.406, depth=0.066

const D_HEAD   = 0.088;
const D_HANDLE = 0.066;
const IMG_SIZE = 2.1;  // face plane covers the full 1000×1000 image

function Paddle3D() {
  const ref = useRef<THREE.Group>(null);
  const face = useTexture("/images/paddles/Boomstik-ST-Elongated-16mm.png");
  face.colorSpace = THREE.SRGBColorSpace;

  // Edge guard: white/silver — visible from the side when rotating
  const edgeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c4cbce",
        roughness: 0.35,
        metalness: 0.45,
      }),
    []
  );

  // Grip: white/off-white wrap texture
  const gripMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#dfe8e4",
        roughness: 0.9,
        metalness: 0.0,
      }),
    []
  );

  // Front face: the transparent-bg paddle PNG
  const faceMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: face,
        transparent: true,
        alphaTest: 0.04,
        side: THREE.FrontSide,
      }),
    [face]
  );

  // Back face: dark carbon (paddle back is usually unbranded carbon)
  const backMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0e1812",
        roughness: 0.28,
        metalness: 0.55,
      }),
    []
  );

  useFrame((state, delta) => {
    if (!ref.current) return;
    // Continuous Y spin
    ref.current.rotation.y += delta * 0.55;
    // Mouse-driven X pitch
    const tx = state.mouse.y * -0.12;
    ref.current.rotation.x += (tx - ref.current.rotation.x) * 0.045;
  });

  return (
    <group ref={ref}>
      {/* ── Depth slab: paddle head (edge guard, visible from side) ── */}
      <mesh position={[0, 0.302, 0]} material={edgeMat}>
        <boxGeometry args={[0.56, 0.74, D_HEAD]} />
      </mesh>

      {/* ── Depth slab: handle ── */}
      <mesh position={[0, -0.406, 0]} material={gripMat}>
        <boxGeometry args={[0.13, 0.52, D_HANDLE]} />
      </mesh>

      {/* ── Front face — paddle image (floats in front of the slabs) ── */}
      <mesh
        position={[0, 0, D_HEAD / 2 + 0.008]}
        renderOrder={1}
        material={faceMat}
      >
        <planeGeometry args={[IMG_SIZE, IMG_SIZE]} />
      </mesh>

      {/* ── Back face — dark carbon (behind head slab) ── */}
      <mesh
        position={[0, 0.302, -(D_HEAD / 2 + 0.004)]}
        rotation={[0, Math.PI, 0]}
        material={backMat}
      >
        <planeGeometry args={[0.58, 0.76]} />
      </mesh>
    </group>
  );
}

export default function PaddleScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.5], fov: 46 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      {/* Soft fill */}
      <ambientLight intensity={0.55} color="#d4f0da" />
      {/* Key — upper left, makes edge guard glow */}
      <directionalLight position={[3, 5, 4]}  intensity={2.6} color="#f0f8f0" />
      {/* Rim — lime from the right */}
      <directionalLight position={[-4, 2, 2]} intensity={1.1} color="#a3e635" />
      {/* Warm fill — below right */}
      <directionalLight position={[2, -3, 1]} intensity={0.4} color="#fb923c" />

      <Paddle3D />
    </Canvas>
  );
}
