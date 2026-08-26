"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { GAMMA, shadowAxis, umbralMagnitudeAt, penumbraIntensity } from "@/lib/eclipse";

type Props = { time: number };

const MOON_X = 5.4;

function Earth() {
  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[1.65, 48, 48]} />
      <meshStandardMaterial color="#2a5a82" roughness={0.82} metalness={0.04} emissive="#061018" emissiveIntensity={0.4} />
    </mesh>
  );
}

function ShadowVolume() {
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[3.2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[2.55, 2.9, 8.4, 48, 1, true]} />
        <meshBasicMaterial color="#d4b07a" transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[1.58, 1.72, 8.4, 48, 1, true]} />
        <meshBasicMaterial color="#6a1408" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Moon({ time }: Props) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, dt) => {
    const axis = shadowAxis(time);
    const mag = umbralMagnitudeAt(time);
    const pen = penumbraIntensity(time);
    if (mesh.current) {
      mesh.current.position.set(MOON_X, GAMMA * 1.55, axis * 2.6);
      mesh.current.rotation.y += dt * 0.08;
    }
    if (mat.current) {
      mat.current.emissiveIntensity = 0.08 + mag * 0.55;
      mat.current.color.setRGB(0.94 - pen * 0.12, 0.9 - mag * 0.45, 0.8 - mag * 0.55);
    }
  });

  return (
    <mesh ref={mesh} castShadow receiveShadow position={[MOON_X, GAMMA * 1.55, 0]}>
      <sphereGeometry args={[0.52, 64, 64]} />
      <meshStandardMaterial ref={mat} color="#f0e6cc" roughness={0.95} metalness={0} emissive="#7a2a10" emissiveIntensity={0.1} />
    </mesh>
  );
}

function Scene({ time }: Props) {
  return (
    <>
      <color attach="background" args={["#04050a"]} />
      <Stars radius={90} depth={50} count={1200} factor={2.8} saturation={0} fade speed={0.25} />
      <ambientLight intensity={0.07} color="#8a6a55" />
      <hemisphereLight args={["#1a2233", "#120804", 0.18]} />
      <directionalLight
        castShadow
        position={[-28, 0.15, 0]}
        intensity={5.2}
        color="#fff3d0"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={10}
        shadow-camera-far={50}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0004}
      />
      <Earth />
      <ShadowVolume />
      <Moon time={time} />
    </>
  );
}

export default function EclipseCanvas({ time }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [7.8, 2.4, 6.2], fov: 36, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(3.4, 0.4, 0);
        gl.setClearColor("#04050a");
      }}
    >
      <Scene time={time} />
    </Canvas>
  );
}
