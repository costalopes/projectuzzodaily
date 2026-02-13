import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
  const prevRunning = useRef(false);

  // Notify Discord via Edge Function
  const notifyDiscord = useCallback(async (event: "start" | "end", notifyMode: TimerMode, sessionCount: number) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/discord-notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: "pomodoro",
          event,
          mode: notifyMode,
          sessions: sessionCount,
          userName: "App User",
        }),
      });
      if (!res.ok) {
        console.error("Discord notify failed:", await res.text());
      }
    } catch (err) {
      console.error("Discord notify error:", err);
    }
  }, []);

  useEffect(() => {
    if (isRunning && !prevRunning.current) {
      onTimerStart?.();
      notifyDiscord("start", mode, sessions);
    }
    prevRunning.current = isRunning;
  }, [isRunning, onTimerStart, mode, sessions, notifyDiscord]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          playAlarmChime();
          onTimerEnd?.(mode);
          const newSessions = mode === "focus" ? sessions + 1 : sessions;
          notifyDiscord("end", mode, newSessions);

          if (mode === "focus") {
            setSessions((s) => s + 1);
            const nextMode: TimerMode = (sessions + 1) % 4 === 0 ? "long" : "short";
            // Auto-start next mode after a brief delay
            setTimeout(() => {
              setMode(nextMode);
              setTimeLeft(DURATIONS[nextMode]);
              setIsRunning(true);
            }, 1500);
          } else {
            // After break, auto-start focus
            setTimeout(() => {
              setMode("focus");
              setTimeLeft(DURATIONS.focus);
              setIsRunning(true);
            }, 1500);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode, sessions, onTimerEnd, notifyDiscord]);

  const switchMode = useCallback((m: TimerMode) => {
    setMode(m);
    setTimeLeft(DURATIONS[m]);
    setIsRunning(false);
  }, []);

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
    <div className="space-y-5">
      {/* Header com título e mode switcher */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
          🍅 <span className="uppercase font-mono text-xs tracking-widest">Pomodoro</span>
        </h3>
        <div className="flex items-center bg-muted/30 rounded-full p-0.5">
          {(Object.keys(MODE_LABELS) as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-semibold transition-all",
                mode === m
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-5">
        {/* Circular timer — larger */}
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted)/0.3)" strokeWidth="5" />
            <circle
              cx="60" cy="60" r={radius} fill="none"
              stroke={`hsl(var(--${mode === "focus" ? "primary" : mode === "short" ? "success" : "accent"}))`}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-1000"
              style={{ filter: `drop-shadow(0 0 6px hsl(var(--${mode === "focus" ? "primary" : mode === "short" ? "success" : "accent"}) / 0.4))` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold tracking-widest text-foreground">{mins}:{secs}</span>
            <span className="text-[10px] text-muted-foreground/50 font-mono mt-1">{MODE_LABELS[mode]}</span>
          </div>
        </div>


        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTimeLeft(DURATIONS[mode])}
            className="bg-muted/30 text-muted-foreground rounded-full w-10 h-10 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center hover:opacity-90 transition-all shadow-lg",
              MODE_COLORS[mode],
              isRunning && "shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
            )}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            onClick={skip}
            className="bg-muted/30 text-muted-foreground rounded-full w-10 h-10 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i < (sessions % 4) ? "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.4)]" : "bg-muted/40"
              )}
            />
          ))}
          <span className="text-[10px] text-muted-foreground/50 font-mono ml-1">{sessions} sessões</span>
        </div>
      </div>
    </div>
  );
};
