import { useState } from "react";
import { cn } from "@/lib/utils";
import { Droplets, Plus, Minus } from "lucide-react";

const GOAL = 8; // 8 copos

export const WaterTracker = () => {
  const [cups, setCups] = useState(3);

  const add = () => setCups((c) => Math.min(c + 1, GOAL));
  const remove = () => setCups((c) => Math.max(c - 1, 0));
  const pct = (cups / GOAL) * 100;

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-primary" />
          hidratação
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground/60">
          {cups}/{GOAL} copos
        </span>
      </div>

      {/* Water bottle visual */}
      <div className="flex justify-center mb-4">
        <div className="relative w-16 h-28">
          {/* Bottle outline */}
          <div className="absolute inset-x-2 top-0 h-4 border-2 border-border rounded-t-lg bg-muted/20" />
          <div className="absolute inset-0 top-4 border-2 border-border rounded-b-2xl overflow-hidden bg-muted/10">
            {/* Water fill */}
            <div
              className="absolute bottom-0 inset-x-0 transition-all duration-700 ease-out rounded-b-xl"
              style={{
                height: `${pct}%`,
                background: `hsl(var(--primary) / ${0.3 + pct * 0.005})`,
              }}
            >
              {/* Wave effect */}
              {cups > 0 && (
                <div className="absolute -top-1 inset-x-0 h-2 overflow-hidden">
                  <div
                    className="w-[200%] h-full animate-shimmer"
                    style={{
                      background: `repeating-linear-gradient(90deg, transparent, hsl(var(--primary) / 0.15) 25%, transparent 50%)`,
                      backgroundSize: "40px 100%",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Level marks */}
            {[25, 50, 75].map((level) => (
              <div
                key={level}
                className="absolute inset-x-1 h-px bg-border/30"
                style={{ bottom: `${level}%` }}
              />
            ))}
          </div>

          {/* Percentage label */}
          <div className="absolute inset-0 top-4 flex items-center justify-center">
            <span className="text-[11px] font-mono font-bold text-foreground/80">
              {Math.round(pct)}%
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={remove}
          disabled={cups === 0}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all border",
            cups === 0
              ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
              : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="flex gap-1">
          {Array.from({ length: GOAL }, (_, i) => (
            <button
              key={i}
              onClick={() => setCups(i + 1)}
              className={cn(
                "w-2.5 h-5 rounded-sm transition-all",
                i < cups ? "bg-primary/70" : "bg-muted/50"
              )}
            />
          ))}
        </div>

        <button
          onClick={add}
          disabled={cups === GOAL}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all border",
            cups === GOAL
              ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
              : "border-border hover:bg-primary/20 text-muted-foreground hover:text-primary"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Motivational */}
      <p className="text-[10px] text-center text-muted-foreground/40 mt-3 font-mono">
        {cups === 0 && "beba água! seu corpo agradece"}
        {cups > 0 && cups < 4 && "bom começo, continue!"}
        {cups >= 4 && cups < GOAL && "mais da metade! quase lá"}
        {cups === GOAL && "meta alcançada! ✦"}
      </p>
    </div>
  );
};
