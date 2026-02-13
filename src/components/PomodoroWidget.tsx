import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BOT_API_URL = "https://steadfast-integrity-production-4b30.up.railway.app/api";
const API_SECRET = "meu-segredo-123";

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
  const [botConnected, setBotConnected] = useState(false);
  const prevRunning = useRef(false);

  // Notify Discord bot when timer ends
  const notifyBot = useCallback(async (completedMode: TimerMode, sessionCount: number) => {
    try {
      const res = await fetch(`${BOT_API_URL}/pomodoro-end`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-secret": API_SECRET },
        body: JSON.stringify({ mode: completedMode, sessions: sessionCount, userName: "App User" }),
      });
      if (res.ok) {
        setBotConnected(true);
        toast.success("🍅 Notificação enviada ao Discord!");
      }
    } catch {
      setBotConnected(false);
    }
  }, []);

  // Poll pending actions from Discord
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${BOT_API_URL}/pending-actions`, {
          headers: { "x-api-secret": API_SECRET },
        });
        if (!res.ok) return;
        const data = await res.json();
        setBotConnected(true);
        data.actions?.forEach((action: { type: string; mode: TimerMode; user: string }) => {
          if (action.type === "start_pomodoro") {
            setMode(action.mode);
            setTimeLeft(DURATIONS[action.mode]);
            setIsRunning(true);
            setShowTransition(null);
            toast.info(`🎮 ${action.user} iniciou ${MODE_LABELS[action.mode]} pelo Discord!`);
          }
        });
      } catch {
        setBotConnected(false);
      }
    };
    const interval = setInterval(poll, 5000);
    poll(); // initial check
    return () => clearInterval(interval);
  }, []);

  // Check bot health on mount
  useEffect(() => {
    fetch(`${BOT_API_URL}/health`)
      .then(r => { if (r.ok) setBotConnected(true); })
      .catch(() => setBotConnected(false));
  }, []);

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
          notifyBot(mode, mode === "focus" ? sessions + 1 : sessions);

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
    <div className="space-y-5">
      {/* Header com título e mode switcher */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
          🍅 <span className="uppercase font-mono text-xs tracking-widest">Pomodoro</span>
          {botConnected ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-muted-foreground/40" />
          )}
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

        {/* Transition dialog */}
        {showTransition && (
          <div className="animate-fade-in bg-muted/20 border border-border/30 rounded-xl p-3 w-full text-center space-y-2">
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
