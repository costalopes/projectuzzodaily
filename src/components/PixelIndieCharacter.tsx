import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type CharMood = "idle" | "happy" | "waving" | "typing" | "sleeping" | "excited" | "thinking" | "listening" | "shy";

interface PixelIndieCharacterProps {
  onLogin?: boolean;
  className?: string;
}

export const PixelIndieCharacter = ({ onLogin, className }: PixelIndieCharacterProps) => {
  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState<CharMood>("idle");
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [hearts, setHearts] = useState<number[]>([]);
  const [pets, setPets] = useState(0);
  const charRef = useRef<HTMLDivElement>(null);
  const lastClickTime = useRef<number>(0);

  const hair1 = "#2540b8"; // royal blue dark
  const hair2 = "#3b5ee0"; // royal blue mid
  const hair3 = "#5a7bff"; // royal blue light
  const hairHighlight = "#8aa4ff";
  const skin1 = "#f0c8a0";
  const skin2 = "#e8b890";
  const skinBlush = "#f09890";
  const eye1 = "#3060d0"; // blue eyes
  const eyeWhite = "#ffffff";
  const eyeHighlight = "rgba(255,255,255,0.6)";
  const mouth = "#d06870";
  const shirt1 = "#c04828"; // flannel red
  const shirt2 = "#a03820"; // flannel dark
  const shirt3 = "#d86048"; // flannel light
  const shirtPattern = "#303030"; // flannel lines
  const jeans = "#384868"; // dark denim
  const jeans2 = "#2a3850"; // jeans shadow
  const belt = "#504030";
  const beltBuckle = "#c0a060";
  const boots1 = "#604830";
  const boots2 = "#503820";
  const bootsSole = "#383028";

  const messages: Record<string, string[]> = {
    idle: ["...", "*ajusta o cabelo*", "hmm", "*olha ao redor*", "yo", "oi!", "*acena*", "eae"],
    happy: ["hehe!", "valeu!", "massa!", "top!", "*sorri*", "nice!"],
    waving: ["oi! 👋", "bem-vindo!", "eae!", "bora!", "*acena*"],
    typing: ["digitando...", "hmm...", "*tec tec tec*", "login...", "quase lá..."],
    sleeping: ["zzz...", "*boceja*", "5 min...", "sono..."],
    excited: ["LETS GO!!", "boa!!", "incrível!", "WOOO!", "logado! 🎉"],
    thinking: ["🤔 hmm", "pensando...", "deixa eu ver...", "será que..."],
    listening: ["♪ vibe", "~chilling~", "boa música!", "♫"],
    shy: ["ah...", "*fica vermelho*", "para...", "heh...", "*esconde o rosto*"],
  };

  const showMsg = useCallback((msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  }, []);

  const pickMsg = useCallback((category: string) => {
    const msgs = messages[category] || messages.idle;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, []);

  // Eye tracking
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!charRef.current) return;
      const rect = charRef.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 1.5;
      setEyeOffset({
        x: Math.round(Math.max(-maxOffset, Math.min(maxOffset, (dx / Math.max(dist, 1)) * maxOffset))),
        y: Math.round(Math.max(-1, Math.min(1, (dy / Math.max(dist, 1)) * maxOffset * 0.5))),
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  // Blink
  useEffect(() => {
    if (mood === "sleeping") return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [mood]);

  // Idle behavior
  useEffect(() => {
    if (mood !== "idle") return;
    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.15) {
        setMood("waving");
        showMsg(pickMsg("waving"));
        setTimeout(() => setMood("idle"), 3000);
      } else if (rand < 0.25) {
        setMood("thinking");
        showMsg(pickMsg("thinking"));
        setTimeout(() => setMood("idle"), 3500);
      } else if (rand < 0.35) {
        setMood("listening");
        showMsg(pickMsg("listening"));
        setTimeout(() => setMood("idle"), 4000);
      } else {
        showMsg(pickMsg("idle"), 3000);
      }
    }, 5000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [mood, pickMsg, showMsg]);

  // Idle → sleeping after long time
  useEffect(() => {
    if (mood === "idle") {
      const timeout = setTimeout(() => {
        setMood("sleeping");
        showMsg(pickMsg("sleeping"));
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [mood, pickMsg, showMsg]);

  // Sleeping → wake up
  useEffect(() => {
    if (mood !== "sleeping") return;
    const timeout = setTimeout(() => {
      setMood("idle");
      showMsg("*acorda* hm?");
    }, 12000);
    return () => clearTimeout(timeout);
  }, [mood, showMsg]);

  // React to login attempt
  useEffect(() => {
    if (onLogin) {
      setMood("excited");
      showMsg(pickMsg("excited"));
      setTimeout(() => setMood("idle"), 4000);
    }
  }, [onLogin, pickMsg, showMsg]);

  // Click interaction
  const handleClick = useCallback(() => {
    const now = Date.now();
    const isDouble = now - lastClickTime.current < 350;
    lastClickTime.current = now;

    if (isDouble) {
      setMood("shy");
      showMsg(pickMsg("shy"));
      setTimeout(() => setMood("idle"), 3000);
      return;
    }

    setTimeout(() => {
      if (Date.now() - lastClickTime.current < 350) return;
      const newPets = pets + 1;
      setPets(newPets);
      setMood("happy");
      showMsg(pickMsg("happy"));
      const heartId = Date.now();
      setHearts(h => [...h, heartId]);
      setTimeout(() => setHearts(h => h.filter(id => id !== heartId)), 2000);
      setTimeout(() => setMood("idle"), 3000);
    }, 360);
  }, [pets, pickMsg, showMsg]);

  const showEyes = mood !== "sleeping" && !blink;
  const isHappy = mood === "happy" || mood === "excited" || mood === "shy";
  const isWaving = mood === "waving";
  const isSleeping = mood === "sleeping";
  const isThinking = mood === "thinking";

  return (
    <div ref={charRef} className={cn("relative select-none", className)}>
      {/* Speech bubble */}
      {message && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 backdrop-blur-xl bg-card/95 border border-border rounded-xl px-3 py-2 shadow-lg animate-fade-in whitespace-nowrap z-10">
          <p className="text-[10px] font-mono text-foreground">{message}</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card/95 border-r border-b border-border rotate-45" />
        </div>
      )}

      {/* Hearts */}
      {hearts.map((id, i) => (
        <span key={id} className="absolute text-sm animate-heart-float pointer-events-none z-20"
          style={{ left: `${30 + (i % 3) * 20}px`, top: "-8px" }}>
          {["♡", "✦", "♡"][i % 3]}
        </span>
      ))}

      {/* Sleeping Zs */}
      {isSleeping && (
        <div className="absolute -top-8 right-0 flex gap-1">
          {[0, 0.4, 0.8].map((d, i) => (
            <span key={i} className="animate-float font-mono text-muted-foreground/50"
              style={{ animationDelay: `${d}s`, fontSize: `${9 + i * 3}px` }}>z</span>
          ))}
        </div>
      )}

      {/* Thinking dots */}
      {isThinking && (
        <div className="absolute -top-6 right-2 flex gap-1">
          {[0, 0.2, 0.4].map((d, i) => (
            <span key={i} className="animate-float w-1.5 h-1.5 rounded-full bg-primary/40"
              style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      )}

      {/* Music notes when listening */}
      {mood === "listening" && (
        <div className="absolute -top-6 left-4">
          <span className="animate-float text-primary/60 text-xs" style={{ animationDelay: "0s" }}>♪</span>
          <span className="animate-float text-accent/50 text-xs ml-3" style={{ animationDelay: "0.4s" }}>♫</span>
        </div>
      )}

      <div className={cn(
        "transition-transform duration-500",
        !isSleeping && "animate-breathe",
        mood === "excited" && "animate-[bounce_0.6s_ease-in-out_infinite]",
        mood === "listening" && "animate-[bounce_1s_ease-in-out_infinite]",
      )}>
        <svg
          width="160" height="200" viewBox="0 0 64 80"
          className="image-rendering-pixelated cursor-pointer drop-shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
          onClick={handleClick}
          role="button"
          aria-label="Personagem interativo"
        >
          {/* Shadow */}
          <ellipse cx="32" cy="78" rx="18" ry="2" fill="hsl(var(--foreground) / 0.06)" />

          {/* === HAIR (back layer) === */}
          {/* Hair back volume - falls behind head */}
          <rect x="15" y="5" width="34" height="3" fill={hair1} />
          <rect x="14" y="8" width="36" height="2" fill={hair1} />
          <rect x="42" y="10" width="10" height="18" fill={hair1} />
          <rect x="44" y="28" width="8" height="8" fill={hair1} />
          <rect x="46" y="36" width="6" height="4" fill={hair2} />
          <rect x="48" y="40" width="4" height="3" fill={hair2} />
          {/* Left side hair */}
          <rect x="12" y="10" width="4" height="16" fill={hair1} />
          <rect x="10" y="12" width="3" height="14" fill={hair2} />
          <rect x="9" y="14" width="2" height="12" fill={hair2} />
          <rect x="10" y="26" width="3" height="6" fill={hair1} />
          <rect x="11" y="32" width="2" height="4" fill={hair2} />

          {/* === HEAD === */}
          <rect x="16" y="10" width="26" height="24" fill={skin1} />
          <rect x="18" y="8" width="22" height="2" fill={skin1} />
          <rect x="15" y="12" width="1" height="20" fill={skin2} />
          <rect x="42" y="12" width="1" height="20" fill={skin2} />
          <rect x="16" y="34" width="26" height="2" fill={skin2} />

          {/* Blush */}
          {isHappy && (
            <>
              <rect x="17" y="24" width="4" height="2" fill={skinBlush} opacity="0.5" />
              <rect x="37" y="24" width="4" height="2" fill={skinBlush} opacity="0.5" />
            </>
          )}
          {/* Permanent subtle blush */}
          <rect x="18" y="25" width="3" height="1" fill={skinBlush} opacity="0.25" />
          <rect x="37" y="25" width="3" height="1" fill={skinBlush} opacity="0.25" />

          {/* === HAIR (front layer) === */}
          {/* Top hair */}
          <rect x="16" y="3" width="28" height="3" fill={hair2} />
          <rect x="18" y="1" width="24" height="2" fill={hair3} />
          <rect x="20" y="0" width="18" height="1" fill={hair3} />
          {/* Front hair */}
          <rect x="14" y="6" width="30" height="6" fill={hair2} />
          <rect x="16" y="6" width="26" height="4" fill={hair3} />
          {/* Bangs */}
          <rect x="16" y="10" width="8" height="4" fill={hair2} />
          <rect x="17" y="10" width="6" height="3" fill={hair3} />
          <rect x="34" y="10" width="8" height="3" fill={hair2} />
          <rect x="35" y="10" width="5" height="2" fill={hair3} />
          {/* Middle part */}
          <rect x="24" y="10" width="10" height="2" fill={hair2} />
          {/* Highlights */}
          <rect x="22" y="3" width="3" height="1" fill={hairHighlight} opacity="0.5" />
          <rect x="30" y="4" width="4" height="1" fill={hairHighlight} opacity="0.4" />
          <rect x="18" y="7" width="2" height="1" fill={hairHighlight} opacity="0.3" />
          {/* Spiky top strand */}
          <rect x="28" y="-1" width="3" height="2" fill={hair3} />
          <rect x="29" y="-2" width="2" height="1" fill={hair2} />

          {/* === EYES === */}
          {!showEyes ? (
            // Closed / blink
            <>
              <rect x="20" y="20" width="7" height="1" fill={eye1} />
              <rect x="35" y="20" width="7" height="1" fill={eye1} />
            </>
          ) : isHappy ? (
            // Happy ^ ^ eyes
            <>
              <rect x="20" y="19" width="7" height="1" fill={eye1} />
              <rect x="20" y="20" width="1" height="2" fill={eye1} />
              <rect x="26" y="20" width="1" height="2" fill={eye1} />
              <rect x="35" y="19" width="7" height="1" fill={eye1} />
              <rect x="35" y="20" width="1" height="2" fill={eye1} />
              <rect x="41" y="20" width="1" height="2" fill={eye1} />
            </>
          ) : (
            // Normal eyes with tracking
            <>
              {/* Left eye */}
              <rect x={20 + eyeOffset.x} y={18 + eyeOffset.y} width="7" height="6" fill={eyeWhite} />
              <rect x={22 + eyeOffset.x} y={19 + eyeOffset.y} width="4" height="4" fill={eye1} />
              <rect x={23 + eyeOffset.x} y={19 + eyeOffset.y} width="2" height="2" fill="black" />
              <rect x={24 + eyeOffset.x} y={19 + eyeOffset.y} width="1" height="1" fill={eyeHighlight} />
              {/* Right eye */}
              <rect x={35 + eyeOffset.x} y={18 + eyeOffset.y} width="7" height="6" fill={eyeWhite} />
              <rect x={37 + eyeOffset.x} y={19 + eyeOffset.y} width="4" height="4" fill={eye1} />
              <rect x={38 + eyeOffset.x} y={19 + eyeOffset.y} width="2" height="2" fill="black" />
              <rect x={39 + eyeOffset.x} y={19 + eyeOffset.y} width="1" height="1" fill={eyeHighlight} />
            </>
          )}

          {/* Eyebrows */}
          <rect x="19" y="16" width="8" height="1" fill={hair1} opacity="0.7" />
          <rect x="35" y="16" width="8" height="1" fill={hair1} opacity="0.7" />

          {/* === NOSE & MOUTH === */}
          <rect x="29" y="26" width="3" height="2" fill={skin2} />
          <rect x="30" y="27" width="1" height="1" fill={skin2} opacity="0.6" />
          {/* Mouth */}
          {isHappy ? (
            <>
              <rect x="27" y="29" width="8" height="1" fill={mouth} />
              <rect x="28" y="30" width="6" height="1" fill={mouth} opacity="0.6" />
            </>
          ) : isSleeping ? (
            <rect x="28" y="29" width="5" height="1" fill={mouth} opacity="0.4" />
          ) : (
            <>
              <rect x="28" y="29" width="6" height="1" fill={mouth} opacity="0.7" />
            </>
          )}

          {/* === NECK === */}
          <rect x="24" y="34" width="14" height="4" fill={skin1} />

          {/* === BODY / SHIRT (flannel) === */}
          <rect x="14" y="38" width="34" height="20" fill={shirt1} />
          <rect x="16" y="36" width="30" height="2" fill={shirt1} />
          {/* Flannel pattern — horizontal stripes */}
          <rect x="14" y="40" width="34" height="2" fill={shirt2} />
          <rect x="14" y="44" width="34" height="1" fill={shirtPattern} opacity="0.2" />
          <rect x="14" y="48" width="34" height="2" fill={shirt2} />
          <rect x="14" y="52" width="34" height="1" fill={shirtPattern} opacity="0.2" />
          {/* Flannel pattern — vertical stripes */}
          <rect x="20" y="38" width="1" height="20" fill={shirtPattern} opacity="0.15" />
          <rect x="28" y="38" width="1" height="20" fill={shirtPattern} opacity="0.15" />
          <rect x="36" y="38" width="1" height="20" fill={shirtPattern} opacity="0.15" />
          <rect x="42" y="38" width="1" height="20" fill={shirtPattern} opacity="0.15" />
          {/* Shirt collar / opening */}
          <rect x="28" y="36" width="6" height="6" fill={skin1} />
          <rect x="27" y="36" width="1" height="8" fill={shirt3} />
          <rect x="34" y="36" width="1" height="8" fill={shirt3} />
          {/* Shirt light accents */}
          <rect x="15" y="39" width="2" height="1" fill={shirt3} opacity="0.4" />
          <rect x="45" y="39" width="2" height="1" fill={shirt3} opacity="0.4" />

          {/* === ARMS === */}
          {isWaving ? (
            <>
              {/* Left arm normal */}
              <rect x="8" y="40" width="6" height="14" fill={shirt1} />
              <rect x="8" y="42" width="6" height="2" fill={shirt2} />
              <rect x="8" y="46" width="6" height="1" fill={shirtPattern} opacity="0.15" />
              <rect x="8" y="54" width="6" height="3" fill={skin1} />
              {/* Right arm waving up */}
              <rect x="48" y="28" width="6" height="10" fill={shirt1} />
              <rect x="48" y="30" width="6" height="2" fill={shirt2} />
              <rect x="48" y="24" width="6" height="4" fill={skin1} />
              {/* Waving hand fingers */}
              <rect x="49" y="23" width="4" height="1" fill={skin2} />
            </>
          ) : (
            <>
              {/* Left arm */}
              <rect x="8" y="40" width="6" height="14" fill={shirt1} />
              <rect x="8" y="42" width="6" height="2" fill={shirt2} />
              <rect x="8" y="46" width="6" height="1" fill={shirtPattern} opacity="0.15" />
              <rect x="8" y="54" width="6" height="3" fill={skin1} />
              <rect x="9" y="56" width="4" height="1" fill={skin2} />
              {/* Right arm */}
              <rect x="48" y="40" width="6" height="14" fill={shirt1} />
              <rect x="48" y="42" width="6" height="2" fill={shirt2} />
              <rect x="48" y="46" width="6" height="1" fill={shirtPattern} opacity="0.15" />
              <rect x="48" y="54" width="6" height="3" fill={skin1} />
              <rect x="49" y="56" width="4" height="1" fill={skin2} />
            </>
          )}

          {/* === BELT === */}
          <rect x="14" y="56" width="34" height="2" fill={belt} />
          <rect x="29" y="56" width="4" height="2" fill={beltBuckle} />
          <rect x="30" y="56" width="2" height="1" fill="#e0c880" opacity="0.5" />

          {/* === JEANS === */}
          <rect x="14" y="58" width="34" height="10" fill={jeans} />
          <rect x="14" y="60" width="16" height="8" fill={jeans} />
          <rect x="32" y="60" width="16" height="8" fill={jeans} />
          {/* Jeans center seam */}
          <rect x="30" y="62" width="2" height="6" fill={jeans2} />
          {/* Jeans detail */}
          <rect x="16" y="64" width="2" height="1" fill={jeans2} opacity="0.4" />
          <rect x="42" y="64" width="2" height="1" fill={jeans2} opacity="0.4" />

          {/* === BOOTS === */}
          <rect x="14" y="68" width="14" height="6" fill={boots1} />
          <rect x="34" y="68" width="14" height="6" fill={boots1} />
          {/* Boot tops */}
          <rect x="14" y="68" width="14" height="2" fill={boots2} />
          <rect x="34" y="68" width="14" height="2" fill={boots2} />
          {/* Boot soles */}
          <rect x="12" y="74" width="18" height="2" fill={bootsSole} />
          <rect x="32" y="74" width="18" height="2" fill={bootsSole} />
          {/* Boot laces */}
          <rect x="19" y="70" width="4" height="1" fill="#806040" opacity="0.5" />
          <rect x="19" y="72" width="4" height="1" fill="#806040" opacity="0.5" />
          <rect x="39" y="70" width="4" height="1" fill="#806040" opacity="0.5" />
          <rect x="39" y="72" width="4" height="1" fill="#806040" opacity="0.5" />

          {/* === ACCESSORIES === */}
          {/* Headphone band (subtle) */}
          {mood === "listening" && (
            <>
              <rect x="13" y="6" width="2" height="8" fill="#404040" />
              <rect x="43" y="6" width="2" height="8" fill="#404040" />
              <rect x="15" y="4" width="28" height="2" fill="#505050" />
              <rect x="11" y="12" width="4" height="5" fill="#353535" />
              <rect x="12" y="13" width="2" height="3" fill="#555" />
              <rect x="43" y="12" width="4" height="5" fill="#353535" />
              <rect x="44" y="13" width="2" height="3" fill="#555" />
            </>
          )}

          {/* Excited sparkles */}
          {mood === "excited" && (
            <>
              <rect x="4" y="8" width="2" height="2" fill="hsl(var(--primary))" opacity="0.8" />
              <rect x="56" y="6" width="2" height="2" fill="hsl(var(--accent))" opacity="0.7" />
              <rect x="8" y="2" width="1" height="1" fill="hsl(var(--primary))" opacity="0.6" />
              <rect x="52" y="12" width="1" height="1" fill="hsl(var(--accent))" opacity="0.5" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
