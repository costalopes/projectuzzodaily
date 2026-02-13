import { useState } from "react";
import { cn } from "@/lib/utils";
import { Droplets, Plus, Minus } from "lucide-react";

const GOAL = 8;

export const WaterTracker = () => {
  const [cups, setCups] = useState(3);

  const add = () => setCups((c) => Math.min(c + 1, GOAL));
  const remove = () => setCups((c) => Math.max(c - 1, 0));
  const pct = (cups / GOAL) * 100;

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Droplets className="w-3 h-3 text-primary" />
          água
        </h3>
        <span className="text-[10px] font-mono text-primary font-bold">
          {cups}/{GOAL}
        </span>
      </div>

      {/* Simple bar + buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={remove}
          disabled={cups === 0}
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center transition-all text-xs",
            cups === 0
              ? "text-muted-foreground/20 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Minus className="w-3 h-3" />
        </button>

        <div className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/60 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <button
          onClick={add}
          disabled={cups === GOAL}
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center transition-all text-xs",
            cups === GOAL
              ? "text-muted-foreground/20 cursor-not-allowed"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          )}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <p className="text-[9px] text-center text-muted-foreground/30 mt-1.5 font-mono">
        {cups === 0 && "beba água!"}
        {cups > 0 && cups < 4 && "bom começo"}
        {cups >= 4 && cups < GOAL && "quase lá!"}
        {cups === GOAL && "meta ✦"}
      </p>
    </div>
  );
};
