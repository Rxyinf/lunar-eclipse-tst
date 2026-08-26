"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { GAMMA, penumbraIntensity, shadowAxis, umbralMagnitudeAt } from "@/lib/eclipse";

const VERT = "varying vec3 vN;\nvarying vec3 vObj;\nvoid main() {\n  vN = normalMatrix * normal;\n  vObj = position;\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}";
const FRAG = "uniform float uMagnitude;\nuniform float uPenumbra;\nuniform vec3 uLightDir;\nvarying vec3 vN;\nvarying vec3 vObj;\nfloat hash(vec3 p) {\n  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);\n}\nvoid main() {\n  vec3 nrm = normalize(vN);\n  vec3 L = normalize(uLightDir);\n  float ndl = max(dot(nrm, L), 0.0);\n  float maria = smoothstep(0.35, 0.75, hash(floor(vObj * 7.0)));\n  vec3 rock = mix(vec3(0.90, 0.86, 0.78), vec3(0.55, 0.52, 0.48), maria);\n  vec3 lit = rock * (0.28 + 0.72 * ndl);\n  lit *= mix(1.0, 0.58, clamp(uPenumbra, 0.0, 1.0));\n  lit = mix(lit, lit * vec3(1.08, 0.88, 0.70), uPenumbra * 0.45);\n  float edge = -1.0 + 2.0 * uMagnitude;\n  float inU = 1.0 - smoothstep(edge - 0.06, edge + 0.05, vObj.y);\n  vec3 copper = vec3(0.62, 0.18, 0.06) * (0.25 + 0.55 * ndl);\n  copper += vec3(0.08, 0.02, 0.01);\n  vec3 col = mix(lit, copper, inU * step(0.002, uMagnitude));\n  gl_FragColor = vec4(col, 1.0);\n}";

type Props = { time: number; live: boolean; reduced: boolean };

function Moon({ time, live, reduced }: Props) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uMagnitude: { value: 0 },
      uPenumbra: { value: 0 },
      uLightDir: { value: new THREE.Vector3(1, 0.15, 0.05) },
    }),
    [],
  );

  useFrame((_, dt) => {
    const t = live && !reduced ? Date.now() : time;
    const axis = shadowAxis(t);
    const mag = umbralMagnitudeAt(t);
    const pen = penumbraIntensity(t);
    if (mesh.current) {
      mesh.current.position.set(4.15, GAMMA * 1.35, axis * 3.4);
      mesh.current.rotation.y += reduced ? dt * 0.04 : dt * 0.12;
    }
    if (mat.current) {
      mat.current.uniforms.uMagnitude.value = mag;
      mat.current.uniforms.uPenumbra.value = pen;
    }
  });

  return (
    <mesh ref={mesh} position={[4.15, GAMMA * 1.35, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial ref={mat} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
    </mesh>
  );
}

function Earth() {
  return (
    <mesh>
      <sphereGeometry args={[1.35, 48, 48]} />
      <meshStandardMaterial color="#2c5f8a" roughness={0.72} metalness={0.05} emissive="#071018" />
    </mesh>
  );
}

function Shadows() {
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[2.4, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[2.85, 3.2, 7.2, 48, 1, true]} />
        <meshBasicMaterial color="#c4a06a" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[1.45, 1.62, 7.2, 48, 1, true]} />
        <meshBasicMaterial color="#6b1c0c" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Scene({ time, live, reduced }: Props) {
  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <Stars radius={80} depth={40} count={reduced ? 400 : 1400} factor={3} saturation={0} fade speed={reduced ? 0.1 : 0.4} />
      <ambientLight intensity={0.07} />
      <directionalLight position={[-12, 2, 1]} intensity={2.4} color="#fff4d6" />
      <pointLight position={[-18, 0, 0]} intensity={8} distance={40} color="#ffd9a0" />
      <Earth />
      <Shadows />
      <Moon time={time} live={live} reduced={reduced} />
      <OrbitControls enablePan={false} minDistance={7} maxDistance={18} maxPolarAngle={Math.PI * 0.62} minPolarAngle={Math.PI * 0.28} />
    </>
  );
}

export default function EclipseCanvas({ time, live, reduced }: Props) {
  return (
    <Canvas camera={{ position: [8.4, 3.2, 9.2], fov: 42 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: false }} frameloop={reduced && !live ? "demand" : "always"}>
      <Scene time={time} live={live} reduced={reduced} />
    </Canvas>
  );
}
