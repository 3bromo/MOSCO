"use client";

import { useMemo, useRef } from "react";
import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type Quality = "high" | "low";

/* ------------------------------------------------------------------ *
 * Materials
 * Transmission is gorgeous but costs a full extra render pass, so it is
 * reserved for the few hero objects on desktop. Everything else uses a
 * cheap clearcoat + envMap approximation that reads as ice all the same.
 * ------------------------------------------------------------------ */

function IceMaterial({ quality, tint = "#cfe7fd" }: { quality: Quality; tint?: string }) {
  if (quality === "high") {
    return (
      <meshPhysicalMaterial
        color={tint}
        roughness={0.14}
        metalness={0}
        transmission={0.82}
        thickness={1.4}
        ior={1.31}
        clearcoat={0.7}
        clearcoatRoughness={0.18}
        envMapIntensity={1.15}
        attenuationColor="#9cc9ec"
        attenuationDistance={3.5}
      />
    );
  }
  return (
    <meshStandardMaterial
      color={tint}
      roughness={0.22}
      metalness={0.05}
      transparent
      opacity={0.78}
      envMapIntensity={1}
    />
  );
}

function BrickMaterial({ quality }: { quality: Quality }) {
  return (
    <meshPhysicalMaterial
      color="#dceeff"
      roughness={quality === "high" ? 0.2 : 0.3}
      metalness={0}
      clearcoat={quality === "high" ? 0.85 : 0.3}
      clearcoatRoughness={0.25}
      transparent
      opacity={0.92}
      envMapIntensity={quality === "high" ? 1.25 : 0.9}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Ice brick wall with a central arch
 * ------------------------------------------------------------------ */

interface Brick {
  pos: [number, number, number];
  scale: [number, number, number];
  rot: number;
}

function buildWall(quality: Quality): Brick[] {
  const bricks: Brick[] = [];
  const bw = 1.05;
  const bh = 0.72;
  const cols = quality === "high" ? 15 : 11;
  const rows = quality === "high" ? 9 : 7;

  // Arch cut-out: a rectangle topped with a half-round.
  const archHalfW = 1.5;
  const archTop = 4.3;
  const archRadius = archHalfW;
  const archSpring = archTop - archRadius;

  for (let r = 0; r < rows; r++) {
    const y = bh / 2 + r * bh;
    // Running bond — every other course is offset by half a brick.
    const offset = r % 2 === 0 ? 0 : bw / 2;
    for (let c = -Math.floor(cols / 2); c <= Math.floor(cols / 2); c++) {
      const x = c * bw + offset;

      // Skip bricks inside the arch.
      const insideShaft = Math.abs(x) < archHalfW + 0.1 && y < archSpring;
      const dy = y - archSpring;
      const insideHead =
        dy >= 0 && Math.hypot(x, dy) < archRadius + 0.12 && Math.abs(x) < archRadius + 0.12;
      if (insideShaft || insideHead) continue;

      // Deterministic jitter keeps the wall hand-cut rather than CAD-perfect.
      const seed = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
      const j = seed - Math.floor(seed);

      bricks.push({
        pos: [x, y, (j - 0.5) * 0.09],
        scale: [bw * 0.94, bh * 0.9, 0.62 + j * 0.18],
        rot: (j - 0.5) * 0.035,
      });
    }
  }
  return bricks;
}

function IceWall({ quality }: { quality: Quality }) {
  const bricks = useMemo(() => buildWall(quality), [quality]);

  return (
    <group position={[0, 0, -1.2]}>
      <Instances limit={bricks.length} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <BrickMaterial quality={quality} />
        {bricks.map((b, i) => (
          <Instance key={i} position={b.pos} scale={b.scale} rotation={[0, 0, b.rot]} />
        ))}
      </Instances>

      {/* Luminous arch reveal — the light the camera travels toward. */}
      <mesh position={[0, 2.1, -0.45]}>
        <planeGeometry args={[3.4, 4.6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 * Onion dome — the signature of Moscow's skyline
 * ------------------------------------------------------------------ */

const ONION_PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.58, 0.05],
  [0.88, 0.26],
  [1.0, 0.58],
  [0.96, 0.9],
  [0.78, 1.2],
  [0.5, 1.46],
  [0.24, 1.66],
  [0.09, 1.82],
  [0.03, 1.95],
];

function OnionDome({
  position,
  scale = 1,
  drumHeight = 1.6,
  quality,
  tint,
  spin = 0,
}: {
  position: [number, number, number];
  scale?: number;
  drumHeight?: number;
  quality: Quality;
  tint?: string;
  spin?: number;
}) {
  const group = useRef<THREE.Group>(null);

  const lathe = useMemo(() => {
    const pts = ONION_PROFILE.map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, quality === "high" ? 48 : 24);
  }, [quality]);

  useFrame((state) => {
    if (!group.current || !spin) return;
    // Barely-there float so the skyline breathes without drawing attention.
    group.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.35 + spin) * 0.045;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {/* drum */}
      <mesh castShadow receiveShadow position={[0, drumHeight / 2, 0]}>
        <cylinderGeometry args={[0.72, 0.78, drumHeight, quality === "high" ? 32 : 18]} />
        <meshStandardMaterial color="#f6fbff" roughness={0.42} metalness={0.06} />
      </mesh>

      {/* cornice */}
      <mesh position={[0, drumHeight + 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.84, 0.84, 0.12, quality === "high" ? 32 : 18]} />
        <meshStandardMaterial color="#e6edf4" roughness={0.3} metalness={0.22} />
      </mesh>

      {/* onion */}
      <mesh geometry={lathe} position={[0, drumHeight + 0.12, 0]} castShadow>
        <IceMaterial quality={quality} tint={tint} />
      </mesh>

      {/* spire */}
      <mesh position={[0, drumHeight + 2.22, 0]} castShadow>
        <coneGeometry args={[0.045, 0.5, 8]} />
        <meshStandardMaterial color="#c8d3de" roughness={0.25} metalness={0.75} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 * Supporting geometry
 * ------------------------------------------------------------------ */

function IceShard({
  position,
  rotation,
  scale,
  quality,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  quality: Quality;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <IceMaterial quality={quality} tint="#e8f4ff" />
    </mesh>
  );
}

function SnowDrifts({ quality }: { quality: Quality }) {
  const drifts = useMemo(
    () =>
      [
        { p: [-6.4, -0.45, 2.6], s: [4.2, 1.0, 3.0] },
        { p: [6.1, -0.5, 1.9], s: [4.8, 1.1, 3.2] },
        { p: [-2.9, -0.55, 4.6], s: [3.4, 0.9, 2.4] },
        { p: [3.4, -0.52, 5.1], s: [3.0, 0.85, 2.2] },
      ] as { p: [number, number, number]; s: [number, number, number] }[],
    [],
  );

  return (
    <group>
      {drifts.map((d, i) => (
        <mesh key={i} position={d.p} scale={d.s} receiveShadow>
          <sphereGeometry args={[1, quality === "high" ? 24 : 12, quality === "high" ? 16 : 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ *
 * The assembled set
 * ------------------------------------------------------------------ */

export default function IceCity({ quality }: { quality: Quality }) {
  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[48, quality === "high" ? 64 : 32]} />
        <meshStandardMaterial color="#eef7ff" roughness={0.68} metalness={0.04} />
      </mesh>

      <IceWall quality={quality} />
      <SnowDrifts quality={quality} />

      {/* skyline behind the arch */}
      <OnionDome position={[0, 4.4, -11]} scale={1.45} drumHeight={3.4} quality={quality} spin={0.4} />
      <OnionDome
        position={[-3.6, 3.2, -13.5]}
        scale={1.05}
        drumHeight={2.6}
        quality={quality}
        tint="#b9ddf8"
        spin={1.7}
      />
      <OnionDome
        position={[3.9, 3.5, -14.2]}
        scale={1.15}
        drumHeight={2.8}
        quality={quality}
        tint="#dceeff"
        spin={2.9}
      />
      {quality === "high" && (
        <>
          <OnionDome
            position={[-7.4, 2.6, -17]}
            scale={0.9}
            drumHeight={2.2}
            quality={quality}
            tint="#b9ddf8"
            spin={3.8}
          />
          <OnionDome
            position={[7.8, 2.8, -18]}
            scale={0.95}
            drumHeight={2.4}
            quality={quality}
            spin={5.1}
          />
        </>
      )}

      {/* towers framing the skyline */}
      {[
        [-5.6, -15.5, 5.2],
        [5.8, -16.5, 6.0],
        [-9.5, -20, 4.4],
        [9.8, -21, 4.8],
      ].map(([x, z, h], i) => (
        <mesh key={i} position={[x, h / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[1.5, h, 1.5]} />
          <meshStandardMaterial color="#f6fbff" roughness={0.5} metalness={0.05} />
        </mesh>
      ))}

      {/* foreground shards — depth cues at the edges of frame */}
      <IceShard
        position={[-5.2, 0.9, 4.4]}
        rotation={[0.1, 0.5, 0.14]}
        scale={[0.9, 2.1, 0.9]}
        quality={quality}
      />
      <IceShard
        position={[5.6, 0.7, 3.8]}
        rotation={[-0.08, -0.35, -0.11]}
        scale={[0.8, 1.7, 0.8]}
        quality={quality}
      />
      {quality === "high" && (
        <IceShard
          position={[-7.6, 0.6, 1.4]}
          rotation={[0.05, 0.9, 0.2]}
          scale={[0.7, 1.4, 0.7]}
          quality={quality}
        />
      )}
    </group>
  );
}
