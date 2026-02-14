import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type CharMood = "idle" | "happy" | "waving" | "typing" | "sleeping" | "excited" | "thinking" | "listening" | "shy";

interface PixelIndieCharacterProps {
  onLogin?: boolean;
  className?: string;
}

// pixel helper — each "pixel" is 1 unit in a 64×64 viewBox
const P = ({ x, y, w = 1, h = 1, fill, opacity }: { x: number; y: number; w?: number; h?: number; fill: string; opacity?: number }) => (
  <rect x={x} y={y} width={w} height={h} fill={fill} opacity={opacity} />
);

export const PixelIndieCharacter = ({ onLogin, className }: PixelIndieCharacterProps) => {
  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState<CharMood>("idle");
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [hearts, setHearts] = useState<number[]>([]);
  const [pets, setPets] = useState(0);
  const [breathPhase, setBreathPhase] = useState(0);
  const charRef = useRef<HTMLDivElement>(null);
  const lastClickTime = useRef<number>(0);

  // ── Palette ──
  const C = {
    // Hair — royal blue gradient
    hairDark: "#1a2f80",
    hair: "#2847b8",
    hairMid: "#3b5ee0",
    hairLight: "#5a7bff",
    hairShine: "#8eaaff",
    hairEdge: "#152470",
    // Skin
    skin: "#f5d4b0",
    skinShadow: "#e8b890",
    skinDark: "#d4a078",
    blush: "#f09890",
    // Eyes
    eyeWhite: "#ffffff",
    iris: "#2050c0",
    irisDark: "#183898",
    pupil: "#0a1030",
    eyeShine: "rgba(255,255,255,0.85)",
    eyeLash: "#182060",
    // Mouth
    mouth: "#c85860",
    mouthDark: "#a04048",
    teeth: "#fff8f0",
    // Clothes — indie flannel
    flannel1: "#b83830",    // red base
    flannel2: "#982828",    // red dark
    flannel3: "#d04838",    // red light
    flannelLine: "#282828", // grid lines
    // Undershirt
    tee: "#2a2a2a",
    teeLight: "#383838",
    // Jeans
    denim: "#3a4868",
    denimDark: "#2c3850",
    denimLight: "#485878",
    denimStitch: "#506888",
    // Accessories
    belt: "#4a3828",
    buckle: "#c8a858",
    buckleShine: "#e8d090",
    // Boots
    boot: "#5a4030",
    bootDark: "#483020",
    bootSole: "#302820",
    bootLace: "#887060",
    // Necklace / pendant
    chain: "#a09080",
    pendant: "#c8a858",
  } as const;

  const messages: Record<string, string[]> = {
    idle: ["...", "*mexe no cabelo*", "hmm", "*olha pro lado*", "yo", "oi ✌️", "*ajusta flanela*", "eae"],
    happy: ["hehe!", "valeu! ♡", "massa!", "top!", "*sorri*", "nice!", "uwu"],
    waving: ["oi! 👋", "bem-vindo!", "eae!", "bora codar!", "*acena*"],
    typing: ["digitando...", "hmm...", "*tec tec*", "quase lá..."],
    sleeping: ["zzz...", "*boceja*", "5 min...", "sono...", "*ronca*"],
    excited: ["LETS GO!! 🔥", "boa!!", "AEEEE!", "WOOO!", "logou! 🎉", "SIIIM!"],
    thinking: ["🤔 hmm", "pensando...", "deixa ver...", "será?...", "*coça a cabeça*"],
    listening: ["♪ vibe", "~chilling~", "boa playlist!", "♫♪", "*balança a cabeça*"],
    shy: ["ah...", "*fica vermelho*", "para heh...", "*esconde rosto*", "👉👈"],
  };

  const showMsg = useCallback((msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  }, []);

  const pickMsg = useCallback((category: string) => {
    const msgs = messages[category] || messages.idle;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, []);

  // ── Eye tracking ──
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!charRef.current) return;
      const rect = charRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.35;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const max = 1.2;
      setEyeOffset({
        x: Math.round(Math.max(-max, Math.min(max, (dx / dist) * max)) * 10) / 10,
        y: Math.round(Math.max(-0.8, Math.min(0.8, (dy / dist) * max * 0.5)) * 10) / 10,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  // ── Breathing ──
  useEffect(() => {
    if (mood === "sleeping") return;
    const interval = setInterval(() => setBreathPhase(p => (p + 1) % 60), 80);
    return () => clearInterval(interval);
  }, [mood]);

  // ── Blink ──
  useEffect(() => {
    if (mood === "sleeping") return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
    }, 2800 + Math.random() * 2200);
    return () => clearInterval(interval);
  }, [mood]);

  // ── Idle behavior ──
  useEffect(() => {
    if (mood !== "idle") return;
    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.12) {
        setMood("waving"); showMsg(pickMsg("waving"));
        setTimeout(() => setMood("idle"), 3000);
      } else if (rand < 0.22) {
        setMood("thinking"); showMsg(pickMsg("thinking"));
        setTimeout(() => setMood("idle"), 3500);
      } else if (rand < 0.30) {
        setMood("listening"); showMsg(pickMsg("listening"));
        setTimeout(() => setMood("idle"), 4000);
      } else if (rand < 0.40) {
        showMsg(pickMsg("idle"), 2500);
      }
    }, 5000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [mood, pickMsg, showMsg]);

  // ── Sleep after long idle ──
  useEffect(() => {
    if (mood === "idle") {
      const t = setTimeout(() => { setMood("sleeping"); showMsg(pickMsg("sleeping")); }, 35000);
      return () => clearTimeout(t);
    }
  }, [mood, pickMsg, showMsg]);

  // ── Wake up ──
  useEffect(() => {
    if (mood !== "sleeping") return;
    const t = setTimeout(() => { setMood("idle"); showMsg("*acorda* hm?"); }, 10000);
    return () => clearTimeout(t);
  }, [mood, showMsg]);

  // ── React to login ──
  useEffect(() => {
    if (onLogin) {
      setMood("excited"); showMsg(pickMsg("excited"));
      setTimeout(() => setMood("idle"), 4000);
    }
  }, [onLogin, pickMsg, showMsg]);

  // ── Click ──
  const handleClick = useCallback(() => {
    const now = Date.now();
    const isDouble = now - lastClickTime.current < 350;
    lastClickTime.current = now;

    if (isDouble) {
      setMood("shy"); showMsg(pickMsg("shy"));
      setTimeout(() => setMood("idle"), 3000);
      return;
    }

    setTimeout(() => {
      if (Date.now() - lastClickTime.current < 350) return;
      setPets(p => p + 1);
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
  const breathY = Math.sin(breathPhase * 0.1) * 0.3;

  // Waving arm offset for animation
  const waveArmY = isWaving ? Math.sin(Date.now() * 0.008) * 2 : 0;

  return (
    <div ref={charRef} className={cn("relative select-none", className)}>
      {/* Speech bubble */}
      {message && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 backdrop-blur-xl bg-card/95 border border-border rounded-xl px-3 py-2 shadow-lg animate-fade-in whitespace-nowrap z-10">
          <p className="text-[11px] font-mono text-foreground">{message}</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card/95 border-r border-b border-border rotate-45" />
        </div>
      )}

      {/* Hearts */}
      {hearts.map((id, i) => (
        <span key={id} className="absolute text-sm pointer-events-none z-20"
          style={{
            left: `${40 + (i % 3) * 20}px`, top: "-10px",
            animation: "float-up 2s ease-out forwards",
          }}>
          {["💙", "✨", "💙"][i % 3]}
        </span>
      ))}

      {/* Sleeping Zs */}
      {isSleeping && (
        <div className="absolute -top-10 right-0 flex gap-1.5">
          {[0, 0.4, 0.8].map((d, i) => (
            <span key={i} className="animate-float font-mono text-primary/40 font-bold"
              style={{ animationDelay: `${d}s`, fontSize: `${10 + i * 4}px` }}>z</span>
          ))}
        </div>
      )}

      {/* Thinking dots */}
      {isThinking && (
        <div className="absolute -top-8 right-0 flex gap-1.5">
          {[0, 0.2, 0.4].map((d, i) => (
            <span key={i} className="animate-float w-2 h-2 rounded-full bg-primary/30"
              style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      )}

      {/* Music notes */}
      {mood === "listening" && (
        <div className="absolute -top-8 left-6">
          <span className="animate-float text-primary/50 text-sm" style={{ animationDelay: "0s" }}>♪</span>
          <span className="animate-float text-accent/40 text-sm ml-4" style={{ animationDelay: "0.5s" }}>♫</span>
        </div>
      )}

      <div className={cn(
        "transition-transform duration-500",
        mood === "excited" && "animate-[bounce_0.5s_ease-in-out_infinite]",
        mood === "listening" && "animate-[bounce_1.2s_ease-in-out_infinite]",
      )}>
        <svg
          width="180" height="220" viewBox="0 0 64 70"
          className="image-rendering-pixelated cursor-pointer drop-shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
          onClick={handleClick}
          role="button"
          aria-label="Personagem indie interativo"
          style={{ imageRendering: "pixelated" }}
        >
          {/* Ground shadow */}
          <ellipse cx="32" cy="68" rx="16" ry="1.5" fill="hsl(var(--foreground) / 0.06)" />

          {/* ════════════ HAIR BACK LAYER ════════════ */}
          {/* Long flowing hair behind body */}
          <P x={13} y={6} w={38} h={3} fill={C.hairDark} />
          <P x={12} y={9} w={40} h={2} fill={C.hairDark} />
          {/* Right side cascade */}
          <P x={44} y={11} w={9} h={6} fill={C.hairDark} />
          <P x={45} y={17} w={8} h={8} fill={C.hairDark} />
          <P x={46} y={25} w={7} h={7} fill={C.hair} />
          <P x={47} y={32} w={6} h={6} fill={C.hairMid} />
          <P x={48} y={38} w={4} h={4} fill={C.hairMid} opacity={0.8} />
          <P x={49} y={42} w={3} h={3} fill={C.hairLight} opacity={0.5} />
          {/* Left side cascade */}
          <P x={11} y={11} w={5} h={6} fill={C.hairDark} />
          <P x={9} y={13} w={4} h={10} fill={C.hair} />
          <P x={8} y={17} w={3} h={8} fill={C.hairMid} />
          <P x={9} y={25} w={3} h={7} fill={C.hair} />
          <P x={10} y={32} w={2} h={5} fill={C.hairMid} opacity={0.7} />

          {/* ════════════ HEAD ════════════ */}
          {/* Main face block */}
          <P x={17} y={12} w={24} h={22} fill={C.skin} />
          <P x={19} y={10} w={20} h={2} fill={C.skin} />
          <P x={16} y={14} w={1} h={18} fill={C.skinShadow} />
          <P x={41} y={14} w={1} h={18} fill={C.skinShadow} />
          {/* Jaw */}
          <P x={18} y={34} w={22} h={1} fill={C.skinShadow} />
          <P x={20} y={35} w={18} h={1} fill={C.skinDark} />
          {/* Ear hints */}
          <P x={15} y={20} w={2} h={4} fill={C.skinShadow} />
          <P x={41} y={20} w={2} h={4} fill={C.skinShadow} />

          {/* ════════════ BLUSH ════════════ */}
          <P x={18} y={26} w={4} h={2} fill={C.blush} opacity={isHappy ? 0.6 : 0.15} />
          <P x={36} y={26} w={4} h={2} fill={C.blush} opacity={isHappy ? 0.6 : 0.15} />

          {/* ════════════ HAIR FRONT LAYER ════════════ */}
          {/* Top volume */}
          <P x={17} y={3} w={26} h={3} fill={C.hair} />
          <P x={19} y={1} w={22} h={2} fill={C.hairMid} />
          <P x={22} y={0} w={16} h={1} fill={C.hairLight} />
          {/* Main front hair */}
          <P x={14} y={6} w={32} h={6} fill={C.hair} />
          <P x={16} y={6} w={28} h={4} fill={C.hairMid} />
          <P x={18} y={6} w={24} h={2} fill={C.hairLight} />
          {/* Left bangs — sweeping */}
          <P x={15} y={12} w={10} h={5} fill={C.hair} />
          <P x={16} y={12} w={8} h={4} fill={C.hairMid} />
          <P x={17} y={12} w={6} h={3} fill={C.hairLight} />
          <P x={15} y={17} w={3} h={2} fill={C.hair} opacity={0.7} />
          {/* Right bangs */}
          <P x={35} y={12} w={7} h={4} fill={C.hair} />
          <P x={36} y={12} w={5} h={3} fill={C.hairMid} />
          <P x={37} y={12} w={3} h={2} fill={C.hairLight} />
          {/* Center part line */}
          <P x={27} y={10} w={4} h={2} fill={C.hairDark} />
          {/* Shine highlights */}
          <P x={21} y={3} w={4} h={1} fill={C.hairShine} opacity={0.6} />
          <P x={32} y={4} w={3} h={1} fill={C.hairShine} opacity={0.5} />
          <P x={18} y={7} w={2} h={1} fill={C.hairShine} opacity={0.4} />
          <P x={36} y={7} w={3} h={1} fill={C.hairShine} opacity={0.3} />
          {/* Ahoge / antenna strand */}
          <P x={28} y={-1} w={2} h={2} fill={C.hairLight} />
          <P x={29} y={-3} w={2} h={2} fill={C.hairMid} />
          <P x={30} y={-4} w={1} h={1} fill={C.hair} />

          {/* ════════════ EYES ════════════ */}
          {/* Eyebrows */}
          <P x={19} y={17} w={7} h={1} fill={C.hairEdge} opacity={0.6} />
          <P x={33} y={17} w={7} h={1} fill={C.hairEdge} opacity={0.6} />

          {!showEyes ? (
            // Closed / blink — cute line
            <>
              <P x={20} y={22} w={6} h={1} fill={C.iris} />
              <P x={19} y={21} w={1} h={1} fill={C.eyeLash} opacity={0.4} />
              <P x={26} y={21} w={1} h={1} fill={C.eyeLash} opacity={0.4} />
              <P x={33} y={22} w={6} h={1} fill={C.iris} />
              <P x={32} y={21} w={1} h={1} fill={C.eyeLash} opacity={0.4} />
              <P x={39} y={21} w={1} h={1} fill={C.eyeLash} opacity={0.4} />
            </>
          ) : isHappy ? (
            // Happy ∪ eyes
            <>
              {/* Left */}
              <P x={20} y={20} w={6} h={1} fill={C.iris} />
              <P x={19} y={21} w={1} h={2} fill={C.iris} />
              <P x={26} y={21} w={1} h={2} fill={C.iris} />
              <P x={20} y={23} w={6} h={1} fill={C.iris} opacity={0.3} />
              {/* Right */}
              <P x={33} y={20} w={6} h={1} fill={C.iris} />
              <P x={32} y={21} w={1} h={2} fill={C.iris} />
              <P x={39} y={21} w={1} h={2} fill={C.iris} />
              <P x={33} y={23} w={6} h={1} fill={C.iris} opacity={0.3} />
            </>
          ) : (
            // Normal eyes with mouse tracking
            <>
              {/* Left eye */}
              <P x={19 + eyeOffset.x} y={19 + eyeOffset.y} w={8} h={6} fill={C.eyeWhite} />
              <P x={21 + eyeOffset.x} y={20 + eyeOffset.y} w={5} h={4} fill={C.iris} />
              <P x={22 + eyeOffset.x} y={20 + eyeOffset.y} w={3} h={3} fill={C.irisDark} />
              <P x={23 + eyeOffset.x} y={21 + eyeOffset.y} w={2} h={2} fill={C.pupil} />
              {/* Shine */}
              <P x={24 + eyeOffset.x} y={20 + eyeOffset.y} w={1} h={1} fill={C.eyeShine} />
              <P x={21 + eyeOffset.x} y={23 + eyeOffset.y} w={1} h={1} fill={C.eyeShine} opacity={0.4} />
              {/* Lashes */}
              <P x={19} y={19} w={1} h={1} fill={C.eyeLash} opacity={0.5} />
              <P x={26} y={19} w={1} h={1} fill={C.eyeLash} opacity={0.5} />

              {/* Right eye */}
              <P x={32 + eyeOffset.x} y={19 + eyeOffset.y} w={8} h={6} fill={C.eyeWhite} />
              <P x={34 + eyeOffset.x} y={20 + eyeOffset.y} w={5} h={4} fill={C.iris} />
              <P x={35 + eyeOffset.x} y={20 + eyeOffset.y} w={3} h={3} fill={C.irisDark} />
              <P x={36 + eyeOffset.x} y={21 + eyeOffset.y} w={2} h={2} fill={C.pupil} />
              {/* Shine */}
              <P x={37 + eyeOffset.x} y={20 + eyeOffset.y} w={1} h={1} fill={C.eyeShine} />
              <P x={34 + eyeOffset.x} y={23 + eyeOffset.y} w={1} h={1} fill={C.eyeShine} opacity={0.4} />
              {/* Lashes */}
              <P x={32} y={19} w={1} h={1} fill={C.eyeLash} opacity={0.5} />
              <P x={39} y={19} w={1} h={1} fill={C.eyeLash} opacity={0.5} />
            </>
          )}

          {/* ════════════ NOSE ════════════ */}
          <P x={28} y={27} w={3} h={2} fill={C.skinShadow} />
          <P x={29} y={28} w={1} h={1} fill={C.skinDark} opacity={0.4} />

          {/* ════════════ MOUTH ════════════ */}
          {isHappy ? (
            <>
              <P x={26} y={30} w={1} h={1} fill={C.mouth} opacity={0.5} />
              <P x={27} y={31} w={6} h={1} fill={C.mouth} />
              <P x={28} y={32} w={4} h={1} fill={C.mouthDark} opacity={0.5} />
              <P x={33} y={30} w={1} h={1} fill={C.mouth} opacity={0.5} />
              {/* Teeth hint */}
              <P x={28} y={31} w={4} h={1} fill={C.teeth} opacity={0.3} />
            </>
          ) : isSleeping ? (
            <>
              <P x={28} y={31} w={4} h={1} fill={C.mouth} opacity={0.3} />
              {/* Drool */}
              <P x={32} y={32} w={1} h={2} fill={C.eyeWhite} opacity={0.3} />
            </>
          ) : (
            <P x={27} y={31} w={5} h={1} fill={C.mouth} opacity={0.6} />
          )}

          {/* ════════════ NECK ════════════ */}
          <P x={25} y={35} w={10} h={3} fill={C.skin} />
          <P x={25} y={35} w={1} h={3} fill={C.skinShadow} opacity={0.3} />

          {/* ════════════ NECKLACE ════════════ */}
          <P x={27} y={37} w={6} h={1} fill={C.chain} opacity={0.6} />
          <P x={29} y={38} w={2} h={1} fill={C.pendant} />
          <P x={29} y={38} w={1} h={1} fill={C.buckleShine} opacity={0.4} />

          {/* ════════════ BODY ════════════ */}
          {/* Undershirt / tee visible at collar */}
          <P x={26} y={38} w={8} h={4} fill={C.tee} />
          <P x={27} y={38} w={6} h={2} fill={C.teeLight} />

          {/* Flannel shirt */}
          <P x={15} y={38} w={11} h={16} fill={C.flannel1} />
          <P x={34} y={38} w={11} h={16} fill={C.flannel1} />
          <P x={17} y={37} w={8} h={1} fill={C.flannel1} />
          <P x={35} y={37} w={8} h={1} fill={C.flannel1} />
          {/* Flannel — horizontal stripes */}
          <P x={15} y={41} w={11} h={1} fill={C.flannel2} />
          <P x={34} y={41} w={11} h={1} fill={C.flannel2} />
          <P x={15} y={45} w={11} h={1} fill={C.flannel2} />
          <P x={34} y={45} w={11} h={1} fill={C.flannel2} />
          <P x={15} y={49} w={11} h={1} fill={C.flannel2} />
          <P x={34} y={49} w={11} h={1} fill={C.flannel2} />
          {/* Flannel — vertical lines */}
          <P x={19} y={38} w={1} h={16} fill={C.flannelLine} opacity={0.12} />
          <P x={23} y={38} w={1} h={16} fill={C.flannelLine} opacity={0.12} />
          <P x={38} y={38} w={1} h={16} fill={C.flannelLine} opacity={0.12} />
          <P x={42} y={38} w={1} h={16} fill={C.flannelLine} opacity={0.12} />
          {/* Light accents on shoulders */}
          <P x={16} y={38} w={3} h={1} fill={C.flannel3} opacity={0.5} />
          <P x={41} y={38} w={3} h={1} fill={C.flannel3} opacity={0.5} />
          {/* Open front showing tee */}
          <P x={26} y={42} w={8} h={12} fill={C.tee} />
          <P x={25} y={38} w={1} h={16} fill={C.flannel3} />
          <P x={34} y={38} w={1} h={16} fill={C.flannel3} />
          {/* Tee graphic — tiny star/logo */}
          <P x={29} y={44} w={2} h={2} fill={C.hairMid} opacity={0.4} />
          <P x={28} y={45} w={1} h={1} fill={C.hairLight} opacity={0.2} />
          <P x={31} y={45} w={1} h={1} fill={C.hairLight} opacity={0.2} />

          {/* ════════════ ARMS ════════════ */}
          {isWaving ? (
            <>
              {/* Left arm — down */}
              <P x={9} y={40} w={6} h={12} fill={C.flannel1} />
              <P x={9} y={41} w={6} h={1} fill={C.flannel2} />
              <P x={9} y={45} w={6} h={1} fill={C.flannel2} />
              <P x={9} y={52} w={6} h={2} fill={C.skin} />
              <P x={10} y={53} w={4} h={1} fill={C.skinShadow} />
              {/* Right arm — waving up */}
              <P x={45} y={28} w={6} h={10} fill={C.flannel1} />
              <P x={45} y={30} w={6} h={1} fill={C.flannel2} />
              <P x={45} y={34} w={6} h={1} fill={C.flannel2} />
              <P x={45} y={25} w={6} h={3} fill={C.skin} />
              <P x={46} y={24} w={4} h={1} fill={C.skinShadow} />
            </>
          ) : (
            <>
              {/* Left arm */}
              <P x={9} y={40} w={6} h={12} fill={C.flannel1} />
              <P x={9} y={41} w={6} h={1} fill={C.flannel2} />
              <P x={9} y={45} w={6} h={1} fill={C.flannel2} />
              <P x={9} y={49} w={6} h={1} fill={C.flannel2} />
              <P x={9} y={52} w={6} h={2} fill={C.skin} />
              <P x={10} y={53} w={4} h={1} fill={C.skinShadow} />
              {/* Right arm */}
              <P x={45} y={40} w={6} h={12} fill={C.flannel1} />
              <P x={45} y={41} w={6} h={1} fill={C.flannel2} />
              <P x={45} y={45} w={6} h={1} fill={C.flannel2} />
              <P x={45} y={49} w={6} h={1} fill={C.flannel2} />
              <P x={45} y={52} w={6} h={2} fill={C.skin} />
              <P x={46} y={53} w={4} h={1} fill={C.skinShadow} />
            </>
          )}

          {/* ════════════ BELT ════════════ */}
          <P x={15} y={54} w={30} h={2} fill={C.belt} />
          <P x={28} y={54} w={4} h={2} fill={C.buckle} />
          <P x={29} y={54} w={2} h={1} fill={C.buckleShine} opacity={0.5} />

          {/* ════════════ JEANS ════════════ */}
          <P x={15} y={56} w={30} h={4} fill={C.denim} />
          {/* Left leg */}
          <P x={15} y={60} w={13} h={4} fill={C.denim} />
          <P x={16} y={60} w={11} h={1} fill={C.denimLight} opacity={0.3} />
          {/* Right leg */}
          <P x={32} y={60} w={13} h={4} fill={C.denim} />
          <P x={33} y={60} w={11} h={1} fill={C.denimLight} opacity={0.3} />
          {/* Center seam */}
          <P x={29} y={58} w={2} h={6} fill={C.denimDark} />
          {/* Stitching details */}
          <P x={17} y={62} w={1} h={1} fill={C.denimStitch} opacity={0.3} />
          <P x={42} y={62} w={1} h={1} fill={C.denimStitch} opacity={0.3} />

          {/* ════════════ BOOTS ════════════ */}
          {/* Left boot */}
          <P x={14} y={64} w={14} h={2} fill={C.bootDark} />
          <P x={14} y={66} w={14} h={2} fill={C.boot} />
          <P x={13} y={68} w={16} h={1} fill={C.bootSole} />
          <P x={19} y={66} w={4} h={1} fill={C.bootLace} opacity={0.5} />
          {/* Right boot */}
          <P x={32} y={64} w={14} h={2} fill={C.bootDark} />
          <P x={32} y={66} w={14} h={2} fill={C.boot} />
          <P x={31} y={68} w={16} h={1} fill={C.bootSole} />
          <P x={39} y={66} w={4} h={1} fill={C.bootLace} opacity={0.5} />

          {/* ════════════ ACCESSORIES ════════════ */}
          {/* Headphones when listening */}
          {mood === "listening" && (
            <>
              <P x={14} y={6} w={2} h={8} fill="#404040" />
              <P x={44} y={6} w={2} h={8} fill="#404040" />
              <P x={16} y={4} w={28} h={2} fill="#505050" />
              <P x={12} y={13} w={3} h={5} fill="#353535" />
              <P x={13} y={14} w={1} h={3} fill="#666" />
              <P x={45} y={13} w={3} h={5} fill="#353535" />
              <P x={46} y={14} w={1} h={3} fill="#666" />
            </>
          )}

          {/* Sparkles when excited */}
          {mood === "excited" && (
            <>
              <P x={4} y={10} w={2} h={2} fill="hsl(var(--primary))" opacity={0.8} />
              <P x={56} y={8} w={2} h={2} fill="hsl(var(--accent))" opacity={0.7} />
              <P x={6} y={4} w={1} h={1} fill="hsl(var(--primary))" opacity={0.5} />
              <P x={54} y={14} w={1} h={1} fill="hsl(var(--accent))" opacity={0.5} />
              <P x={2} y={20} w={1} h={1} fill="hsl(var(--primary))" opacity={0.4} />
              <P x={58} y={22} w={1} h={1} fill="hsl(var(--accent))" opacity={0.4} />
            </>
          )}
        </svg>
      </div>

      {/* CSS for heart float animation */}
      <style>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(1.3); }
        }
      `}</style>
    </div>
  );
};
