import { useEffect, useState } from "react";

export const AmbientParticles = () => {
  const [particles] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 12 + Math.random() * 10,
      size: 2 + Math.random() * 4,
      emoji: ["✨", "·", "⋆", "˚", "✧", "°"][Math.floor(Math.random() * 6)],
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute text-primary/20"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            fontSize: `${p.size * 3}px`,
            animation: `particle-float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
};
