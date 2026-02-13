import { useState } from "react";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

export const CoffeeTracker = () => {
  const [cups, setCups] = useState(1);
  const MAX = 5;

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Coffee className="w-3 h-3 text-accent" />
          cafés
        </h3>
      </div>

      <div className="flex items-center justify-center gap-1.5 py-1">
        {Array.from({ length: MAX }, (_, i) => (
          <button
            key={i}
            onClick={() => setCups(i + 1)}
            className="transition-all hover:scale-110"
          >
            <svg width="22" height="22" viewBox="0 0 16 16" className="image-rendering-pixelated">
              {i < cups && (
                <g className={i === cups - 1 ? "animate-steam" : ""}>
                  <rect x="5" y="1" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.25)" />
                  <rect x="7" y="0" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.15)" />
                  <rect x="9" y="1" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.25)" />
                </g>
              )}
              <rect x="3" y="5" width="9" height="1" fill={i < cups ? "hsl(var(--accent))" : "hsl(var(--muted))"} />
              <rect x="3" y="6" width="1" height="7" fill={i < cups ? "hsl(var(--accent))" : "hsl(var(--muted))"} />
              <rect x="11" y="6" width="1" height="7" fill={i < cups ? "hsl(var(--accent))" : "hsl(var(--muted))"} />
              <rect x="3" y="13" width="9" height="1" fill={i < cups ? "hsl(var(--accent))" : "hsl(var(--muted))"} />
              <rect x="4" y="7" width="7" height="6" fill={i < cups ? "hsl(25 40% 25%)" : "hsl(var(--muted) / 0.5)"} />
              {i < cups && <rect x="4" y="7" width="7" height="1" fill="hsl(25 40% 35%)" />}
              <rect x="12" y="7" width="2" height="1" fill={i < cups ? "hsl(var(--accent))" : "hsl(var(--muted))"} />
              <rect x="13" y="8" width="1" height="3" fill={i < cups ? "hsl(var(--accent))" : "hsl(var(--muted))"} />
              <rect x="12" y="11" width="2" height="1" fill={i < cups ? "hsl(var(--accent))" : "hsl(var(--muted))"} />
            </svg>
          </button>
        ))}
      </div>

      <p className="text-[9px] text-center text-muted-foreground/30 font-mono mt-0.5">
        {cups === 1 && "primeiro café"}
        {cups === 2 && "segundo, bora!"}
        {cups === 3 && "modo turbo"}
        {cups === 4 && "calma lá..."}
        {cups === 5 && "beba água!"}
      </p>
    </div>
  );
};
