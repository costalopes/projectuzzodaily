import { useState } from "react";
import { cn } from "@/lib/utils";
import { Droplets, Plus, Minus, Settings2 } from "lucide-react";

export const WaterTracker = () => {
  const [ml, setMl] = useState(750);
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem("water-goal-ml");
    return saved ? parseFloat(saved) : 2;
  });
  const [showConfig, setShowConfig] = useState(false);
  const [customGoal, setCustomGoal] = useState("");

  const goalMl = goal * 1000;
  const add = () => setMl((c) => Math.min(c + 250, goalMl));
  const remove = () => setMl((c) => Math.max(c - 250, 0));
  const pct = Math.min((ml / goalMl) * 100, 100);
  const liters = (ml / 1000).toFixed(1);

  const setGoalAndSave = (g: number) => {
    if (g < 0.5 || g > 10) return;
    setGoal(g);
    localStorage.setItem("water-goal-ml", String(g));
    if (ml > g * 1000) setMl(g * 1000);
  };

  const handleCustomGoal = () => {
    const val = parseFloat(customGoal);
    if (!isNaN(val) && val >= 0.5 && val <= 10) {
      setGoalAndSave(val);
      setCustomGoal("");
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-3 flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Droplets className="w-3.5 h-3.5 text-primary" />
          água
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-primary font-bold">{liters}L/{goal}L</span>
          <button onClick={() => setShowConfig(!showConfig)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <Settings2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="mb-2 animate-fade-in">
          <p className="text-[8px] font-mono text-muted-foreground/50 mb-1">// meta diária (litros)</p>
          <div className="flex gap-1 items-center">
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="10"
              value={customGoal || goal}
              onChange={(e) => setCustomGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomGoal()}
              onBlur={handleCustomGoal}
              className="w-full bg-muted/40 border border-border rounded-lg px-2 py-1 text-[10px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder="ex: 2.5"
            />
          </div>
        </div>
      )}

      {/* Water glass visual */}
      <div className="flex items-center justify-center py-1">
        <div className="relative w-14 h-16 flex items-end justify-center">
          <div className="absolute inset-0 rounded-b-xl rounded-t-md border-2 border-primary/20 overflow-hidden bg-muted/10">
            <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out" style={{ height: `${pct}%` }}>
              <div className="absolute inset-0 bg-primary/25" />
              <svg className="absolute -top-2 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none" style={{ height: "8px" }}>
                <path className="animate-wave" d="M0 5 Q 12.5 0, 25 5 Q 37.5 10, 50 5 Q 62.5 0, 75 5 Q 87.5 10, 100 5 L 100 10 L 0 10 Z" fill="hsl(var(--primary) / 0.25)" />
                <path className="animate-wave-slow" d="M0 6 Q 15 2, 30 6 Q 45 10, 60 6 Q 75 2, 90 6 Q 97 9, 100 6 L 100 10 L 0 10 Z" fill="hsl(var(--primary) / 0.15)" />
              </svg>
              {pct > 20 && (
                <>
                  <div className="absolute bottom-1 left-2 w-1 h-1 rounded-full bg-primary/20 animate-bubble" />
                  <div className="absolute bottom-3 right-3 w-0.5 h-0.5 rounded-full bg-primary/15 animate-bubble-slow" />
                </>
              )}
            </div>
            <div className="absolute top-0 left-0.5 bottom-0 w-1.5 bg-gradient-to-b from-white/5 to-transparent rounded-full" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mt-1">
        <button onClick={remove} disabled={ml === 0}
          className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all border text-xs",
            ml === 0 ? "text-muted-foreground/20 border-border/30 cursor-not-allowed" : "text-muted-foreground border-border hover:text-foreground hover:bg-muted")}>
          <Minus className="w-3 h-3" />
        </button>
        <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
          <div className="h-full bg-primary/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <button onClick={add} disabled={ml >= goalMl}
          className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all border text-xs",
            ml >= goalMl ? "text-muted-foreground/20 border-border/30 cursor-not-allowed" : "text-primary border-primary/30 hover:bg-primary/10")}>
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <p className="text-[8px] text-center text-muted-foreground/40 mt-1 font-mono">
        {ml === 0 && "beba água!"}
        {ml > 0 && ml < goalMl / 2 && "+250ml ✦"}
        {ml >= goalMl / 2 && ml < goalMl && "quase lá! 💧"}
        {ml >= goalMl && "meta batida! 🎉"}
      </p>
    </div>
  );
};
