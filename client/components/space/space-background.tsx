"use client";

import Galaxy from "./galaxy";

const FOCAL: [number, number] = [0.5, 0.5];
const ROTATION: [number, number] = [1.0, 0.0];

export default function SpaceBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_60%,#0b1433_0%,#050816_55%,#02030a_100%)]"
      aria-hidden="true"
    >
      <Galaxy
        focal={FOCAL}
        rotation={ROTATION}
        density={1.1}
        glowIntensity={0.35}
        saturation={0.35}
        hueShift={220}
        twinkleIntensity={0.4}
        rotationSpeed={0.03}
        starSpeed={0.3}
        speed={0.6}
        mouseRepulsion
        repulsionStrength={1.2}
        transparent
      />
    </div>
  );
}
