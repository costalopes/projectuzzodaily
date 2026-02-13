import { useEffect, useState } from "react";

export const AmbientParticles = () => {
  const [particles] = useState(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 12,
      size: 3 + Math.random() * 5,
      emoji: ["✦", "·", "⋆", "˚", "✧", "°", "⊹"][Math.floor(Math.random() * 7)],
      color: Math.random() > 0.5 ? "text-primary/15" : "text-accent/15",
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <span key={p.id} className={`absolute ${p.color}`}
          style={{
            left: `${p.left}%`, bottom: "-10px",
            fontSize: `${p.size * 3}px`,
            animation: `particle-drift ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}>
          {p.emoji}
        </span>
      ))}
    </div>
  );
};
