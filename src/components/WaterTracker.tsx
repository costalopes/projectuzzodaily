import { useState } from "react";
import { cn } from "@/lib/utils";
import { Droplets, Plus, Minus, Settings2 } from "lucide-react";

const GOALS = [4, 6, 8, 10, 12];

export const WaterTracker = () => {
  const [cups, setCups] = useState(3);
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem("water-goal");
    return saved ? parseInt(saved) : 8;
  });
  const [showConfig, setShowConfig] = useState(false);

  const add = () => setCups((c) => Math.min(c + 1, goal));
  const remove = () => setCups((c) => Math.max(c - 1, 0));
  const pct = Math.min((cups / goal) * 100, 100);

  const setGoalAndSave = (g: number) => {
    setGoal(g);
    localStorage.setItem("water-goal", String(g));
    if (cups > g) setCups(g);
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-primary" />
          água
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-primary font-bold">
            {cups}/{goal}
          </span>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="mb-3 animate-fade-in">
          <p className="text-[9px] font-mono text-muted-foreground/50 mb-1.5">// meta diária (copos)</p>
          <div className="flex gap-1">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setGoalAndSave(g)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-mono transition-all border",
                  goal === g
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : "border-border/50 text-muted-foreground/50 hover:bg-muted/40"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Water glass visual */}
      <div className="flex-1 flex items-center justify-center py-2">
        <div className="relative w-24 h-32 flex items-end justify-center">
          {/* Glass shape */}
          <div className="absolute inset-0 rounded-b-2xl rounded-t-lg border-2 border-primary/20 overflow-hidden bg-muted/10">
            {/* Water fill */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
              style={{ height: `${pct}%` }}
            >
              {/* Water body */}
              <div className="absolute inset-0 bg-primary/25" />

              {/* Wave animation */}
              <svg
                className="absolute -top-2 left-0 w-full"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                style={{ height: "12px" }}
              >
                <path
                  className="animate-wave"
                  d="M0 5 Q 12.5 0, 25 5 Q 37.5 10, 50 5 Q 62.5 0, 75 5 Q 87.5 10, 100 5 L 100 10 L 0 10 Z"
                  fill="hsl(var(--primary) / 0.25)"
                />
                <path
                  className="animate-wave-slow"
                  d="M0 6 Q 15 2, 30 6 Q 45 10, 60 6 Q 75 2, 90 6 Q 97 9, 100 6 L 100 10 L 0 10 Z"
                  fill="hsl(var(--primary) / 0.15)"
                />
              </svg>

              {/* Bubbles */}
              {pct > 20 && (
                <>
                  <div className="absolute bottom-2 left-3 w-1.5 h-1.5 rounded-full bg-primary/20 animate-bubble" />
                  <div className="absolute bottom-4 right-4 w-1 h-1 rounded-full bg-primary/15 animate-bubble-slow" />
                  <div className="absolute bottom-6 left-6 w-1 h-1 rounded-full bg-primary/10 animate-bubble-mid" />
                </>
              )}

              {/* Shimmer highlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
            </div>

            {/* Glass reflection */}
            <div className="absolute top-0 left-1 bottom-0 w-2 bg-gradient-to-b from-white/5 to-transparent rounded-full" />
          </div>

          {/* Droplet icon on glass */}
          {pct === 100 && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-primary animate-float">
              <Droplets className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={remove}
          disabled={cups === 0}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all border",
            cups === 0
              ? "text-muted-foreground/20 border-border/30 cursor-not-allowed"
              : "text-muted-foreground border-border hover:text-foreground hover:bg-muted hover:border-muted-foreground/30"
          )}
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/60 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <button
          onClick={add}
          disabled={cups === goal}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all border",
            cups === goal
              ? "text-muted-foreground/20 border-border/30 cursor-not-allowed"
              : "text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50"
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[10px] text-center text-muted-foreground/40 mt-2 font-mono">
        {cups === 0 && "beba água!"}
        {cups > 0 && cups < Math.ceil(goal / 2) && "bom começo ✦"}
        {cups >= Math.ceil(goal / 2) && cups < goal && "quase lá! 💧"}
        {cups === goal && "meta batida! 🎉"}
      </p>
    </div>
  );
};
