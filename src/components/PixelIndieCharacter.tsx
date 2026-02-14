import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import charImg from "@/assets/indie-char-lofi.png";

type CharMood = "idle" | "happy" | "waving" | "sleeping" | "excited" | "thinking" | "listening" | "shy";

interface PixelIndieCharacterProps {
  onLogin?: boolean;
  className?: string;
}

export const PixelIndieCharacter = ({ onLogin, className }: PixelIndieCharacterProps) => {
  const [mood, setMood] = useState<CharMood>("idle");
  const [message, setMessage] = useState("");
  const [hearts, setHearts] = useState<number[]>([]);
  const charRef = useRef<HTMLDivElement>(null);
  const lastClickTime = useRef<number>(0);

  const messages: Record<string, string[]> = {
    idle: ["...", "*mexe no cabelo*", "hmm", "yo ✌️", "oi!", "*olha pro lado*"],
    happy: ["hehe!", "valeu! 💙", "massa!", "*sorri*", "uwu"],
    waving: ["oi! 👋", "bem-vindo!", "bora codar!"],
    sleeping: ["zzz...", "*boceja*", "5 min..."],
    excited: ["LETS GO!! 🔥", "AEEEE!", "logou! 🎉", "SIIIM!"],
    thinking: ["🤔 hmm", "pensando...", "será?..."],
    listening: ["♪ vibe", "boa playlist!", "♫♪"],
    shy: ["ah...", "*fica vermelho*", "👉👈", "para heh..."],
  };

  const showMsg = useCallback((msg: string, dur = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), dur);
  }, []);

  const pickMsg = useCallback((cat: string) => {
    const m = messages[cat] || messages.idle;
    return m[Math.floor(Math.random() * m.length)];
  }, []);

  // Idle behavior
  useEffect(() => {
    if (mood !== "idle") return;
    const iv = setInterval(() => {
      const r = Math.random();
      if (r < 0.12) { setMood("thinking"); showMsg(pickMsg("thinking")); setTimeout(() => setMood("idle"), 3500); }
      else if (r < 0.22) { setMood("listening"); showMsg(pickMsg("listening")); setTimeout(() => setMood("idle"), 4000); }
      else if (r < 0.32) { showMsg(pickMsg("idle"), 2500); }
    }, 5000 + Math.random() * 4000);
    return () => clearInterval(iv);
  }, [mood, pickMsg, showMsg]);

  // Sleep
  useEffect(() => {
    if (mood === "idle") { const t = setTimeout(() => { setMood("sleeping"); showMsg(pickMsg("sleeping")); }, 35000); return () => clearTimeout(t); }
  }, [mood, pickMsg, showMsg]);
  useEffect(() => {
    if (mood !== "sleeping") return;
    const t = setTimeout(() => { setMood("idle"); showMsg("*acorda* hm?"); }, 10000);
    return () => clearTimeout(t);
  }, [mood, showMsg]);

  // Login reaction
  useEffect(() => {
    if (onLogin) { setMood("excited"); showMsg(pickMsg("excited")); setTimeout(() => setMood("idle"), 4000); }
  }, [onLogin, pickMsg, showMsg]);

  // Click
  const handleClick = useCallback(() => {
    const now = Date.now();
    const dbl = now - lastClickTime.current < 350;
    lastClickTime.current = now;
    if (dbl) { setMood("shy"); showMsg(pickMsg("shy")); setTimeout(() => setMood("idle"), 3000); return; }
    setTimeout(() => {
      if (Date.now() - lastClickTime.current < 350) return;
      setMood("happy"); showMsg(pickMsg("happy"));
      const hid = Date.now();
      setHearts(h => [...h, hid]);
      setTimeout(() => setHearts(h => h.filter(id => id !== hid)), 2000);
      setTimeout(() => setMood("idle"), 3000);
    }, 360);
  }, [pickMsg, showMsg]);

  const isSleeping = mood === "sleeping";
  const isThinking = mood === "thinking";

  return (
    <div ref={charRef} className={cn("relative select-none", className)}>
      {/* Speech bubble */}
      {message && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 backdrop-blur-xl bg-card/95 border border-border rounded-xl px-3 py-2 shadow-lg animate-fade-in whitespace-nowrap z-10">
          <p className="text-[11px] font-mono text-foreground">{message}</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card/95 border-r border-b border-border rotate-45" />
        </div>
      )}

      {/* Hearts */}
      {hearts.map((id, i) => (
        <span key={id} className="absolute text-sm pointer-events-none z-20"
          style={{ left: `${40 + (i % 3) * 25}px`, top: "0px", animation: "indie-float 2s ease-out forwards" }}>
          {["💙", "✨", "💙"][i % 3]}
        </span>
      ))}

      {/* Sleeping Zs */}
      {isSleeping && (
        <div className="absolute -top-6 right-2 flex gap-1.5">
          {[0, 0.4, 0.8].map((d, i) => (
            <span key={i} className="animate-float font-mono text-primary/40 font-bold"
              style={{ animationDelay: `${d}s`, fontSize: `${10 + i * 4}px` }}>z</span>
          ))}
        </div>
      )}

      {/* Thinking dots */}
      {isThinking && (
        <div className="absolute -top-4 right-4 flex gap-1.5">
          {[0, 0.2, 0.4].map((d, i) => (
            <span key={i} className="animate-float w-2 h-2 rounded-full bg-primary/30" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      )}

      {/* Music notes */}
      {mood === "listening" && (
        <div className="absolute -top-4 left-4">
          <span className="animate-float text-primary/50 text-sm" style={{ animationDelay: "0s" }}>♪</span>
          <span className="animate-float text-accent/40 text-sm ml-4" style={{ animationDelay: "0.5s" }}>♫</span>
        </div>
      )}

      {/* Sparkles when excited */}
      {mood === "excited" && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {[
            { x: "10%", y: "10%", d: "0s" }, { x: "85%", y: "15%", d: "0.3s" },
            { x: "5%", y: "60%", d: "0.5s" }, { x: "90%", y: "50%", d: "0.2s" },
          ].map((s, i) => (
            <span key={i} className="absolute animate-float text-xs"
              style={{ left: s.x, top: s.y, animationDelay: s.d }}>✨</span>
          ))}
        </div>
      )}

      <div className={cn(
        "transition-transform duration-500",
        !isSleeping && "animate-breathe",
        mood === "excited" && "animate-[bounce_0.5s_ease-in-out_infinite]",
        mood === "listening" && "animate-[bounce_1.2s_ease-in-out_infinite]",
      )}>
        <img
          src={charImg}
          alt="Personagem indie"
          className={cn(
            "w-48 h-48 lg:w-56 lg:h-56 rounded-2xl cursor-pointer transition-all duration-300",
            "drop-shadow-[0_0_25px_hsl(var(--primary)/0.3)]",
            "hover:drop-shadow-[0_0_35px_hsl(var(--primary)/0.5)] hover:scale-105 active:scale-95",
            isSleeping && "brightness-75 saturate-75",
            mood === "excited" && "drop-shadow-[0_0_40px_hsl(var(--primary)/0.6)]",
            mood === "shy" && "brightness-110",
          )}
          style={{ imageRendering: "auto" }}
          onClick={handleClick}
          draggable={false}
        />
      </div>

      <style>{`
        @keyframes indie-float {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-45px) scale(1.3); }
        }
      `}</style>
    </div>
  );
};
