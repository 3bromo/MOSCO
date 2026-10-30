"use client";

import { useRef, type RefObject } from "react";
import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import IceCity, { type Quality } from "./IceCity";
import Snow from "./Snow";

/* ------------------------------------------------------------------ *
 * Camera rig
 * Scroll drives a dolly through the ice arch; the pointer adds a small
 * parallax offset. Both are critically damped so motion stays cinematic
 * rather than twitchy, and both are skipped under reduced-motion.
 * ------------------------------------------------------------------ */

const START = new THREE.Vector3(0, 1.75, 11.2);
const END = new THREE.Vector3(0, 2.45, -2.2);

function Rig({
  progressRef,
  reducedMotion,
}: {
  progressRef: RefObject<number>;
  reducedMotion: boolean;
}) {
  const { camera, pointer } = useThree();
  const look = useRef(new THREE.Vector3(0, 2.1, -6));
  const base = useRef(new THREE.Vector3().copy(START));

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = THREE.MathUtils.clamp(progressRef.current ?? 0, 0, 1);
    // easeInOutCubic keeps the dolly slow at both ends.
    const e = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;

    base.current.lerpVectors(START, END, e);

    const px = reducedMotion ? 0 : pointer.x;
    const py = reducedMotion ? 0 : pointer.y;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, base.current.x + px * 1.1, 3, dt);
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      base.current.y + py * 0.45,
      3,
      dt,
    );
    camera.position.z = THREE.MathUtils.damp(camera.position.z, base.current.z, 3.4, dt);

    look.current.x = THREE.MathUtils.damp(look.current.x, px * 0.6, 2.4, dt);
    look.current.y = THREE.MathUtils.damp(look.current.y, 2.1 + e * 0.5 + py * 0.2, 2.4, dt);
    camera.lookAt(look.current);
  });

  return null;
}

/* ------------------------------------------------------------------ *
 * Lighting
 * ------------------------------------------------------------------ */

function Lighting({ quality }: { quality: Quality }) {
  return (
    <>
      <ambientLight intensity={0.55} color="#dceeff" />
      <hemisphereLight args={["#ffffff", "#b9ddf8", 0.85]} />
      <directionalLight
        position={[7, 13, 8]}
        intensity={2.1}
        color="#ffffff"
        castShadow={quality === "high"}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={44}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0008}
      />
      {/* cold rim from behind the arch */}
      <directionalLight position={[-9, 6, -10]} intensity={0.9} color="#9cc9ec" />
      <pointLight position={[0, 2.4, -3]} intensity={18} distance={14} color="#eaf5ff" />
    </>
  );
}

/**
 * Procedural studio environment. Built from Lightformers inside the app, so
 * there is no HDRI download — the scene lights identically offline.
 */
function IceEnvironment() {
  return (
    <Environment resolution={256} frames={1} background={false}>
      <Lightformer
        intensity={1.6}
        rotation-x={Math.PI / 2}
        position={[0, 6, -9]}
        scale={[12, 12, 1]}
        color="#ffffff"
      />
      <Lightformer
        intensity={0.9}
        rotation-y={Math.PI / 2}
        position={[-8, 3, 0]}
        scale={[12, 8, 1]}
        color="#dceeff"
      />
      <Lightformer
        intensity={0.9}
        rotation-y={-Math.PI / 2}
        position={[8, 3, 0]}
        scale={[12, 8, 1]}
        color="#b9ddf8"
      />
      <Lightformer
        intensity={0.5}
        rotation-x={-Math.PI / 2}
        position={[0, -4, 0]}
        scale={[16, 16, 1]}
        color="#f6fbff"
      />
    </Environment>
  );
}

/* ------------------------------------------------------------------ *
 * Canvas
 * ------------------------------------------------------------------ */

export default function HeroScene({
  progressRef,
  quality,
  reducedMotion = false,
  onReady,
}: {
  progressRef: RefObject<number>;
  quality: Quality;
  reducedMotion?: boolean;
  onReady?: () => void;
}) {
  const dpr = useRef<[number, number]>(quality === "high" ? [1, 1.85] : [1, 1.35]);

  return (
    <Canvas
      dpr={dpr.current}
      shadows={quality === "high"}
      frameloop="always"
      gl={{
        antialias: quality === "high",
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{ position: [START.x, START.y, START.z], fov: 42, near: 0.1, far: 90 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        scene.fog = new THREE.Fog("#dceeff", 15, 48);
        onReady?.();
      }}
      // The canvas is pure decoration — keep it out of the a11y tree.
      aria-hidden="true"
      tabIndex={-1}
    >
      <PerformanceMonitor
        onDecline={() => {
          dpr.current = [1, 1];
        }}
      />
      <AdaptiveDpr />

      <Lighting quality={quality} />
      {quality === "high" && <IceEnvironment />}

      <IceCity quality={quality} />
      <Snow
        count={quality === "high" ? 1100 : 380}
        area={quality === "high" ? 30 : 22}
        height={18}
        speed={reducedMotion ? 0.25 : 1}
      />

      <Rig progressRef={progressRef} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
