"use client";

import { Environment, Lightformer, Line, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeElements } from "@react-three/fiber";
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
uniform float fade;
varying vec3 vNormalV;
varying vec3 vNormalW;
void main() {
  // Back faces: view-space normal z runs from 0 at the outer edge to about -0.47 at Earth's limb.
  float intensity = pow(smoothstep(0.0, 0.47, -normalize(vNormalV).z), 2.2);
  float lit = mix(0.25, 1.0, smoothstep(-0.4, 0.5, dot(normalize(vNormalW), sunDir)));
  gl_FragColor = vec4(0.38, 0.66, 1.0, intensity * lit * 0.85 * fade);
}
`;

function prepareTextures(textures: THREE.Texture | THREE.Texture[]) {
  const [day, night, ...data] = Array.isArray(textures) ? textures : [textures];
  day.colorSpace = THREE.SRGBColorSpace;
  night.colorSpace = THREE.SRGBColorSpace;
  for (const t of [day, night, ...data]) t.anisotropy = 8;
}

function CameraRig({ clockRef }: { clockRef: DiveClock }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);

  useLayoutEffect(() => {
    if (clockRef.current >= 0) return;
    const aspect = width / Math.max(height, 1);
    const halfHeight = Math.max(EARTH_RADIUS / FILL_HEIGHT, EARTH_RADIUS / (FILL_WIDTH * aspect));
    const centerY = aspect >= 1 ? CENTER_Y_LANDSCAPE : CENTER_Y_PORTRAIT;
    camera.position.set(0, (centerY - 0.5) * 2 * halfHeight, halfHeight / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    camera.updateProjectionMatrix();
  }, [camera, width, height, clockRef]);

  return null;
}

function Earth({
  animate,
  onReady,
  spinRef,
  clockRef,
}: {
  animate: boolean;
  onReady: () => void;
  spinRef: React.RefObject<THREE.Group | null>;
  clockRef: DiveClock;
}) {
  const [day, night, spec, clouds] = useTexture(TEXTURES, prepareTextures);
  const cloudLayer = useRef<THREE.Mesh>(null);

  const earthUniforms = useMemo(
    () => ({
      dayMap: { value: day },
      nightMap: { value: night },
      specMap: { value: spec },
      sunDir: { value: SUN_DIR },
    }),
    [day, night, spec],
  );
  const cloudUniforms = useMemo(() => ({ cloudMap: { value: clouds }, sunDir: { value: SUN_DIR } }), [clouds]);
  const atmosphereUniforms = useMemo(() => ({ sunDir: { value: SUN_DIR }, fade: { value: 1 } }), []);
  const atmosphere = useRef<THREE.ShaderMaterial>(null);

  useEffect(onReady, [onReady]);

  useFrame((_, delta) => {
    if (!animate) return;
    const dt = Math.min(delta, 0.1);
    const t = clockRef.current;
    const diving = t >= 0;
    const spinRate = diving ? SPIN_SPEED * Math.max(0, 1 - t / DIVE_SPIN_STOP) : SPIN_SPEED;
    if (atmosphere.current)
      atmosphere.current.uniforms.fade.value = diving ? Math.max(0, 1 - t / (DIVE_SECONDS / 2)) : 1;
    if (spinRef.current) spinRef.current.rotation.y += dt * spinRate;
    if (cloudLayer.current) cloudLayer.current.rotation.y += dt * (CLOUD_SPEED - SPIN_SPEED);
  });

  return (
    <group rotation={[VIEW_TILT, 0, 0]}>
      <group rotation={[0, 0, -AXIAL_TILT]}>
        <group ref={spinRef} rotation={[0, PNW_SPIN, 0]}>
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
          ref={atmosphere}
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
  return <Line points={points} color="#5eead4" lineWidth={1} transparent opacity={0.18} depthWrite={false} />;
}

// Seconds since the dive started, or -1 while idle. Shared by every part of the scene that reacts to it.
type DiveClock = React.RefObject<number>;

const DIVE_SECONDS = 1.8;
const DIVE_SPIN_STOP = 0.4;
const DIP_SECONDS = 0.25;
const DIVE_FOV = 28;
const DIVE_ALTITUDE = 2;
const KING_COUNTY = { lat: 47.5, lon: -121.9 };

// Matches SphereGeometry's equirectangular UV layout, so the point lands on the texture's King County.
function surfacePoint(lat: number, lon: number, radius: number) {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const theta = THREE.MathUtils.degToRad(90 - lat);
  return new THREE.Vector3(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function DiveRig({
  spinRef,
  clockRef,
  onDip,
  onDiveEnd,
}: {
  spinRef: React.RefObject<THREE.Group | null>;
  clockRef: DiveClock;
  onDip?: () => void;
  onDiveEnd?: () => void;
}) {
  const rig = useRef<ReturnType<typeof createRig> | null>(null);

  useEffect(() => {
    clockRef.current = 0;
    return () => {
      clockRef.current = -1;
      const state = rig.current;
      rig.current = null;
      if (!state) return;
      state.camera.position.copy(state.startPos);
      state.camera.quaternion.copy(state.startQuaternion);
      state.camera.fov = state.startFov;
      state.camera.updateProjectionMatrix();
    };
  }, [clockRef]);

  useFrame(({ camera: cam }) => {
    if (clockRef.current < 0) return;
    const camera = cam as THREE.PerspectiveCamera;
    const state = (rig.current ??= createRig(camera));
    const now = performance.now();
    state.startedAt ??= now;
    const t = (clockRef.current = (now - state.startedAt) / 1000);
    const group = spinRef.current;
    if (!group) return;
    group.updateWorldMatrix(true, false);
    state.target.copy(state.local).applyMatrix4(group.matrixWorld);

    const e = easeInOutCubic(Math.min(1, t / DIVE_SECONDS));
    state.dir.copy(state.target).normalize();
    state.q.setFromUnitVectors(state.startDir, state.dir);
    const partial = state.partial.identity().slerp(state.q, e);
    const dist = THREE.MathUtils.lerp(state.startDist, EARTH_RADIUS * DIVE_ALTITUDE, e);
    camera.position.copy(state.startDir).applyQuaternion(partial).multiplyScalar(dist);
    state.look.lerpVectors(state.startTarget, state.target, e);
    camera.lookAt(state.look);
<<<<<<< HEAD
    // Ease into the roll that leaves the last frame north-up, like the map that follows. It's measured at the
    // last frame, straight down at King County, because mid-dive the view can pass over the pole. Unwrapped so
    // it never jumps between -180° and 180°.
    state.up.copy(camera.up).projectOnPlane(state.dir).normalize();
    state.north.setFromMatrixColumn(group.matrixWorld, 1).projectOnPlane(state.dir).normalize();
    const roll = Math.atan2(state.dir.dot(state.axis.crossVectors(state.north, state.up)), state.up.dot(state.north));
    state.roll = roll + Math.round((state.roll - roll) / (Math.PI * 2)) * Math.PI * 2;
    camera.rotateZ(-state.roll * e);
=======
>>>>>>> origin/master
    camera.fov = THREE.MathUtils.lerp(state.startFov, DIVE_FOV, e);
    camera.updateProjectionMatrix();

    if (!state.dipped && t >= DIVE_SECONDS - DIP_SECONDS) {
      state.dipped = true;
      onDip?.();
    }
    if (!state.ended && t >= DIVE_SECONDS) {
      state.ended = true;
      onDiveEnd?.();
    }
  });

  return null;
}

function createRig(camera: THREE.PerspectiveCamera) {
  const startPos = camera.position.clone();
  return {
    camera,
    startPos,
    startQuaternion: camera.quaternion.clone(),
    startDir: startPos.clone().normalize(),
    startDist: startPos.length(),
    startTarget: new THREE.Vector3(0, startPos.y, 0),
    startFov: camera.fov,
    local: surfacePoint(KING_COUNTY.lat, KING_COUNTY.lon, EARTH_RADIUS),
    target: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    look: new THREE.Vector3(),
<<<<<<< HEAD
    up: new THREE.Vector3(),
    north: new THREE.Vector3(),
    axis: new THREE.Vector3(),
    roll: 0,
=======
>>>>>>> origin/master
    q: new THREE.Quaternion(),
    partial: new THREE.Quaternion(),
    startedAt: null as number | null,
    dipped: false,
    ended: false,
  };
}

// Fades its children out over the first half of the dive, and restores them once it's over.
function DiveFade({
  clockRef,
  children,
  ...props
}: { clockRef: DiveClock; children: React.ReactNode } & ThreeElements["group"]) {
  const group = useRef<THREE.Group>(null);
  const faded = useRef(false);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const idle = clockRef.current < 0;
    if (idle && !faded.current) return;
    faded.current = !idle;
    const fade = idle ? 1 : Math.max(0, 1 - clockRef.current / (DIVE_SECONDS / 2));
    g.visible = fade > 0;
    g.traverse((node) => {
      const material = (node as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (!material) return;
      for (const m of Array.isArray(material) ? material : [material]) {
        m.userData.baseOpacity ??= m.opacity;
        m.userData.baseTransparent ??= m.transparent;
        m.transparent = idle ? m.userData.baseTransparent : true;
        m.opacity = m.userData.baseOpacity * fade;
      }
    });
  });
  return (
    <group ref={group} {...props}>
      {children}
    </group>
  );
}

const ORBIT_RADIUS = 2.05;
const ORBIT_TILT: [number, number, number] = [0.5, 0, 0.28];

export default function EarthScene({
  animate,
  onReady,
  diving = false,
<<<<<<< HEAD
  frozen = false,
=======
>>>>>>> origin/master
  onDip,
  onDiveEnd,
}: {
  animate: boolean;
  onReady: () => void;
  diving?: boolean;
<<<<<<< HEAD
  /** Stops rendering entirely, e.g. once the dive has faded to black. */
  frozen?: boolean;
=======
>>>>>>> origin/master
  onDip?: () => void;
  onDiveEnd?: () => void;
}) {
  const spinRef = useRef<THREE.Group>(null);
  const clockRef = useRef(-1);
  const live = animate || diving;
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: FOV }}
      dpr={[1, 1.75]}
<<<<<<< HEAD
      frameloop={frozen ? "never" : live ? "always" : "demand"}
=======
      frameloop={live ? "always" : "demand"}
>>>>>>> origin/master
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <CameraRig clockRef={clockRef} />
      {diving && <DiveRig spinRef={spinRef} clockRef={clockRef} onDip={onDip} onDiveEnd={onDiveEnd} />}
      <ambientLight intensity={0.12} />
      <hemisphereLight args={["#1a2a4a", "#3a6ab0", 0.35]} />
      <directionalLight position={SUN_DIR.clone().multiplyScalar(10)} intensity={3} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#fff4e0" position={[-6, 3, 7]} scale={[6, 6, 1]} />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#4a7ad0"
          position={[0, -6, 0]}
          rotation-x={Math.PI / 2}
          scale={[12, 12, 1]}
        />
        <Lightformer form="ring" intensity={0.6} color="#9ab8ff" position={[6, 2, -4]} scale={3} />
      </Environment>
      <Suspense fallback={null}>
        <Earth animate={live} onReady={onReady} spinRef={spinRef} clockRef={clockRef} />
      </Suspense>
      <DiveFade clockRef={clockRef} rotation={ORBIT_TILT}>
        <OrbitPath radius={ORBIT_RADIUS} />
        <Suspense fallback={null}>
          <Satellite animate={live} orbitRadius={ORBIT_RADIUS} earthRadius={EARTH_RADIUS} />
        </Suspense>
      </DiveFade>
    </Canvas>
  );
}
