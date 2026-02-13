import { useState, useEffect, useCallback, useRef } from "react";
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

interface PomodoroProps {
  onTimerEnd?: (completedMode: TimerMode) => void;
  onTimerStart?: () => void;
}

// Soft chime using Web Audio API
const playAlarmChime = () => {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5 chord
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 1.5);
    });
    setTimeout(() => ctx.close(), 3000);
  } catch {}
};

export const PomodoroWidget = ({ onTimerEnd, onTimerStart }: PomodoroProps) => {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showTransition, setShowTransition] = useState<{ from: TimerMode; suggested: TimerMode } | null>(null);
  const prevRunning = useRef(false);

  useEffect(() => {
    if (isRunning && !prevRunning.current) {
      onTimerStart?.();
    }
    prevRunning.current = isRunning;
  }, [isRunning, onTimerStart]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          playAlarmChime();
          onTimerEnd?.(mode);

          if (mode === "focus") {
            setSessions((s) => s + 1);
            const nextMode: TimerMode = (sessions + 1) % 4 === 0 ? "long" : "short";
            setShowTransition({ from: "focus", suggested: nextMode });
            return 0;
          } else {
            setShowTransition({ from: mode, suggested: "focus" });
            return 0;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode, sessions, onTimerEnd]);

  const switchMode = useCallback((m: TimerMode) => {
    setMode(m);
    setTimeLeft(DURATIONS[m]);
    setIsRunning(false);
    setShowTransition(null);
  }, []);

  const acceptTransition = (m: TimerMode) => {
    switchMode(m);
    setIsRunning(true);
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

        {/* Transition dialog */}
        {showTransition && (
          <div className="animate-fade-in bg-muted/30 border border-border/50 rounded-xl p-3 w-full text-center space-y-2">
            <p className="text-[10px] font-mono text-foreground">
              {showTransition.from === "focus" ? "🍅 Foco concluído!" : "⏰ Intervalo acabou!"}
            </p>
            <p className="text-[9px] font-mono text-muted-foreground">
              {showTransition.suggested === "focus" ? "Iniciar foco?" : showTransition.suggested === "long" ? "Iniciar descanso longo?" : "Iniciar pausa curta?"}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => acceptTransition(showTransition.suggested)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-mono bg-primary text-primary-foreground hover:opacity-90 transition-all"
              >
                {MODE_LABELS[showTransition.suggested]} →
              </button>
              {showTransition.suggested !== "focus" && (
                <button
                  onClick={() => acceptTransition("focus")}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-border text-muted-foreground hover:bg-muted/40 transition-all"
                >
                  Mais foco
                </button>
              )}
              <button
                onClick={() => setShowTransition(null)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-all"
              >
                fechar
              </button>
            </div>
          </div>
        )}

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
