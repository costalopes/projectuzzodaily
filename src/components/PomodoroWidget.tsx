import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerMode = "focus" | "short" | "long";

const DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const MODE_LABELS: Record<TimerMode, string> = {
  focus: "Foco",
  short: "Pausa",
  long: "Descanso",
};

const MODE_COLORS: Record<TimerMode, string> = {
  focus: "bg-primary",
  short: "bg-success",
  long: "bg-accent",
};

export const PomodoroWidget = () => {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          if (mode === "focus") {
            setSessions((s) => s + 1);
            const nextMode = (sessions + 1) % 4 === 0 ? "long" : "short";
            setMode(nextMode);
            return DURATIONS[nextMode];
          } else {
            setMode("focus");
            return DURATIONS.focus;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode, sessions]);

  const switchMode = (m: TimerMode) => {
    setMode(m);
    setTimeLeft(DURATIONS[m]);
    setIsRunning(false);
  };

  const skip = () => {
    if (mode === "focus") {
      setSessions((s) => s + 1);
      switchMode("short");
    } else {
      switchMode("focus");
    }
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const progress = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;

  // Circle progress
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          🍅 Pomodoro
        </h3>
        <div className="flex gap-1">
          {(Object.keys(MODE_LABELS) as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "px-2 py-1 rounded-lg text-[9px] font-semibold transition-all",
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Circular timer */}
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="60" cy="60" r={radius} fill="none"
              stroke={`hsl(var(--${mode === "focus" ? "primary" : mode === "short" ? "success" : "accent"}))`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold tracking-wider text-foreground">{mins}:{secs}</span>
            <span className="text-[9px] text-muted-foreground font-medium mt-0.5">{MODE_LABELS[mode]}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeLeft(DURATIONS[mode])}
            className="bg-muted text-muted-foreground rounded-xl w-9 h-9 flex items-center justify-center hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={cn("text-primary-foreground rounded-xl w-12 h-12 flex items-center justify-center hover:opacity-90 transition-all shadow-lg", MODE_COLORS[mode])}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            onClick={skip}
            className="bg-muted text-muted-foreground rounded-xl w-9 h-9 flex items-center justify-center hover:bg-accent transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sessions */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                i < (sessions % 4) ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">{sessions} sessões</span>
        </div>
      </div>
    </div>
  );
};
