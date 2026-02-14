import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type CharMood = "idle" | "happy" | "waving" | "typing" | "sleeping" | "excited" | "thinking" | "listening" | "shy";

interface PixelIndieCharacterProps {
  onLogin?: boolean;
  className?: string;
}

// Pixel row helper: draws a horizontal run of pixels
const Row = ({ y, pixels }: { y: number; pixels: [number, number, string, number?][] }) => (
  <>
    {pixels.map(([x, w, fill, op], i) => (
      <rect key={i} x={x} y={y} width={w} height={1} fill={fill} opacity={op ?? 1} />
    ))}
  </>
);

export const PixelIndieCharacter = ({ onLogin, className }: PixelIndieCharacterProps) => {
  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState<CharMood>("idle");
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [hearts, setHearts] = useState<number[]>([]);
  const charRef = useRef<HTMLDivElement>(null);
  const lastClickTime = useRef<number>(0);

  // ── Palette ──
  const h1 = "#162878"; // hair darkest
  const h2 = "#1e3898"; // hair dark
  const h3 = "#2848b8"; // hair mid
  const h4 = "#3860d8"; // hair light
  const h5 = "#5078f0"; // hair lighter
  const h6 = "#6890ff"; // hair highlight
  const h7 = "#88aaff"; // hair shine
  const sk = "#f0cfb0"; // skin base
  const sk2 = "#e4ba98"; // skin shadow
  const sk3 = "#d8a880"; // skin darker
  const bl = "#f09888"; // blush
  const ew = "#ffffff"; // eye white
  const ir = "#2050c8"; // iris
  const ir2 = "#1840a0"; // iris dark
  const pp = "#101830"; // pupil
  const es = "rgba(255,255,255,0.9)"; // eye shine
  const el = "#182060"; // eyelash
  const mo = "#c05058"; // mouth
  const mo2 = "#a04048"; // mouth dark
  const fl1 = "#c03828"; // flannel red
  const fl2 = "#a02818"; // flannel dark
  const fl3 = "#d84838"; // flannel light
  const flL = "#1a1a1a"; // flannel lines
  const tee = "#1a1a1a"; // black tee
  const tee2 = "#282828"; // tee lighter
  const dn = "#3a4a6a"; // denim
  const dn2 = "#2c3a58"; // denim dark
  const dn3 = "#4a5a78"; // denim light
  const bt = "#483020"; // belt
  const bk = "#c8a050"; // buckle
  const bo1 = "#3a2818"; // boot dark
  const bo2 = "#4a3828"; // boot
  const bo3 = "#2a2018"; // boot sole

  const messages: Record<string, string[]> = {
    idle: ["...", "*mexe no cabelo*", "hmm", "*olha pro lado*", "yo ✌️", "oi!", "eae"],
    happy: ["hehe!", "valeu! 💙", "massa!", "*sorri*", "uwu"],
    waving: ["oi! 👋", "bem-vindo!", "bora codar!"],
    typing: ["digitando...", "*tec tec*", "quase lá..."],
    sleeping: ["zzz...", "*boceja*", "5 min..."],
    excited: ["LETS GO!! 🔥", "AEEEE!", "logou! 🎉"],
    thinking: ["🤔 hmm", "pensando...", "será?..."],
    listening: ["♪ vibe", "boa playlist!", "♫"],
    shy: ["ah...", "*fica vermelho*", "👉👈"],
  };

  const showMsg = useCallback((msg: string, dur = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), dur);
  }, []);

  const pickMsg = useCallback((cat: string) => {
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
      setEyeOffset({
        x: Math.round(Math.max(-1, Math.min(1, (dx / d) * 1.2)) * 10) / 10,
        y: Math.round(Math.max(-0.6, Math.min(0.6, (dy / d) * 0.8)) * 10) / 10,
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

  // Idle behavior
  useEffect(() => {
    if (mood !== "idle") return;
    const iv = setInterval(() => {
      const r = Math.random();
      if (r < 0.12) { setMood("waving"); showMsg(pickMsg("waving")); setTimeout(() => setMood("idle"), 3000); }
      else if (r < 0.22) { setMood("thinking"); showMsg(pickMsg("thinking")); setTimeout(() => setMood("idle"), 3500); }
      else if (r < 0.30) { setMood("listening"); showMsg(pickMsg("listening")); setTimeout(() => setMood("idle"), 4000); }
      else if (r < 0.38) { showMsg(pickMsg("idle"), 2500); }
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

  const showEyes = mood !== "sleeping" && !blink;
  const isHappy = mood === "happy" || mood === "excited" || mood === "shy";
  const isWaving = mood === "waving";
  const isSleeping = mood === "sleeping";
  const isThinking = mood === "thinking";
  const ox = eyeOffset.x;
  const oy = eyeOffset.y;

  return (
    <div ref={charRef} className={cn("relative select-none", className)}>
      {/* Speech bubble */}
      {message && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 backdrop-blur-xl bg-card/95 border border-border rounded-xl px-3 py-2 shadow-lg animate-fade-in whitespace-nowrap z-10">
          <p className="text-[11px] font-mono text-foreground">{message}</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card/95 border-r border-b border-border rotate-45" />
        </div>
      )}

      {hearts.map((id, i) => (
        <span key={id} className="absolute text-sm pointer-events-none z-20"
          style={{ left: `${50 + (i % 3) * 18}px`, top: "-10px", animation: "indie-float 2s ease-out forwards" }}>
          {["💙", "✨", "💙"][i % 3]}
        </span>
      ))}

      {isSleeping && (
        <div className="absolute -top-10 right-2 flex gap-1.5">
          {[0, 0.4, 0.8].map((d, i) => (
            <span key={i} className="animate-float font-mono text-primary/40 font-bold"
              style={{ animationDelay: `${d}s`, fontSize: `${10 + i * 4}px` }}>z</span>
          ))}
        </div>
      )}
      {isThinking && (
        <div className="absolute -top-8 right-2 flex gap-1.5">
          {[0, 0.2, 0.4].map((d, i) => (
            <span key={i} className="animate-float w-2 h-2 rounded-full bg-primary/30" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      )}
      {mood === "listening" && (
        <div className="absolute -top-8 left-8">
          <span className="animate-float text-primary/50 text-sm" style={{ animationDelay: "0s" }}>♪</span>
          <span className="animate-float text-accent/40 text-sm ml-4" style={{ animationDelay: "0.5s" }}>♫</span>
        </div>
      )}

      <div className={cn(
        "transition-transform duration-500",
        !isSleeping && "animate-breathe",
        mood === "excited" && "animate-[bounce_0.5s_ease-in-out_infinite]",
        mood === "listening" && "animate-[bounce_1.2s_ease-in-out_infinite]",
      )}>
        <svg
          width="200" height="240" viewBox="0 0 48 58"
          className="cursor-pointer drop-shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
          style={{ imageRendering: "pixelated" }}
          onClick={handleClick}
          role="button"
          aria-label="Personagem indie interativo"
        >
          {/* Shadow */}
          <ellipse cx="24" cy="57" rx="12" ry="1" fill="hsl(var(--foreground) / 0.06)" />

          {/* ═══════ HAIR BACK — twin tails ═══════ */}
          {/* Right twin tail */}
          <Row y={10} pixels={[[35,5,h1]]} />
          <Row y={11} pixels={[[36,5,h1]]} />
          <Row y={12} pixels={[[37,5,h2]]} />
          <Row y={13} pixels={[[37,5,h2]]} />
          <Row y={14} pixels={[[37,6,h2]]} />
          <Row y={15} pixels={[[38,6,h3]]} />
          <Row y={16} pixels={[[38,6,h3]]} />
          <Row y={17} pixels={[[38,5,h3]]} />
          <Row y={18} pixels={[[39,5,h4]]} />
          <Row y={19} pixels={[[39,4,h4]]} />
          <Row y={20} pixels={[[39,4,h4]]} />
          <Row y={21} pixels={[[39,4,h5]]} />
          <Row y={22} pixels={[[39,3,h5]]} />
          <Row y={23} pixels={[[40,3,h5]]} />
          <Row y={24} pixels={[[40,2,h5]]} />
          <Row y={25} pixels={[[40,2,h6]]} />
          <Row y={26} pixels={[[40,2,h6,0.7]]} />

          {/* Left twin tail */}
          <Row y={10} pixels={[[8,5,h1]]} />
          <Row y={11} pixels={[[7,5,h1]]} />
          <Row y={12} pixels={[[6,5,h2]]} />
          <Row y={13} pixels={[[6,5,h2]]} />
          <Row y={14} pixels={[[5,6,h2]]} />
          <Row y={15} pixels={[[4,6,h3]]} />
          <Row y={16} pixels={[[4,6,h3]]} />
          <Row y={17} pixels={[[5,5,h3]]} />
          <Row y={18} pixels={[[4,5,h4]]} />
          <Row y={19} pixels={[[5,4,h4]]} />
          <Row y={20} pixels={[[5,4,h4]]} />
          <Row y={21} pixels={[[5,4,h5]]} />
          <Row y={22} pixels={[[6,3,h5]]} />
          <Row y={23} pixels={[[5,3,h5]]} />
          <Row y={24} pixels={[[6,2,h5]]} />
          <Row y={25} pixels={[[6,2,h6]]} />
          <Row y={26} pixels={[[6,2,h6,0.7]]} />

          {/* Hair back behind head */}
          <Row y={5} pixels={[[13,22,h1]]} />
          <Row y={6} pixels={[[12,24,h1]]} />
          <Row y={7} pixels={[[11,26,h1]]} />
          <Row y={8} pixels={[[10,28,h1]]} />
          <Row y={9} pixels={[[10,28,h2]]} />

          {/* ═══════ HEAD — rounded shape ═══════ */}
          {/* Top of head — curved */}
          <Row y={7} pixels={[[16,16,sk]]} />
          <Row y={8} pixels={[[14,20,sk]]} />
          <Row y={9} pixels={[[13,22,sk]]} />
          <Row y={10} pixels={[[12,24,sk]]} />
          <Row y={11} pixels={[[12,24,sk]]} />
          <Row y={12} pixels={[[12,24,sk]]} />
          <Row y={13} pixels={[[12,24,sk]]} />
          <Row y={14} pixels={[[12,24,sk]]} />
          <Row y={15} pixels={[[12,24,sk]]} />
          <Row y={16} pixels={[[12,24,sk]]} />
          <Row y={17} pixels={[[12,24,sk]]} />
          <Row y={18} pixels={[[13,22,sk]]} />
          <Row y={19} pixels={[[14,20,sk]]} />
          {/* Jaw curve */}
          <Row y={20} pixels={[[15,18,sk2]]} />
          <Row y={21} pixels={[[17,14,sk2]]} />
          <Row y={22} pixels={[[19,10,sk3]]} />

          {/* Face shadow edges */}
          <Row y={10} pixels={[[12,1,sk2],[35,1,sk2]]} />
          <Row y={11} pixels={[[12,1,sk2],[35,1,sk2]]} />
          <Row y={12} pixels={[[12,1,sk2],[35,1,sk2]]} />
          <Row y={13} pixels={[[12,1,sk2],[35,1,sk2]]} />

          {/* Blush */}
          <rect x={13} y={16} width={4} height={2} fill={bl} opacity={isHappy ? 0.55 : 0.15} rx="0" />
          <rect x={31} y={16} width={4} height={2} fill={bl} opacity={isHappy ? 0.55 : 0.15} rx="0" />

          {/* ═══════ HAIR FRONT — bangs & top ═══════ */}
          {/* Very top */}
          <Row y={0} pixels={[[20,8,h4]]} />
          <Row y={1} pixels={[[17,14,h4]]} />
          <Row y={2} pixels={[[15,18,h3]]} />
          <Row y={3} pixels={[[13,22,h3]]} />
          <Row y={4} pixels={[[12,24,h3]]} />
          <Row y={5} pixels={[[11,26,h3]]} />
          <Row y={6} pixels={[[11,26,h4]]} />
          {/* Top surface highlights */}
          <Row y={2} pixels={[[18,4,h5,0.6],[25,3,h6,0.4]]} />
          <Row y={3} pixels={[[15,3,h5,0.5],[28,2,h6,0.3]]} />
          <Row y={4} pixels={[[14,2,h5,0.4]]} />
          {/* Mid-hair volume */}
          <Row y={5} pixels={[[16,3,h5,0.5],[30,2,h5,0.4]]} />
          <Row y={6} pixels={[[17,2,h6,0.4],[32,2,h6,0.3]]} />
          {/* Bangs — left side swooping */}
          <Row y={7} pixels={[[11,8,h3],[14,5,h4]]} />
          <Row y={8} pixels={[[10,7,h3],[13,4,h4]]} />
          <Row y={9} pixels={[[10,6,h3],[12,4,h4],[13,2,h5,0.5]]} />
          <Row y={10} pixels={[[10,5,h3],[12,3,h4]]} />
          <Row y={11} pixels={[[10,4,h3],[12,2,h4,0.8]]} />
          {/* Bangs — right side */}
          <Row y={7} pixels={[[29,8,h3],[31,5,h4]]} />
          <Row y={8} pixels={[[31,7,h3],[33,4,h4]]} />
          <Row y={9} pixels={[[32,6,h3],[34,3,h4]]} />
          <Row y={10} pixels={[[33,5,h3],[35,2,h4]]} />
          <Row y={11} pixels={[[34,4,h3]]} />
          {/* Center parting */}
          <Row y={7} pixels={[[22,4,h2,0.6]]} />
          {/* Ahoge */}
          <rect x={23} y={-2} width={2} height={3} fill={h4} />
          <rect x={24} y={-3} width={1} height={1} fill={h5} />

          {/* Hair shine streaks */}
          <Row y={4} pixels={[[19,2,h7,0.5],[26,3,h7,0.35]]} />
          <Row y={6} pixels={[[13,2,h7,0.3],[34,2,h7,0.25]]} />

          {/* ═══════ EYES ═══════ */}
          {!showEyes ? (
            /* Closed eyes — cute lines */
            <>
              <Row y={14} pixels={[[15,5,ir],[28,5,ir]]} />
              <Row y={13} pixels={[[14,1,el,0.3],[20,1,el,0.3],[27,1,el,0.3],[33,1,el,0.3]]} />
            </>
          ) : isHappy ? (
            /* Happy ∪∪ eyes */
            <>
              <Row y={13} pixels={[[15,5,ir],[28,5,ir]]} />
              <Row y={14} pixels={[[14,1,ir],[20,1,ir],[27,1,ir],[33,1,ir]]} />
              <Row y={15} pixels={[[14,1,ir],[20,1,ir],[27,1,ir],[33,1,ir]]} />
            </>
          ) : (
            /* Normal detailed eyes with tracking */
            <>
              {/* Left eye */}
              <rect x={14+ox} y={12+oy} width={7} height={5} fill={ew} />
              <rect x={15+ox} y={11+oy} width={5} height={1} fill={ew} />
              <rect x={15+ox} y={17+oy} width={5} height={1} fill={ew} opacity={0.5} />
              {/* Iris */}
              <rect x={16+ox} y={12+oy} width={4} height={5} fill={ir} />
              <rect x={17+ox} y={13+oy} width={3} height={3} fill={ir2} />
              {/* Pupil */}
              <rect x={17+ox} y={13+oy} width={2} height={2} fill={pp} />
              {/* Shine */}
              <rect x={18+ox} y={12+oy} width={2} height={1} fill={es} />
              <rect x={16+ox} y={15+oy} width={1} height={1} fill={es} opacity={0.4} />
              {/* Lashes */}
              <rect x={14} y={11} width={1} height={1} fill={el} opacity={0.6} />
              <rect x={20} y={11} width={1} height={1} fill={el} opacity={0.6} />

              {/* Right eye */}
              <rect x={27+ox} y={12+oy} width={7} height={5} fill={ew} />
              <rect x={28+ox} y={11+oy} width={5} height={1} fill={ew} />
              <rect x={28+ox} y={17+oy} width={5} height={1} fill={ew} opacity={0.5} />
              {/* Iris */}
              <rect x={29+ox} y={12+oy} width={4} height={5} fill={ir} />
              <rect x={30+ox} y={13+oy} width={3} height={3} fill={ir2} />
              {/* Pupil */}
              <rect x={30+ox} y={13+oy} width={2} height={2} fill={pp} />
              {/* Shine */}
              <rect x={31+ox} y={12+oy} width={2} height={1} fill={es} />
              <rect x={29+ox} y={15+oy} width={1} height={1} fill={es} opacity={0.4} />
              {/* Lashes */}
              <rect x={27} y={11} width={1} height={1} fill={el} opacity={0.6} />
              <rect x={33} y={11} width={1} height={1} fill={el} opacity={0.6} />
            </>
          )}

          {/* Eyebrows */}
          <Row y={10} pixels={[[15,5,h1,0.5],[28,5,h1,0.5]]} />

          {/* ═══════ NOSE ═══════ */}
          <rect x={22} y={18} width={2} height={1} fill={sk2} />
          <rect x={23} y={19} width={1} height={1} fill={sk3} opacity={0.5} />

          {/* ═══════ MOUTH ═══════ */}
          {isHappy ? (
            <>
              <Row y={20} pixels={[[21,6,mo]]} />
              <Row y={21} pixels={[[22,4,mo2,0.5]]} />
            </>
          ) : isSleeping ? (
            <Row y={20} pixels={[[22,4,mo,0.3]]} />
          ) : (
            <Row y={20} pixels={[[22,4,mo,0.6]]} />
          )}

          {/* ═══════ NECK ═══════ */}
          <Row y={22} pixels={[[20,8,sk]]} />
          <Row y={23} pixels={[[21,6,sk]]} />

          {/* ═══════ BODY ═══════ */}
          {/* Black tee center */}
          <Row y={24} pixels={[[19,10,tee]]} />
          <Row y={25} pixels={[[19,10,tee]]} />
          <Row y={26} pixels={[[19,10,tee]]} />
          <Row y={27} pixels={[[19,10,tee]]} />
          <Row y={28} pixels={[[19,10,tee]]} />
          <Row y={29} pixels={[[19,10,tee]]} />
          <Row y={30} pixels={[[19,10,tee]]} />
          <Row y={31} pixels={[[19,10,tee]]} />
          <Row y={32} pixels={[[19,10,tee]]} />
          <Row y={33} pixels={[[19,10,tee]]} />
          {/* Tee highlight */}
          <Row y={25} pixels={[[21,2,tee2,0.4]]} />
          {/* Small logo on tee */}
          <rect x={22} y={27} width={3} height={2} fill={h4} opacity={0.3} />

          {/* Flannel jacket — left side */}
          <Row y={24} pixels={[[11,8,fl1]]} />
          <Row y={25} pixels={[[11,8,fl1]]} />
          <Row y={26} pixels={[[11,8,fl1]]} />
          <Row y={27} pixels={[[11,8,fl2]]} />
          <Row y={28} pixels={[[11,8,fl1]]} />
          <Row y={29} pixels={[[11,8,fl1]]} />
          <Row y={30} pixels={[[11,8,fl2]]} />
          <Row y={31} pixels={[[11,8,fl1]]} />
          <Row y={32} pixels={[[11,8,fl1]]} />
          <Row y={33} pixels={[[11,8,fl1]]} />
          {/* Flannel jacket — right side */}
          <Row y={24} pixels={[[29,8,fl1]]} />
          <Row y={25} pixels={[[29,8,fl1]]} />
          <Row y={26} pixels={[[29,8,fl1]]} />
          <Row y={27} pixels={[[29,8,fl2]]} />
          <Row y={28} pixels={[[29,8,fl1]]} />
          <Row y={29} pixels={[[29,8,fl1]]} />
          <Row y={30} pixels={[[29,8,fl2]]} />
          <Row y={31} pixels={[[29,8,fl1]]} />
          <Row y={32} pixels={[[29,8,fl1]]} />
          <Row y={33} pixels={[[29,8,fl1]]} />
          {/* Flannel horizontal stripes */}
          {[25,28,31].map(y => (
            <Row key={`fls${y}`} y={y} pixels={[[12,2,fl3,0.4],[14,1,flL,0.15],[17,1,flL,0.15],[30,2,fl3,0.4],[33,1,flL,0.15],[35,1,flL,0.15]]} />
          ))}
          {/* Flannel vertical lines */}
          {[14,17,32,35].map(x => (
            <rect key={`flv${x}`} x={x} y={24} width={1} height={10} fill={flL} opacity={0.1} />
          ))}
          {/* Flannel collar / lapel */}
          <Row y={24} pixels={[[18,1,fl3],[29,1,fl3]]} />
          <Row y={25} pixels={[[18,1,fl3],[29,1,fl3]]} />
          <Row y={26} pixels={[[18,1,fl3],[29,1,fl3]]} />
          {/* Shoulder highlights */}
          <Row y={24} pixels={[[12,2,fl3,0.5],[34,2,fl3,0.5]]} />

          {/* ═══════ ARMS ═══════ */}
          {isWaving ? (
            <>
              {/* Left arm down */}
              {[25,26,27,28,29,30,31,32].map(y => (
                <Row key={`la${y}`} y={y} pixels={[[8,3,fl1]]} />
              ))}
              <Row y={33} pixels={[[8,3,sk]]} />
              {/* Right arm up waving */}
              {[18,19,20,21,22,23,24,25].map(y => (
                <Row key={`ra${y}`} y={y} pixels={[[37,3,fl1]]} />
              ))}
              <Row y={17} pixels={[[37,3,sk]]} />
              <Row y={16} pixels={[[38,2,sk2]]} />
            </>
          ) : (
            <>
              {/* Left arm */}
              {[25,26,27,28,29,30,31,32].map(y => (
                <Row key={`la${y}`} y={y} pixels={[[8,3,fl1]]} />
              ))}
              <Row y={27} pixels={[[8,3,fl2]]} />
              <Row y={30} pixels={[[8,3,fl2]]} />
              <Row y={33} pixels={[[8,3,sk]]} />
              <Row y={34} pixels={[[9,2,sk2]]} />
              {/* Right arm */}
              {[25,26,27,28,29,30,31,32].map(y => (
                <Row key={`ra${y}`} y={y} pixels={[[37,3,fl1]]} />
              ))}
              <Row y={27} pixels={[[37,3,fl2]]} />
              <Row y={30} pixels={[[37,3,fl2]]} />
              <Row y={33} pixels={[[37,3,sk]]} />
              <Row y={34} pixels={[[37,2,sk2]]} />
            </>
          )}

          {/* ═══════ BELT ═══════ */}
          <Row y={34} pixels={[[11,26,bt]]} />
          <rect x={22} y={34} width={4} height={1} fill={bk} />
          <rect x={23} y={34} width={2} height={1} fill="#e8d090" opacity={0.4} />

          {/* ═══════ JEANS ═══════ */}
          <Row y={35} pixels={[[11,26,dn]]} />
          <Row y={36} pixels={[[11,26,dn]]} />
          <Row y={37} pixels={[[11,26,dn]]} />
          <Row y={38} pixels={[[11,26,dn]]} />
          {/* Left leg */}
          <Row y={39} pixels={[[11,12,dn]]} />
          <Row y={40} pixels={[[11,12,dn]]} />
          <Row y={41} pixels={[[12,11,dn]]} />
          <Row y={42} pixels={[[12,11,dn]]} />
          <Row y={43} pixels={[[12,11,dn]]} />
          {/* Right leg */}
          <Row y={39} pixels={[[25,12,dn]]} />
          <Row y={40} pixels={[[25,12,dn]]} />
          <Row y={41} pixels={[[25,11,dn]]} />
          <Row y={42} pixels={[[25,11,dn]]} />
          <Row y={43} pixels={[[25,11,dn]]} />
          {/* Seam */}
          <rect x={23} y={39} width={2} height={5} fill={dn2} />
          {/* Denim details */}
          <Row y={37} pixels={[[12,1,dn3,0.3],[35,1,dn3,0.3]]} />
          <Row y={40} pixels={[[13,1,dn2,0.4],[34,1,dn2,0.4]]} />

          {/* ═══════ BOOTS ═══════ */}
          {/* Left boot */}
          <Row y={44} pixels={[[11,12,bo1]]} />
          <Row y={45} pixels={[[11,12,bo2]]} />
          <Row y={46} pixels={[[11,12,bo2]]} />
          <Row y={47} pixels={[[10,14,bo2]]} />
          <Row y={48} pixels={[[10,14,bo3]]} />
          {/* Right boot */}
          <Row y={44} pixels={[[25,12,bo1]]} />
          <Row y={45} pixels={[[25,12,bo2]]} />
          <Row y={46} pixels={[[25,12,bo2]]} />
          <Row y={47} pixels={[[24,14,bo2]]} />
          <Row y={48} pixels={[[24,14,bo3]]} />
          {/* Boot laces */}
          <Row y={45} pixels={[[15,3,"#685848",0.4],[30,3,"#685848",0.4]]} />
          <Row y={47} pixels={[[15,3,"#685848",0.4],[30,3,"#685848",0.4]]} />

          {/* ═══════ HEADPHONES (listening) ═══════ */}
          {mood === "listening" && (
            <>
              <rect x={10} y={4} width={2} height={8} fill="#404040" />
              <rect x={36} y={4} width={2} height={8} fill="#404040" />
              <rect x={12} y={2} width={24} height={2} fill="#505050" />
              <rect x={8} y={11} width={3} height={4} fill="#353535" />
              <rect x={9} y={12} width={1} height={2} fill="#666" />
              <rect x={37} y={11} width={3} height={4} fill="#353535" />
              <rect x={38} y={12} width={1} height={2} fill="#666" />
            </>
          )}

          {/* ═══════ SPARKLES (excited) ═══════ */}
          {mood === "excited" && (
            <>
              <rect x={3} y={8} width={2} height={2} fill="hsl(var(--primary))" opacity={0.8} />
              <rect x={43} y={6} width={2} height={2} fill="hsl(var(--accent))" opacity={0.7} />
              <rect x={5} y={2} width={1} height={1} fill="hsl(var(--primary))" opacity={0.5} />
              <rect x={42} y={14} width={1} height={1} fill="hsl(var(--accent))" opacity={0.4} />
            </>
          )}
        </svg>
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
