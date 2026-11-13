"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

function PaddleImage() {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture("/images/paddles/Boomstik-ST-Elongated-16mm.png");
  texture.colorSpace = THREE.SRGBColorSpace;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.55;
    // Subtle mouse-driven pitch
    const targetX = state.mouse.y * -0.12;
    groupRef.current.rotation.x +=
      (targetX - groupRef.current.rotation.x) * 0.045;
  });

  return (
    <>
      {/* Fixed glow backdrop — stays put while paddle spins */}
      <mesh position={[0, 0, -0.4]}>
        <circleGeometry args={[1.1, 64]} />
        <meshBasicMaterial color="#1e3a14" transparent opacity={0.55} />
      </mesh>

      <group ref={groupRef}>
        <mesh>
          <planeGeometry args={[2.2, 2.2]} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
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
      <ambientLight intensity={1.0} />
      <PaddleImage />
    </Canvas>
  );
}
