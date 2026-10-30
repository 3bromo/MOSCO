"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Atmospheric snow. One Points draw call, positions advanced on the CPU and
 * wrapped in a box so the field never empties. Count is tuned down on mobile
 * by the caller.
 */
export default function Snow({
  count = 900,
  area = 26,
  height = 16,
  speed = 1,
}: {
  count?: number;
  area?: number;
  height?: number;
  speed?: number;
}) {
  const points = useRef<THREE.Points>(null);

  const { positions, drift } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const drift = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area;
      positions[i * 3 + 1] = Math.random() * height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * area;
      drift[i * 3] = 0.08 + Math.random() * 0.18; // sway amplitude
      drift[i * 3 + 1] = 0.22 + Math.random() * 0.55; // fall speed
      drift[i * 3 + 2] = Math.random() * Math.PI * 2; // phase
    }
    return { positions, drift };
  }, [count, area, height]);

  // A soft round sprite drawn at runtime — avoids shipping a texture file.
  const sprite = useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame((_, delta) => {
    const mesh = points.current;
    if (!mesh) return;
    const attr = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const dt = Math.min(delta, 0.05) * speed;
    const t = performance.now() * 0.0004;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3 + 1] -= drift[i3 + 1] * dt;
      arr[i3] += Math.sin(t + drift[i3 + 2]) * drift[i3] * dt;
      if (arr[i3 + 1] < -1) {
        arr[i3 + 1] = height;
        arr[i3] = (Math.random() - 0.5) * area;
        arr[i3 + 2] = (Math.random() - 0.5) * area;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={0.075}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.NormalBlending}
        color="#ffffff"
      />
    </points>
  );
}
