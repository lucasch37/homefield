"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const SCALE = 0.4;
const ORBIT_SPEED = 0.24;
const PANEL = { w: 0.26, h: 0.2, d: 0.008, gap: 0.012, count: 3 };

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

// Crinkled multi-layer insulation: overlapping facets of slightly different gold.
function foilTexture() {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = "#c8962e";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 700; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      const s = 6 + rand() * 26;
      const l = 38 + rand() * 34;
      ctx.fillStyle = `hsla(${40 + rand() * 8}, 70%, ${l}%, ${0.25 + rand() * 0.35})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rand() - 0.5) * s * 2, y + (rand() - 0.5) * s * 2);
      ctx.lineTo(x + (rand() - 0.5) * s * 2, y + (rand() - 0.5) * s * 2);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function solarCellTexture() {
  const texture = canvasTexture(256, 200, (ctx) => {
    ctx.fillStyle = "#9aa5b5";
    ctx.fillRect(0, 0, 256, 200);
    const cols = 8;
    const rows = 6;
    const gap = 3;
    const cw = (256 - gap * (cols + 1)) / cols;
    const ch = (200 - gap * (rows + 1)) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = gap + c * (cw + gap);
        const y = gap + r * (ch + gap);
        const grad = ctx.createLinearGradient(x, y, x + cw, y + ch);
        grad.addColorStop(0, "#1a3a86");
        grad.addColorStop(1, "#0a1a48");
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, cw, ch);
        ctx.fillStyle = "rgba(170,190,230,.25)";
        for (let b = 1; b < 3; b++) ctx.fillRect(x, y + (ch * b) / 3, cw, 1);
      }
    }
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function useSatelliteMaterials() {
  return useMemo(() => {
    const foil = foilTexture();
    foil.colorSpace = THREE.SRGBColorSpace;
    const foilBump = foilTexture();
    const cells = solarCellTexture();

    const frame = new THREE.MeshStandardMaterial({ color: "#a8b0ba", metalness: 0.85, roughness: 0.35 });
    const panelBack = new THREE.MeshStandardMaterial({ color: "#d9dde3", metalness: 0.1, roughness: 0.7 });
    const panelFront = new THREE.MeshStandardMaterial({
      map: cells,
      metalness: 0.55,
      roughness: 0.22,
      emissive: new THREE.Color("#06102c"),
    });
    return {
      foil: new THREE.MeshStandardMaterial({
        map: foil,
        bumpMap: foilBump,
        bumpScale: 1.5,
        metalness: 0.9,
        roughness: 0.28,
      }),
      white: new THREE.MeshStandardMaterial({ color: "#eef0f3", metalness: 0.05, roughness: 0.55 }),
      metal: frame,
      dark: new THREE.MeshStandardMaterial({ color: "#1d2128", metalness: 0.7, roughness: 0.4 }),
      lens: new THREE.MeshStandardMaterial({ color: "#05070c", metalness: 1, roughness: 0.05, emissive: "#0b2a5a", emissiveIntensity: 0.6 }),
      // BoxGeometry face order: +x, -x, +y, -y, +z (front, toward the sun), -z.
      panel: [frame, frame, frame, frame, panelFront, panelBack],
    };
  }, []);
}

function dishGeometry() {
  const focal = 0.08;
  const points = Array.from({ length: 16 }, (_, i) => {
    const r = (i / 15) * 0.11;
    return new THREE.Vector2(r, (r * r) / (4 * focal));
  });
  return new THREE.LatheGeometry(points, 40);
}

function SolarWing({ side, materials }: { side: 1 | -1; materials: ReturnType<typeof useSatelliteMaterials> }) {
  const step = PANEL.w + PANEL.gap;
  return (
    <>
      {Array.from({ length: PANEL.count }, (_, i) => (
        <mesh key={i} position={[side * (PANEL.w / 2 + i * step), 0, 0]} material={materials.panel}>
          <boxGeometry args={[PANEL.w, PANEL.h, PANEL.d]} />
        </mesh>
      ))}
      {Array.from({ length: PANEL.count - 1 }, (_, i) => (
        <mesh key={`hinge-${i}`} position={[side * (PANEL.w + PANEL.gap / 2 + i * step), 0, 0]} material={materials.metal}>
          <boxGeometry args={[PANEL.gap, PANEL.h * 0.3, PANEL.d * 1.5]} />
        </mesh>
      ))}
    </>
  );
}

export function Satellite({
  animate,
  orbitRadius,
  earthRadius,
  sunDir,
}: {
  animate: boolean;
  orbitRadius: number;
  earthRadius: number;
  sunDir: THREE.Vector3;
}) {
  const materials = useSatelliteMaterials();
  const dish = useMemo(() => dishGeometry(), []);
  const sat = useRef<THREE.Group>(null);
  const wings = useRef<THREE.Group[]>([]);
  const angle = useRef(-Math.PI * 0.42);
  const scratch = useMemo(() => ({ q: new THREE.Quaternion(), sun: new THREE.Vector3(), origin: new THREE.Vector3() }), []);
  const beamLength = orbitRadius - earthRadius * 1.02 - 0.1;

  useFrame((_, delta) => {
    if (animate) angle.current += Math.min(delta, 0.1) * ORBIT_SPEED;
    const s = sat.current;
    if (!s) return;
    s.position.set(Math.cos(angle.current) * orbitRadius, 0, -Math.sin(angle.current) * orbitRadius);
    s.lookAt(scratch.origin);
    // Turn the solar wings about their boom so the cells face the sun.
    s.getWorldQuaternion(scratch.q);
    scratch.sun.copy(sunDir).applyQuaternion(scratch.q.invert());
    const tilt = Math.atan2(-scratch.sun.y, scratch.sun.z);
    for (const wing of wings.current) if (wing) wing.rotation.x = tilt;
  });

  return (
    <group ref={sat}>
      <group scale={SCALE}>
        {/* Bus wrapped in gold foil, white radiator on top */}
        <mesh material={materials.foil}>
          <boxGeometry args={[0.2, 0.2, 0.3]} />
        </mesh>
        <mesh position={[0, 0.103, 0]} material={materials.white}>
          <boxGeometry args={[0.205, 0.008, 0.28]} />
        </mesh>
        <mesh position={[0, -0.103, 0.02]} material={materials.white}>
          <boxGeometry args={[0.16, 0.006, 0.2]} />
        </mesh>

        {/* Booms and sun-tracking solar wings */}
        {([1, -1] as const).map((side, i) => (
          <group key={side}>
            <mesh position={[side * 0.135, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.metal}>
              <cylinderGeometry args={[0.008, 0.008, 0.07, 12]} />
            </mesh>
            <group
              position={[side * 0.17, 0, 0]}
              ref={(g) => {
                if (g) wings.current[i] = g;
              }}
            >
              <SolarWing side={side} materials={materials} />
            </group>
          </group>
        ))}

        {/* Earth-facing imaging instrument */}
        <mesh position={[0, -0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={materials.dark}>
          <cylinderGeometry args={[0.05, 0.055, 0.1, 32]} />
        </mesh>
        <mesh position={[0, -0.02, 0.251]} material={materials.lens}>
          <circleGeometry args={[0.042, 32]} />
        </mesh>

        {/* High-gain antenna on a mast, pointing away from Earth */}
        <mesh position={[0.04, 0.04, -0.18]} rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
          <cylinderGeometry args={[0.007, 0.007, 0.06, 10]} />
        </mesh>
        <mesh geometry={dish} position={[0.04, 0.04, -0.21]} rotation={[-Math.PI / 2, 0, 0]} material={materials.white} />
        <mesh position={[0.04, 0.04, -0.25]} rotation={[Math.PI / 2, 0, 0]} material={materials.metal}>
          <cylinderGeometry args={[0.004, 0.004, 0.07, 8]} />
        </mesh>
        <mesh position={[0.04, 0.04, -0.285]} material={materials.dark}>
          <sphereGeometry args={[0.01, 12, 12]} />
        </mesh>

        {/* Star trackers */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.07, 0.125, -0.1]} rotation={[0.5, 0, s * 0.4]} material={materials.dark}>
            <cylinderGeometry args={[0.018, 0.022, 0.045, 16]} />
          </mesh>
        ))}

        {/* Thrusters */}
        {[
          [0.08, 0.08],
          [-0.08, 0.08],
          [0.08, -0.08],
          [-0.08, -0.08],
        ].map(([x, y]) => (
          <mesh key={`${x}${y}`} position={[x, y, -0.16]} rotation={[-Math.PI / 2, 0, 0]} material={materials.metal}>
            <coneGeometry args={[0.014, 0.025, 12, 1, true]} />
          </mesh>
        ))}
      </group>

      {/* Faint sensor footprint reaching down to the surface */}
      <mesh position={[0, 0, 0.1 + beamLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.16, beamLength, 40, 1, true]} />
        <meshBasicMaterial
          color="#67e8f9"
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
