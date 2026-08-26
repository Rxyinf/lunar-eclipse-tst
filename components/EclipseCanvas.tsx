"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { GAMMA, shadowAxis, umbralMagnitudeAt, penumbraIntensity } from "@/lib/eclipse";

type Props = { time: number };

const MOON_X = 5.55;
const EARTH_R = 1.72;
const MOON_R = 0.5;
const TX = { lat: 30.2672, lon: -97.7431 };

function latLonToVec(lat: number, lon: number, r: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function nightLonDeg(time: number) {
  const utcHours = new Date(time).getUTCHours() + new Date(time).getUTCMinutes() / 60;
  const subsolar = -15 * (utcHours - 12);
  let night = subsolar + 180;
  while (night > 180) night -= 360;
  while (night < -180) night += 360;
  return night;
}

const EARTH_VERT = `
varying vec2 vUv;
varying vec3 vN;
void main() {
  vUv = uv;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const EARTH_FRAG = `
uniform sampler2D uDay;
uniform sampler2D uNight;
varying vec2 vUv;
varying vec3 vN;
void main() {
  vec3 L = normalize(vec3(-1.0, 0.04, 0.0));
  float ndl = dot(normalize(vN), L);
  vec3 day = texture2D(uDay, vUv).rgb;
  vec3 night = texture2D(uNight, vUv).rgb * 1.55;
  float f = smoothstep(-0.12, 0.22, ndl);
  vec3 col = mix(night, day, f);
  float rim = pow(1.0 - abs(ndl), 3.4);
  col += vec3(0.15, 0.35, 0.7) * rim * 0.35;
  gl_FragColor = vec4(col, 1.0);
}
`;

function Earth({ time }: Props) {
  const group = useRef<THREE.Group>(null);
  const [dayMap, nightMap] = useTexture(["/earth-day.jpg", "/earth-night.jpg"]);
  dayMap.colorSpace = THREE.SRGBColorSpace;
  nightMap.colorSpace = THREE.SRGBColorSpace;
  const uniforms = useMemo(
    () => ({ uDay: { value: dayMap }, uNight: { value: nightMap } }),
    [dayMap, nightMap],
  );
  const txPos = useMemo(() => latLonToVec(TX.lat, TX.lon, EARTH_R + 0.03), []);

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.degToRad(nightLonDeg(time) + 180);
  });

  return (
    <group ref={group}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[EARTH_R, 64, 64]} />
        <shaderMaterial vertexShader={EARTH_VERT} fragmentShader={EARTH_FRAG} uniforms={uniforms} />
      </mesh>
      <mesh scale={1.045}>
        <sphereGeometry args={[EARTH_R, 48, 48]} />
        <meshBasicMaterial color="#5aa7ff" transparent opacity={0.11} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh position={txPos}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#ffd27a" />
      </mesh>
    </group>
  );
}

function ShadowVolume({ time }: Props) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const axis = shadowAxis(time);
    group.current.position.set(EARTH_R + 0.05, GAMMA * 0.15, axis * 0.35);
  });
  return (
    <group ref={group} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[2.35, 2.85, 7.6, 48, 1, true]} />
        <meshBasicMaterial color="#d4b07a" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[1.55, 1.72, 7.6, 48, 1, true]} />
        <meshBasicMaterial color="#6a1408" transparent opacity={0.32} side={THREE.DoubleSide} depthWrite={false} />
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
      mesh.current.position.set(MOON_X, GAMMA * 1.45, axis * 2.45);
      mesh.current.rotation.y += dt * 0.08;
    }
    if (mat.current) {
      mat.current.emissiveIntensity = 0.08 + mag * 0.55;
      mat.current.color.setRGB(0.94 - pen * 0.12, 0.9 - mag * 0.45, 0.8 - mag * 0.55);
    }
  });

  return (
    <mesh ref={mesh} castShadow receiveShadow position={[MOON_X, GAMMA * 1.45, 0]}>
      <sphereGeometry args={[MOON_R, 64, 64]} />
      <meshStandardMaterial ref={mat} color="#f0e6cc" roughness={0.95} metalness={0} emissive="#7a2a10" emissiveIntensity={0.1} />
    </mesh>
  );
}

function Scene({ time }: Props) {
  return (
    <>
      <color attach="background" args={["#04050a"]} />
      <Stars radius={90} depth={50} count={1200} factor={2.8} saturation={0} fade speed={0.25} />
      <ambientLight intensity={0.045} color="#8a6a55" />
      <hemisphereLight args={["#1a2233", "#120804", 0.12]} />
      <directionalLight
        castShadow
        position={[-28, 0.15, 0]}
        intensity={5.4}
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
      <Earth time={time} />
      <ShadowVolume time={time} />
      <Moon time={time} />
    </>
  );
}

export default function EclipseCanvas({ time }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [8.2, 2.1, 6.6], fov: 34, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(2.4, 0.25, 0);
        gl.setClearColor("#04050a");
      }}
    >
      <Suspense fallback={null}>
        <Scene time={time} />
      </Suspense>
    </Canvas>
  );
}
