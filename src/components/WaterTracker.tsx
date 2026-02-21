import { useState } from "react";
import { cn } from "@/lib/utils";
import { Droplets, Plus, Minus, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCloudSetting } from "@/hooks/useCloudSetting";

interface WaterTrackerProps {
  onWaterEvent?: (type: "water_add" | "water_low" | "water_full") => void;
}

export const WaterTracker = ({ onWaterEvent }: WaterTrackerProps) => {
  const [ml, setMl] = useState(750);
  const [goal, setGoal] = useCloudSetting<number>("water_goal", 2, "water-goal-ml");
  const [showConfig, setShowConfig] = useState(false);
  const [customGoal, setCustomGoal] = useState("");
  const [pulse, setPulse] = useState(false);

  const goalMl = goal * 1000;
  const add = () => {
    const newMl = Math.min(ml + 250, goalMl);
    setMl(newMl);
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
    if (newMl >= goalMl) onWaterEvent?.("water_full");
    else onWaterEvent?.("water_add");
  };
  const remove = () => {
    const newMl = Math.max(ml - 250, 0);
    setMl(newMl);
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
    if (newMl === 0) onWaterEvent?.("water_low");
  };
  const pct = Math.min((ml / goalMl) * 100, 100);
  const liters = (ml / 1000).toFixed(1);

  const setGoalAndSave = (g: number) => {
    if (g < 0.5 || g > 10) return;
    setGoal(g);
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
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-primary" />
          água
        </h3>
        <div className="flex items-center gap-2">
          <motion.span
            key={liters}
            initial={{ scale: 1.3, color: "hsl(var(--primary))" }}
            animate={{ scale: 1, color: "hsl(var(--primary))" }}
            className="text-xs font-mono text-primary font-bold"
          >
            {liters}L/{goal}L
          </motion.span>
          <button onClick={() => setShowConfig(!showConfig)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-2"
          >
            <p className="text-[10px] font-mono text-muted-foreground/50 mb-1.5">// meta diária (litros)</p>
            <div className="flex gap-1 items-center">
              <input type="number" step="0.1" min="0.5" max="10"
                value={customGoal || goal}
                onChange={(e) => setCustomGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomGoal()}
                onBlur={handleCustomGoal}
                className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="ex: 2.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Water jug pixel art */}
      <motion.div
        className="flex items-center justify-center py-1"
        animate={pulse ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <svg width="64" height="72" viewBox="0 0 28 32" className="image-rendering-pixelated">
          <rect x="22" y="8" width="2" height="1" fill="hsl(var(--primary) / 0.3)" />
          <rect x="24" y="9" width="1" height="6" fill="hsl(var(--primary) / 0.3)" />
          <rect x="23" y="15" width="1" height="1" fill="hsl(var(--primary) / 0.3)" />
          <rect x="22" y="16" width="1" height="1" fill="hsl(var(--primary) / 0.3)" />
          <rect x="3" y="4" width="2" height="1" fill="hsl(var(--primary) / 0.25)" />
          <rect x="2" y="5" width="2" height="1" fill="hsl(var(--primary) / 0.25)" />
          <rect x="4" y="3" width="18" height="1" fill="hsl(var(--primary) / 0.2)" />
          <rect x="3" y="4" width="1" height="1" fill="hsl(var(--primary) / 0.2)" />
          <rect x="22" y="4" width="1" height="1" fill="hsl(var(--primary) / 0.2)" />
          <rect x="3" y="5" width="19" height="1" fill="hsl(var(--primary) / 0.15)" />
          <rect x="3" y="6" width="19" height="22" fill="hsl(var(--primary) / 0.08)" />
          <rect x="4" y="28" width="17" height="1" fill="hsl(var(--primary) / 0.15)" />
          <rect x="3" y="6" width="1" height="22" fill="hsl(var(--primary) / 0.2)" />
          <rect x="21" y="6" width="1" height="22" fill="hsl(var(--primary) / 0.2)" />
          <rect x="4" y="28" width="17" height="1" fill="hsl(var(--primary) / 0.25)" />
          <rect x="4" y={6 + Math.round(22 * (1 - pct / 100))} width="17" height={Math.round(22 * pct / 100)} fill="hsl(var(--primary) / 0.3)" />
          {pct > 5 && pct < 100 && (
            <>
              <rect x="5" y={5 + Math.round(22 * (1 - pct / 100))} width="3" height="1" fill="hsl(var(--primary) / 0.2)" />
              <rect x="11" y={5 + Math.round(22 * (1 - pct / 100))} width="4" height="1" fill="hsl(var(--primary) / 0.2)" />
              <rect x="18" y={5 + Math.round(22 * (1 - pct / 100))} width="2" height="1" fill="hsl(var(--primary) / 0.2)" />
            </>
          )}
          <rect x="5" y="7" width="1" height="18" fill="white" opacity="0.06" />
          <rect x="6" y="7" width="1" height="14" fill="white" opacity="0.03" />
          {pct > 20 && (
            <>
              <rect x="8" y={10 + Math.round(16 * (1 - pct / 100))} width="1" height="1" fill="hsl(var(--primary) / 0.15)" className="animate-bubble" />
              <rect x="16" y={14 + Math.round(12 * (1 - pct / 100))} width="1" height="1" fill="hsl(var(--primary) / 0.1)" className="animate-bubble-slow" />
            </>
          )}
        </svg>
      </motion.div>

      <div className="flex items-center gap-2.5 mt-2">
        <motion.button onClick={remove} disabled={ml === 0}
          whileTap={{ scale: 0.85 }}
          className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all border text-sm",
            ml === 0 ? "text-muted-foreground/20 border-border/30 cursor-not-allowed" : "text-muted-foreground border-border hover:text-foreground hover:bg-muted")}>
          <Minus className="w-4 h-4" />
        </motion.button>
        <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/60 rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <motion.button onClick={add} disabled={ml >= goalMl}
          whileTap={{ scale: 0.85 }}
          className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all border text-sm",
            ml >= goalMl ? "text-muted-foreground/20 border-border/30 cursor-not-allowed" : "text-primary border-primary/30 hover:bg-primary/10")}>
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={ml === 0 ? "empty" : ml >= goalMl ? "full" : ml >= goalMl / 2 ? "half" : "low"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-[10px] text-center text-muted-foreground/40 mt-1.5 font-mono"
        >
          {ml === 0 && "beba água!"}
          {ml > 0 && ml < goalMl / 2 && "+250ml ✦"}
          {ml >= goalMl / 2 && ml < goalMl && "quase lá! 💧"}
          {ml >= goalMl && "meta batida! 🎉"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
