import { useState } from "react";
import { Coffee, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const CoffeeTracker = () => {
  const [cups, setCups] = useState(1);
  const [limit, setLimit] = useState(() => {
    const saved = localStorage.getItem("coffee-limit");
    return saved ? parseInt(saved) : 5;
  });
  const [showConfig, setShowConfig] = useState(false);
  const [customLimit, setCustomLimit] = useState("");

  const setLimitAndSave = (l: number) => {
    if (l < 1 || l > 20) return;
    setLimit(l);
    localStorage.setItem("coffee-limit", String(l));
    if (cups > l) setCups(l);
  };

  const handleCustomLimit = () => {
    const val = parseInt(customLimit);
    if (!isNaN(val) && val >= 1 && val <= 20) {
      setLimitAndSave(val);
      setCustomLimit("");
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-3 flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Coffee className="w-3.5 h-3.5 text-accent" />
          cafés
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-accent font-bold">{cups}/{limit}</span>
          <button onClick={() => setShowConfig(!showConfig)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <Settings2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="mb-2 animate-fade-in">
          <p className="text-[8px] font-mono text-muted-foreground/50 mb-1">// limite diário</p>
          <input
            type="number"
            min="1"
            max="20"
            value={customLimit || limit}
            onChange={(e) => setCustomLimit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomLimit()}
            onBlur={handleCustomLimit}
            className="w-full bg-muted/40 border border-border rounded-lg px-2 py-1 text-[10px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30"
            placeholder="ex: 5"
          />
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 py-1 flex-wrap">
        {Array.from({ length: limit }, (_, i) => (
          <button key={i} onClick={() => setCups(i + 1)} className="transition-all hover:scale-110 active:scale-95">
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

      <p className="text-[8px] text-center text-muted-foreground/40 font-mono mt-0.5">
        {cups === 1 && "primeiro café ☕"}
        {cups === 2 && "segundo, bora!"}
        {cups === 3 && "modo turbo 🚀"}
        {cups >= 4 && cups < limit && "calma lá..."}
        {cups === limit && "beba água! 💧"}
      </p>
    </div>
  );
};
