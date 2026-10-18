"use client";

import Galaxy from "./galaxy";

export default function SpaceBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-black"
      aria-hidden="true"
    >
      <Galaxy />
    </div>
  );
}
