import { useState } from "react";
import { Coffee, Settings2, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CoffeeTrackerProps {
  onCoffeeEvent?: (type: "coffee_add" | "coffee_excess") => void;
}

export const CoffeeTracker = ({ onCoffeeEvent }: CoffeeTrackerProps) => {
  const [cups, setCups] = useState(1);
  const [limit, setLimit] = useState(() => {
    const saved = localStorage.getItem("coffee-limit");
    return saved ? parseInt(saved) : 5;
  });
  const [showConfig, setShowConfig] = useState(false);
  const [customLimit, setCustomLimit] = useState("");
  const [pulse, setPulse] = useState(false);

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

  const add = () => {
    const newCups = Math.min(cups + 1, limit);
    setCups(newCups);
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
    if (newCups >= limit) onCoffeeEvent?.("coffee_excess");
    else onCoffeeEvent?.("coffee_add");
  };
  const remove = () => {
    setCups((c) => Math.max(c - 1, 0));
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
  };
  const pct = Math.min((cups / limit) * 100, 100);

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-3 flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Coffee className="w-3.5 h-3.5 text-accent" />
          cafés
        </h3>
        <div className="flex items-center gap-1.5">
          <motion.span
            key={cups}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="text-[10px] font-mono text-accent font-bold"
          >
            {cups}/{limit}
          </motion.span>
          <button onClick={() => setShowConfig(!showConfig)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <Settings2 className="w-3 h-3" />
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
            <p className="text-[8px] font-mono text-muted-foreground/50 mb-1">// limite diário</p>
            <input type="number" min="1" max="20"
              value={customLimit || limit}
              onChange={(e) => setCustomLimit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomLimit()}
              onBlur={handleCustomLimit}
              className="w-full bg-muted/40 border border-border rounded-lg px-2 py-1 text-[10px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30"
              placeholder="ex: 5" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="flex items-center justify-center py-1"
        animate={pulse ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <svg width="56" height="64" viewBox="0 0 28 32" className="image-rendering-pixelated">
          <rect x="2" y="27" width="22" height="1" fill="hsl(var(--accent) / 0.2)" />
          <rect x="3" y="28" width="20" height="1" fill="hsl(var(--accent) / 0.15)" />
          <rect x="4" y="29" width="18" height="1" fill="hsl(var(--accent) / 0.1)" />
          <rect x="4" y="10" width="16" height="1" fill="hsl(var(--accent) / 0.25)" />
          <rect x="3" y="11" width="18" height="16" fill="hsl(var(--accent) / 0.1)" />
          <rect x="3" y="11" width="1" height="16" fill="hsl(var(--accent) / 0.2)" />
          <rect x="20" y="11" width="1" height="16" fill="hsl(var(--accent) / 0.2)" />
          <rect x="4" y="27" width="16" height="1" fill="hsl(var(--accent) / 0.25)" />
          <rect x="21" y="13" width="2" height="1" fill="hsl(var(--accent) / 0.25)" />
          <rect x="23" y="14" width="1" height="6" fill="hsl(var(--accent) / 0.25)" />
          <rect x="22" y="20" width="1" height="1" fill="hsl(var(--accent) / 0.25)" />
          <rect x="21" y="21" width="1" height="1" fill="hsl(var(--accent) / 0.25)" />
          <rect x="4" y={11 + Math.round(16 * (1 - pct / 100))} width="16" height={Math.round(16 * pct / 100)} fill="hsl(var(--accent) / 0.3)" />
          {pct > 10 && pct < 100 && (
            <rect x="4" y={10 + Math.round(16 * (1 - pct / 100))} width="16" height="1" fill="hsl(var(--accent) / 0.15)" />
          )}
          <rect x="5" y="12" width="1" height="12" fill="white" opacity="0.05" />
          <rect x="6" y="12" width="1" height="8" fill="white" opacity="0.03" />
          {cups > 0 && (
            <>
              <rect x="8" y="6" width="1" height="3" fill="hsl(var(--muted-foreground) / 0.08)" className="animate-steam" />
              <rect x="12" y="5" width="1" height="4" fill="hsl(var(--muted-foreground) / 0.06)" className="animate-steam-2" />
              <rect x="16" y="6" width="1" height="3" fill="hsl(var(--muted-foreground) / 0.08)" className="animate-steam" style={{ animationDelay: "0.4s" }} />
            </>
          )}
        </svg>
      </motion.div>

      <div className="flex items-center gap-2 mt-1">
        <motion.button onClick={remove} disabled={cups === 0}
          whileTap={{ scale: 0.85 }}
          className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all border text-xs",
            cups === 0 ? "text-muted-foreground/20 border-border/30 cursor-not-allowed" : "text-muted-foreground border-border hover:text-foreground hover:bg-muted")}>
          <Minus className="w-3 h-3" />
        </motion.button>
        <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent/60 rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <motion.button onClick={add} disabled={cups >= limit}
          whileTap={{ scale: 0.85 }}
          className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all border text-xs",
            cups >= limit ? "text-muted-foreground/20 border-border/30 cursor-not-allowed" : "text-accent border-accent/30 hover:bg-accent/10")}>
          <Plus className="w-3 h-3" />
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={cups === 0 ? "zero" : cups >= limit ? "max" : `cups-${cups}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-[8px] text-center text-muted-foreground/40 font-mono mt-0.5"
        >
          {cups === 0 && "sem café ainda"}
          {cups === 1 && "primeiro café ☕"}
          {cups === 2 && "segundo, bora!"}
          {cups === 3 && "modo turbo 🚀"}
          {cups >= 4 && cups < limit && "calma lá..."}
          {cups === limit && "beba água! 💧"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
