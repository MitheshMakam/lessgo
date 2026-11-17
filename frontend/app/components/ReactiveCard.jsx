"use client";

import { useRef, useState } from "react";

/**
 * A card that gently tilts toward the cursor on hover (3D-ish effect) and
 * shows a soft radial highlight following the mouse. Falls back to a normal
 * static card on touch devices where mousemove doesn't fire meaningfully.
 */
export default function ReactiveCard({ children, className = "", as: Tag = "div", ...props }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = ((y - rect.height / 2) / rect.height) * -8;
    const rotateY = ((x - rect.width / 2) / rect.width) * 8;

    setStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    });
    setGlow({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setStyle({ transform: "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)" });
    setGlow((g) => ({ ...g, opacity: 0 }));
  };

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, transition: "transform 150ms ease-out" }}
      className={`relative overflow-hidden will-change-transform ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: glow.opacity,
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(51,136,255,0.15), transparent 60%)`,
        }}
      />
      {children}
    </Tag>
  );
}
