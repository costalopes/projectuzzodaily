import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type CharMood = "idle" | "happy" | "waving" | "sleeping" | "excited" | "thinking" | "listening" | "shy";

interface PixelIndieCharacterProps {
  onLogin?: boolean;
  className?: string;
}

export const PixelIndieCharacter = ({ onLogin, className }: PixelIndieCharacterProps) => {
  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState<CharMood>("idle");
  const [eyeOff, setEyeOff] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [hearts, setHearts] = useState<number[]>([]);
  const charRef = useRef<HTMLDivElement>(null);
  const lastClick = useRef(0);

  // Palette
  const P = {
    // Hair
    h1: "#0f1f60", h2: "#1a3090", h3: "#2545b0", h4: "#3060d0",
    h5: "#4578e8", h6: "#6090ff", h7: "#80a8ff", h8: "#a0c0ff",
    // Skin
    s1: "#f8dcc0", s2: "#f0c8a8", s3: "#e0b090", s4: "#d09878",
    blush: "#f09088",
    // Eyes
    ew: "#fff", ir1: "#2050c8", ir2: "#1838a0", ir3: "#102870",
    pp: "#080818", shine: "#fff",
    lash: "#101840",
    // Mouth
    m1: "#d05058", m2: "#b04048",
    // Hoodie
    ho1: "#181828", ho2: "#202038", ho3: "#282848", ho4: "#303050",
    // Headphones
    hp1: "#282828", hp2: "#383838", hp3: "#484848", hp4: "#585858",
  };

  const R = (x: number, y: number, w: number, h: number, fill: string, op?: number) => (
    <rect x={x} y={y} width={w} height={h} fill={fill} opacity={op ?? 1} />
  );

  const messages: Record<string, string[]> = {
    idle: ["...", "*mexe no cabelo*", "hmm", "yo ✌️", "oi!", "*olha pro lado*", "*suspira*"],
    happy: ["hehe!", "valeu! 💙", "massa!", "*sorri*", "uwu", "fofo!"],
    waving: ["oi! 👋", "bem-vindo!", "bora codar!"],
    sleeping: ["zzz...", "*boceja*", "5 min...", "*ronca*"],
    excited: ["LETS GO!! 🔥", "AEEEE!", "logou! 🎉"],
    thinking: ["🤔 hmm", "pensando...", "será?...", "*coça cabeça*"],
    listening: ["♪ vibe", "boa playlist!", "♫♪", "~chill~"],
    shy: ["ah...", "*fica vermelho*", "👉👈", "heh..."],
  };

  const showMsg = useCallback((msg: string, dur = 3000) => {
    setMessage(msg); setTimeout(() => setMessage(""), dur);
  }, []);
  const pick = useCallback((cat: string) => {
    const m = messages[cat] || messages.idle;
    return m[Math.floor(Math.random() * m.length)];
  }, []);

  // Eye tracking
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!charRef.current) return;
      const r = charRef.current.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.3);
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      setEyeOff({
        x: Math.round(Math.max(-2, Math.min(2, (dx / d) * 2)) * 10) / 10,
        y: Math.round(Math.max(-1, Math.min(1, (dy / d) * 1.5)) * 10) / 10,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Blink
  useEffect(() => {
    if (mood === "sleeping") return;
    const iv = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 120); }, 2500 + Math.random() * 2500);
    return () => clearInterval(iv);
  }, [mood]);

  // Idle
  useEffect(() => {
    if (mood !== "idle") return;
    const iv = setInterval(() => {
      const r = Math.random();
      if (r < 0.10) { setMood("waving"); showMsg(pick("waving")); setTimeout(() => setMood("idle"), 3000); }
      else if (r < 0.20) { setMood("thinking"); showMsg(pick("thinking")); setTimeout(() => setMood("idle"), 3500); }
      else if (r < 0.28) { setMood("listening"); showMsg(pick("listening")); setTimeout(() => setMood("idle"), 4000); }
      else if (r < 0.36) { showMsg(pick("idle"), 2500); }
    }, 5000 + Math.random() * 4000);
    return () => clearInterval(iv);
  }, [mood, pick, showMsg]);

  // Sleep
  useEffect(() => {
    if (mood === "idle") { const t = setTimeout(() => { setMood("sleeping"); showMsg(pick("sleeping")); }, 35000); return () => clearTimeout(t); }
  }, [mood, pick, showMsg]);
  useEffect(() => {
    if (mood !== "sleeping") return;
    const t = setTimeout(() => { setMood("idle"); showMsg("*acorda* hm?"); }, 10000);
    return () => clearTimeout(t);
  }, [mood, showMsg]);

  // Login
  useEffect(() => {
    if (onLogin) { setMood("excited"); showMsg(pick("excited")); setTimeout(() => setMood("idle"), 4000); }
  }, [onLogin, pick, showMsg]);

  // Click
  const handleClick = useCallback(() => {
    const now = Date.now();
    const dbl = now - lastClick.current < 350;
    lastClick.current = now;
    if (dbl) { setMood("shy"); showMsg(pick("shy")); setTimeout(() => setMood("idle"), 3000); return; }
    setTimeout(() => {
      if (Date.now() - lastClick.current < 350) return;
      setMood("happy"); showMsg(pick("happy"));
      const hid = Date.now();
      setHearts(h => [...h, hid]);
      setTimeout(() => setHearts(h => h.filter(id => id !== hid)), 2000);
      setTimeout(() => setMood("idle"), 3000);
    }, 360);
  }, [pick, showMsg]);

  const eyes = mood !== "sleeping" && !blink;
  const happy = mood === "happy" || mood === "excited" || mood === "shy";
  const sleeping = mood === "sleeping";
  const ox = eyeOff.x;
  const oy = eyeOff.y;

  return (
    <div ref={charRef} className={cn("relative select-none", className)}>
      {message && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 backdrop-blur-xl bg-card/95 border border-border rounded-xl px-3 py-2 shadow-lg animate-fade-in whitespace-nowrap z-10">
          <p className="text-[11px] font-mono text-foreground">{message}</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card/95 border-r border-b border-border rotate-45" />
        </div>
      )}

      {hearts.map((id, i) => (
        <span key={id} className="absolute text-sm pointer-events-none z-20"
          style={{ left: `${50 + (i % 3) * 20}px`, top: "-10px", animation: "ic-float 2s ease-out forwards" }}>
          {["💙", "✨", "💙"][i % 3]}
        </span>
      ))}

      {sleeping && (
        <div className="absolute -top-10 right-0 flex gap-1.5">
          {[0, 0.4, 0.8].map((d, i) => (
            <span key={i} className="animate-float font-mono text-primary/40 font-bold"
              style={{ animationDelay: `${d}s`, fontSize: `${10 + i * 4}px` }}>z</span>
          ))}
        </div>
      )}
      {mood === "thinking" && (
        <div className="absolute -top-8 right-2 flex gap-1.5">
          {[0, 0.2, 0.4].map((d, i) => (
            <span key={i} className="animate-float w-2 h-2 rounded-full bg-primary/30" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      )}
      {mood === "listening" && (
        <div className="absolute -top-8 left-6">
          <span className="animate-float text-primary/50 text-sm">♪</span>
          <span className="animate-float text-accent/40 text-sm ml-4" style={{ animationDelay: "0.5s" }}>♫</span>
        </div>
      )}
      {mood === "excited" && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {[{ x: "5%", y: "10%" }, { x: "90%", y: "5%" }, { x: "0%", y: "55%" }, { x: "95%", y: "50%" }].map((s, i) => (
            <span key={i} className="absolute animate-float text-xs" style={{ left: s.x, top: s.y, animationDelay: `${i * 0.2}s` }}>✨</span>
          ))}
        </div>
      )}

      <div className={cn(
        "transition-transform duration-500",
        !sleeping && "animate-breathe",
        mood === "excited" && "animate-[bounce_0.5s_ease-in-out_infinite]",
        mood === "listening" && "animate-[bounce_1.2s_ease-in-out_infinite]",
      )}>
        <svg
          width="220" height="275"
          viewBox="0 0 96 120"
          className="cursor-pointer drop-shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
          style={{ imageRendering: "pixelated" }}
          onClick={handleClick}
          role="button"
          aria-label="Personagem anime interativa"
        >
          {/* ═══ HAIR BACK ═══ */}
          {/* Back volume */}
          {R(24, 8, 48, 4, P.h1)}
          {R(22, 12, 52, 4, P.h1)}
          {R(20, 16, 56, 4, P.h1)}
          {R(18, 20, 60, 8, P.h2)}
          {R(16, 28, 64, 6, P.h2)}
          {R(18, 34, 60, 6, P.h2)}
          {R(20, 40, 56, 6, P.h3)}
          {/* Left hair strand */}
          {R(14, 24, 8, 20, P.h2)}
          {R(12, 28, 6, 18, P.h3)}
          {R(10, 32, 5, 16, P.h3)}
          {R(8, 36, 4, 14, P.h4)}
          {R(10, 50, 4, 8, P.h5)}
          {R(12, 58, 3, 6, P.h5, 0.7)}
          {R(14, 64, 2, 4, P.h6, 0.5)}
          {/* Right hair strand */}
          {R(74, 24, 8, 20, P.h2)}
          {R(78, 28, 6, 18, P.h3)}
          {R(80, 32, 5, 16, P.h3)}
          {R(82, 36, 4, 14, P.h4)}
          {R(82, 50, 4, 8, P.h5)}
          {R(80, 58, 3, 6, P.h5, 0.7)}
          {R(80, 64, 2, 4, P.h6, 0.5)}

          {/* ═══ HEAD ═══ */}
          {/* Rounded head shape — built row by row */}
          {R(34, 14, 28, 2, P.s1)}
          {R(30, 16, 36, 2, P.s1)}
          {R(28, 18, 40, 2, P.s1)}
          {R(26, 20, 44, 2, P.s1)}
          {R(24, 22, 48, 2, P.s1)}
          {R(22, 24, 52, 2, P.s1)}
          {R(22, 26, 52, 2, P.s1)}
          {R(22, 28, 52, 2, P.s1)}
          {R(22, 30, 52, 2, P.s1)}
          {R(22, 32, 52, 2, P.s1)}
          {R(22, 34, 52, 2, P.s1)}
          {R(22, 36, 52, 2, P.s2)}
          {R(24, 38, 48, 2, P.s2)}
          {R(26, 40, 44, 2, P.s2)}
          {R(28, 42, 40, 2, P.s3)}
          {R(32, 44, 32, 2, P.s3)}
          {R(36, 46, 24, 2, P.s4)}
          {R(40, 48, 16, 2, P.s4)}

          {/* Face edge shading */}
          {R(22, 24, 2, 12, P.s2)}
          {R(72, 24, 2, 12, P.s2)}

          {/* Blush */}
          {R(26, 36, 8, 3, P.blush, happy ? 0.5 : 0.12)}
          {R(62, 36, 8, 3, P.blush, happy ? 0.5 : 0.12)}

          {/* ═══ HAIR FRONT ═══ */}
          {/* Top volume — layered */}
          {R(36, 4, 24, 2, P.h4)}
          {R(32, 6, 32, 2, P.h4)}
          {R(28, 8, 40, 2, P.h3)}
          {R(24, 10, 48, 2, P.h3)}
          {R(22, 12, 52, 4, P.h3)}
          {R(20, 14, 56, 4, P.h4)}

          {/* Top shine */}
          {R(36, 6, 8, 2, P.h6, 0.5)}
          {R(52, 7, 6, 2, P.h7, 0.4)}
          {R(30, 10, 6, 2, P.h6, 0.35)}
          {R(60, 10, 4, 2, P.h7, 0.3)}
          {R(38, 4, 4, 1, P.h8, 0.5)}

          {/* Bangs — left swooping */}
          {R(20, 18, 16, 4, P.h3)}
          {R(22, 18, 12, 3, P.h4)}
          {R(24, 18, 8, 2, P.h5)}
          {R(18, 22, 12, 4, P.h3)}
          {R(20, 22, 8, 3, P.h4, 0.8)}
          {R(16, 26, 8, 3, P.h3)}
          {R(18, 26, 4, 2, P.h4, 0.6)}

          {/* Bangs — right */}
          {R(60, 18, 16, 4, P.h3)}
          {R(62, 18, 12, 3, P.h4)}
          {R(64, 18, 8, 2, P.h5)}
          {R(66, 22, 12, 4, P.h3)}
          {R(68, 22, 8, 3, P.h4, 0.8)}
          {R(72, 26, 6, 3, P.h3)}

          {/* Center part */}
          {R(44, 16, 8, 2, P.h1, 0.5)}

          {/* Ahoge */}
          {R(46, 0, 4, 4, P.h4)}
          {R(48, -2, 2, 2, P.h5)}

          {/* ═══ EYES ═══ */}
          {/* Eyebrows */}
          {R(30, 24, 12, 2, P.h1, 0.5)}
          {R(56, 24, 12, 2, P.h1, 0.5)}

          {!eyes ? (
            /* Blink / closed */
            <>
              {R(30, 32, 12, 1, P.ir1)}
              {R(56, 32, 12, 1, P.ir1)}
              {R(29, 31, 1, 1, P.lash, 0.4)}
              {R(42, 31, 1, 1, P.lash, 0.4)}
              {R(55, 31, 1, 1, P.lash, 0.4)}
              {R(68, 31, 1, 1, P.lash, 0.4)}
            </>
          ) : happy ? (
            /* Happy ∪ eyes */
            <>
              {R(30, 30, 12, 2, P.ir1)}
              {R(29, 32, 2, 3, P.ir1)}
              {R(41, 32, 2, 3, P.ir1)}
              {R(30, 35, 12, 1, P.ir1, 0.3)}
              {R(56, 30, 12, 2, P.ir1)}
              {R(55, 32, 2, 3, P.ir1)}
              {R(67, 32, 2, 3, P.ir1)}
              {R(56, 35, 12, 1, P.ir1, 0.3)}
            </>
          ) : (
            /* Normal tracked eyes */
            <>
              {/* Left eye white */}
              {R(28 + ox, 27 + oy, 16, 10, P.ew)}
              {R(30 + ox, 26 + oy, 12, 1, P.ew)}
              {R(30 + ox, 37 + oy, 12, 1, P.ew, 0.5)}
              {/* Left iris */}
              {R(32 + ox, 28 + oy, 10, 8, P.ir1)}
              {R(34 + ox, 29 + oy, 7, 6, P.ir2)}
              {R(35 + ox, 30 + oy, 5, 4, P.ir3)}
              {/* Left pupil */}
              {R(36 + ox, 31 + oy, 4, 3, P.pp)}
              {/* Left shine */}
              {R(38 + ox, 28 + oy, 3, 2, P.shine, 0.9)}
              {R(33 + ox, 34 + oy, 2, 1, P.shine, 0.4)}
              {/* Left lashes */}
              {R(28, 26, 2, 1, P.lash, 0.6)}
              {R(43, 26, 2, 1, P.lash, 0.6)}
              {R(28, 37, 1, 1, P.lash, 0.3)}
              {R(44, 37, 1, 1, P.lash, 0.3)}

              {/* Right eye white */}
              {R(54 + ox, 27 + oy, 16, 10, P.ew)}
              {R(56 + ox, 26 + oy, 12, 1, P.ew)}
              {R(56 + ox, 37 + oy, 12, 1, P.ew, 0.5)}
              {/* Right iris */}
              {R(58 + ox, 28 + oy, 10, 8, P.ir1)}
              {R(60 + ox, 29 + oy, 7, 6, P.ir2)}
              {R(61 + ox, 30 + oy, 5, 4, P.ir3)}
              {/* Right pupil */}
              {R(62 + ox, 31 + oy, 4, 3, P.pp)}
              {/* Right shine */}
              {R(64 + ox, 28 + oy, 3, 2, P.shine, 0.9)}
              {R(59 + ox, 34 + oy, 2, 1, P.shine, 0.4)}
              {/* Right lashes */}
              {R(54, 26, 2, 1, P.lash, 0.6)}
              {R(69, 26, 2, 1, P.lash, 0.6)}
              {R(54, 37, 1, 1, P.lash, 0.3)}
              {R(70, 37, 1, 1, P.lash, 0.3)}
            </>
          )}

          {/* ═══ NOSE ═══ */}
          {R(46, 40, 4, 2, P.s3)}
          {R(47, 41, 2, 1, P.s4, 0.5)}

          {/* ═══ MOUTH ═══ */}
          {happy ? (
            <>
              {R(42, 44, 12, 2, P.m1)}
              {R(44, 46, 8, 1, P.m2, 0.5)}
            </>
          ) : sleeping ? (
            <>
              {R(44, 44, 8, 1, P.m1, 0.3)}
              {R(52, 45, 2, 3, P.ew, 0.25)}
            </>
          ) : (
            R(44, 44, 8, 2, P.m1, 0.6)
          )}

          {/* ═══ NECK ═══ */}
          {R(40, 50, 16, 4, P.s1)}
          {R(40, 50, 2, 4, P.s2, 0.4)}

          {/* ═══ HOODIE ═══ */}
          {/* Collar */}
          {R(34, 54, 28, 4, P.ho2)}
          {R(36, 54, 24, 2, P.ho3)}
          {/* Body */}
          {R(22, 58, 52, 4, P.ho1)}
          {R(20, 62, 56, 4, P.ho1)}
          {R(18, 66, 60, 4, P.ho1)}
          {R(18, 70, 60, 4, P.ho1)}
          {R(18, 74, 60, 4, P.ho1)}
          {R(20, 78, 56, 4, P.ho1)}
          {R(22, 82, 52, 4, P.ho1)}
          {/* Hoodie highlights */}
          {R(24, 60, 4, 2, P.ho3, 0.3)}
          {R(68, 60, 4, 2, P.ho3, 0.3)}
          {/* Center zipper line */}
          {R(47, 58, 2, 28, P.ho3, 0.3)}
          {/* Pocket lines */}
          {R(28, 76, 16, 1, P.ho3, 0.2)}
          {R(52, 76, 16, 1, P.ho3, 0.2)}

          {/* ═══ HAND ON CHIN ═══ */}
          {/* Right hand resting on chin */}
          {R(56, 42, 8, 4, P.s1)}
          {R(58, 40, 6, 2, P.s1)}
          {R(56, 46, 8, 6, P.s2)}
          {R(56, 52, 6, 4, P.s2)}
          {/* Fingers */}
          {R(58, 42, 2, 1, P.s3, 0.5)}
          {R(62, 42, 2, 1, P.s3, 0.5)}
          {/* Arm/sleeve */}
          {R(62, 52, 10, 8, P.ho1)}
          {R(64, 48, 10, 4, P.ho1)}
          {R(66, 44, 8, 4, P.ho2)}

          {/* Left arm at side */}
          {R(12, 62, 8, 16, P.ho1)}
          {R(10, 66, 4, 12, P.ho1)}
          {R(10, 78, 6, 4, P.s1)}
          {R(12, 80, 4, 2, P.s2)}

          {/* ═══ HEADPHONES ═══ */}
          {/* Band */}
          {R(20, 8, 4, 16, P.hp1)}
          {R(72, 8, 4, 16, P.hp1)}
          {R(24, 4, 48, 4, P.hp2)}
          {R(28, 2, 40, 2, P.hp2)}
          {R(32, 2, 32, 2, P.hp3, 0.5)}
          {/* Left cup */}
          {R(14, 22, 8, 12, P.hp1)}
          {R(16, 24, 6, 8, P.hp2)}
          {R(18, 26, 3, 4, P.hp3)}
          {/* Right cup */}
          {R(74, 22, 8, 12, P.hp1)}
          {R(76, 24, 6, 8, P.hp2)}
          {R(76, 26, 3, 4, P.hp3)}

          {/* Sparkles */}
          {mood === "excited" && (
            <>
              {R(6, 14, 3, 3, "hsl(var(--primary))", 0.8)}
              {R(86, 10, 3, 3, "hsl(var(--accent))", 0.7)}
              {R(10, 4, 2, 2, "hsl(var(--primary))", 0.5)}
              {R(84, 20, 2, 2, "hsl(var(--accent))", 0.5)}
            </>
          )}
        </svg>
      </div>

      <style>{`
        @keyframes ic-float {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-45px) scale(1.3); }
        }
      `}</style>
    </div>
  );
};
