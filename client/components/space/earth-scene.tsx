"use client";

import { Environment, Lightformer, Line, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CENTER_Y_LANDSCAPE, CENTER_Y_PORTRAIT, FILL_HEIGHT, FILL_WIDTH } from "./earth-layout";
import { Satellite } from "./satellite";

const EARTH_RADIUS = 1.5;
const FOV = 35;

const AXIAL_TILT = THREE.MathUtils.degToRad(23.4);
// Together these center the globe on about 41N, 122W (Pacific Northwest) at t = 0.
const VIEW_TILT = 0.8;
const PNW_SPIN = THREE.MathUtils.degToRad(10);
const SPIN_SPEED = 0.03;
const CLOUD_SPEED = 0.04;
const SUN_DIR = new THREE.Vector3(-0.75, 0.35, 0.9).normalize();

const TEXTURES = [
  "/textures/earth/day.jpg",
  "/textures/earth/night.jpg",
  "/textures/earth/specular.jpg",
  "/textures/earth/clouds.jpg",
];

const earthVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const earthFragment = /* glsl */ `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D specMap;
uniform vec3 sunDir;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(cameraPosition - vPosW);
  float ndl = dot(n, sunDir);
  float dayMix = smoothstep(-0.12, 0.22, ndl);

  vec3 day = texture2D(dayMap, vUv).rgb * (max(ndl, 0.0) * 1.35 + 0.05);
  vec3 night = texture2D(nightMap, vUv).rgb * vec3(2.6, 2.0, 1.3);
  vec3 color = mix(night, day, dayMix);

  vec3 h = normalize(sunDir + v);
  float water = texture2D(specMap, vUv).r;
  color += vec3(0.75, 0.85, 1.0) * pow(max(dot(n, h), 0.0), 120.0) * water * 0.08 * dayMix;

  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  color += vec3(0.3, 0.6, 1.0) * fresnel * 0.45 * smoothstep(-0.35, 0.6, ndl);

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const cloudFragment = /* glsl */ `
uniform sampler2D cloudMap;
uniform vec3 sunDir;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  float ndl = dot(normalize(vNormalW), sunDir);
  float a = texture2D(cloudMap, vUv).r;
  float light = max(ndl, 0.0) * 0.95 + 0.03;
  gl_FragColor = vec4(vec3(light), a * smoothstep(-0.3, 0.2, ndl) * 0.9);
  #include <colorspace_fragment>
}
`;

const atmosphereVertex = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vNormalW;
void main() {
  vNormalV = normalize(normalMatrix * normal);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const atmosphereFragment = /* glsl */ `
uniform vec3 sunDir;
varying vec3 vNormalV;
varying vec3 vNormalW;
void main() {
  // Back faces: view-space normal z runs from 0 at the outer edge to about -0.47 at Earth's limb.
  float intensity = pow(smoothstep(0.0, 0.47, -normalize(vNormalV).z), 2.2);
  float lit = mix(0.25, 1.0, smoothstep(-0.4, 0.5, dot(normalize(vNormalW), sunDir)));
  gl_FragColor = vec4(0.38, 0.66, 1.0, intensity * lit * 0.85);
}
`;

function prepareTextures(textures: THREE.Texture | THREE.Texture[]) {
  const [day, night, ...data] = Array.isArray(textures) ? textures : [textures];
  day.colorSpace = THREE.SRGBColorSpace;
  night.colorSpace = THREE.SRGBColorSpace;
  for (const t of [day, night, ...data]) t.anisotropy = 8;
}

function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);

  useLayoutEffect(() => {
    const aspect = width / Math.max(height, 1);
    const halfHeight = Math.max(EARTH_RADIUS / FILL_HEIGHT, EARTH_RADIUS / (FILL_WIDTH * aspect));
    const centerY = aspect >= 1 ? CENTER_Y_LANDSCAPE : CENTER_Y_PORTRAIT;
    camera.position.set(0, (centerY - 0.5) * 2 * halfHeight, halfHeight / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    camera.updateProjectionMatrix();
  }, [camera, width, height]);

  return null;
}

function Earth({ animate, onReady }: { animate: boolean; onReady: () => void }) {
  const [day, night, spec, clouds] = useTexture(TEXTURES, prepareTextures);
  const spin = useRef<THREE.Group>(null);
  const cloudLayer = useRef<THREE.Mesh>(null);

  const earthUniforms = useMemo(
    () => ({ dayMap: { value: day }, nightMap: { value: night }, specMap: { value: spec }, sunDir: { value: SUN_DIR } }),
    [day, night, spec],
  );
  const cloudUniforms = useMemo(() => ({ cloudMap: { value: clouds }, sunDir: { value: SUN_DIR } }), [clouds]);
  const atmosphereUniforms = useMemo(() => ({ sunDir: { value: SUN_DIR } }), []);

  useEffect(onReady, [onReady]);

  useFrame((_, delta) => {
    if (!animate) return;
    const dt = Math.min(delta, 0.1);
    if (spin.current) spin.current.rotation.y += dt * SPIN_SPEED;
    if (cloudLayer.current) cloudLayer.current.rotation.y += dt * (CLOUD_SPEED - SPIN_SPEED);
  });

  return (
    <group rotation={[VIEW_TILT, 0, 0]}>
      <group rotation={[0, 0, -AXIAL_TILT]}>
        <group ref={spin} rotation={[0, PNW_SPIN, 0]}>
          <mesh>
            <sphereGeometry args={[EARTH_RADIUS, 160, 160]} />
            <shaderMaterial vertexShader={earthVertex} fragmentShader={earthFragment} uniforms={earthUniforms} />
          </mesh>
          <mesh ref={cloudLayer}>
            <sphereGeometry args={[EARTH_RADIUS * 1.01, 128, 128]} />
            <shaderMaterial
              vertexShader={earthVertex}
              fragmentShader={cloudFragment}
              uniforms={cloudUniforms}
              transparent
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.13, 96, 96]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={atmosphereUniforms}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function OrbitPath({ radius }: { radius: number }) {
  const points = useMemo(
    () =>
      Array.from({ length: 193 }, (_, i) => {
        const a = (i / 192) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      }),
    [radius],
  );
  return <Line points={points} color="#7dd3fc" lineWidth={1} transparent opacity={0.18} depthWrite={false} />;
}

const ORBIT_RADIUS = 2.05;
const ORBIT_TILT: [number, number, number] = [0.5, 0, 0.28];

export default function EarthScene({ animate, onReady }: { animate: boolean; onReady: () => void }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: FOV }}
      dpr={[1, 1.75]}
      frameloop={animate ? "always" : "demand"}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <CameraRig />
      <ambientLight intensity={0.12} />
      <hemisphereLight args={["#1a2a4a", "#3a6ab0", 0.35]} />
      <directionalLight position={SUN_DIR.clone().multiplyScalar(10)} intensity={3} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#fff4e0" position={[-6, 3, 7]} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#4a7ad0" position={[0, -6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="ring" intensity={0.6} color="#9ab8ff" position={[6, 2, -4]} scale={3} />
      </Environment>
      <Suspense fallback={null}>
        <Earth animate={animate} onReady={onReady} />
        <group rotation={ORBIT_TILT}>
          <OrbitPath radius={ORBIT_RADIUS} />
          <Satellite animate={animate} orbitRadius={ORBIT_RADIUS} earthRadius={EARTH_RADIUS} sunDir={SUN_DIR} />
        </group>
      </Suspense>
    </Canvas>
  );
}
