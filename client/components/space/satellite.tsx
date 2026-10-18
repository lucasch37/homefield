"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const MODEL_URL = "/models/landsat-8.glb";
const DRACO_PATH = "/draco/";
const SPAN = 0.85;
const ORBIT_SPEED = 0.24;
// lookAt aims local +z at Earth; this turns the model so its instrument deck faces down.
const MODEL_ROTATION: [number, number, number] = [Math.PI / 2, 0, 0];

function finish(material: THREE.MeshStandardMaterial) {
  const name = material.name.toLowerCase();
  if (/gold|bronze|mainpanels|mainsections/.test(name)) {
    material.metalness = 0.9;
    material.roughness = 0.38;
  } else if (/silver|grey/.test(name)) {
    material.metalness = 0.8;
    material.roughness = 0.32;
  } else if (/solarpanel-(face|\d)/.test(name)) {
    material.metalness = 0.6;
    material.roughness = 0.22;
  }
}

function useLandsat() {
  const { scene } = useGLTF(MODEL_URL, DRACO_PATH);
  return useMemo(() => {
    const model = scene.clone(true);
    model.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const tune = (m: THREE.Material) => {
        const copy = (m as THREE.MeshStandardMaterial).clone();
        finish(copy);
        // The dive fades the model out. Switching it to transparent mid-scene compiles new
        // shader programs and freezes the page for seconds, so it renders transparent from load.
        copy.transparent = true;
        copy.forceSinglePass = true;
        return copy;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(tune) : tune(mesh.material);
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    return { model, scale: SPAN / Math.max(size.x, size.y, size.z) };
  }, [scene]);
}

export function Satellite({
  animate,
  orbitRadius,
  earthRadius,
}: {
  animate: boolean;
  orbitRadius: number;
  earthRadius: number;
}) {
  const { model, scale } = useLandsat();
  const sat = useRef<THREE.Group>(null);
  const angle = useRef(-Math.PI * 0.42);
  const origin = useMemo(() => new THREE.Vector3(), []);
  const beamStart = 0.03;
  const beamLength = orbitRadius - earthRadius * 1.02 - beamStart;

  useFrame((_, delta) => {
    if (animate) angle.current += Math.min(delta, 0.1) * ORBIT_SPEED;
    const s = sat.current;
    if (!s) return;
    s.position.set(Math.cos(angle.current) * orbitRadius, 0, -Math.sin(angle.current) * orbitRadius);
    s.lookAt(origin);
  });

  return (
    <group ref={sat}>
      <group rotation={MODEL_ROTATION} scale={scale}>
        <primitive object={model} />
      </group>

      {/* Faint sensor footprint reaching down to the surface */}
      <mesh position={[0, 0, beamStart + beamLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.16, beamLength, 40, 1, true]} />
        <meshBasicMaterial
          color="#5eead4"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload(MODEL_URL, DRACO_PATH);
