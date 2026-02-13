import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerMode = "focus" | "break";

export const PomodoroWidget = () => {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const durations = { focus: 25 * 60, break: 5 * 60 };

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          if (mode === "focus") {
            setSessions((s) => s + 1);
            setMode("break");
            return durations.break;
          } else {
            setMode("focus");
            return durations.focus;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  return (
    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          🍅 Pomodoro
        </h3>
        <div className="flex gap-1">
          {["focus", "break"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m as TimerMode); setTimeLeft(durations[m as TimerMode]); setIsRunning(false); }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all",
                mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {m === "focus" ? "Foco" : "Pausa"}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center space-y-3">
        <div className="font-mono text-4xl font-bold tracking-widest text-foreground">
          {mins}:{secs}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", mode === "focus" ? "bg-primary" : "bg-success")}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="bg-primary text-primary-foreground rounded-xl w-10 h-10 flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={reset}
            className="bg-muted text-muted-foreground rounded-xl w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {sessions} sessão{sessions !== 1 ? "s" : ""} hoje
        </p>
      </div>
    </div>
  );
};
