import { useState } from "react";
import { Coffee, Settings2, Plus, Minus } from "lucide-react";
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

  const add = () => setCups((c) => Math.min(c + 1, limit));
  const remove = () => setCups((c) => Math.max(c - 1, 0));
  const pct = Math.min((cups / limit) * 100, 100);

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

      {/* Coffee mug visual */}
      <div className="flex items-center justify-center py-1">
        <div className="relative w-14 h-16 flex items-end justify-center">
          {/* Mug body */}
          <div className="absolute inset-0 rounded-b-xl rounded-t-md border-2 border-accent/25 overflow-hidden bg-muted/10">
            {/* Coffee fill */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
              style={{ height: `${pct}%` }}
            >
              <div className="absolute inset-0 bg-accent/20" />
              {/* Steam-like wave on top */}
              <svg className="absolute -top-2 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none" style={{ height: "8px" }}>
                <path className="animate-wave" d="M0 5 Q 12.5 0, 25 5 Q 37.5 10, 50 5 Q 62.5 0, 75 5 Q 87.5 10, 100 5 L 100 10 L 0 10 Z" fill="hsl(var(--accent) / 0.2)" />
                <path className="animate-wave-slow" d="M0 6 Q 15 2, 30 6 Q 45 10, 60 6 Q 75 2, 90 6 Q 97 9, 100 6 L 100 10 L 0 10 Z" fill="hsl(var(--accent) / 0.12)" />
              </svg>
              {/* Coffee crema highlight */}
              <div className="absolute top-0 left-1 right-1 h-1 bg-accent/15 rounded-full" />
            </div>
            {/* Mug reflection */}
            <div className="absolute top-0 left-0.5 bottom-0 w-1.5 bg-gradient-to-b from-white/5 to-transparent rounded-full" />
          </div>

          {/* Steam above mug when has coffee */}
          {cups > 0 && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
              <div className="w-0.5 h-2 bg-muted-foreground/10 rounded-full animate-steam" />
              <div className="w-0.5 h-2.5 bg-muted-foreground/8 rounded-full animate-steam-2" />
              <div className="w-0.5 h-2 bg-muted-foreground/10 rounded-full animate-steam" style={{ animationDelay: "0.3s" }} />
            </div>
          )}

          {/* Handle */}
          <div className="absolute right-[-6px] top-[30%] w-1.5 h-5 border-2 border-accent/25 rounded-r-lg border-l-0" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mt-1">
        <button onClick={remove} disabled={cups === 0}
          className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all border text-xs",
            cups === 0 ? "text-muted-foreground/20 border-border/30 cursor-not-allowed" : "text-muted-foreground border-border hover:text-foreground hover:bg-muted")}>
          <Minus className="w-3 h-3" />
        </button>
        <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
          <div className="h-full bg-accent/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <button onClick={add} disabled={cups >= limit}
          className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all border text-xs",
            cups >= limit ? "text-muted-foreground/20 border-border/30 cursor-not-allowed" : "text-accent border-accent/30 hover:bg-accent/10")}>
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <p className="text-[8px] text-center text-muted-foreground/40 font-mono mt-0.5">
        {cups === 0 && "sem café ainda"}
        {cups === 1 && "primeiro café ☕"}
        {cups === 2 && "segundo, bora!"}
        {cups === 3 && "modo turbo 🚀"}
        {cups >= 4 && cups < limit && "calma lá..."}
        {cups === limit && "beba água! 💧"}
      </p>
    </div>
  );
};
