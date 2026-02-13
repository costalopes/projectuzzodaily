import { useEffect, useState, useCallback, useRef } from "react";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CatMood = "idle" | "happy" | "purring" | "sleeping" | "coding" | "excited" | "belly" | "scratching" | "stretching"
  | "listening" | "thirsty" | "hydrated" | "caffeinated" | "focused" | "alert";

export interface CatEvent {
  type: "task_complete" | "music_play" | "music_stop" | "water_low" | "water_full" | "water_add" | "coffee_add" | "coffee_excess"
    | "pomodoro_end" | "pomodoro_start" | "urgent_overdue";
  timestamp: number;
}

interface CatProps {
  onTaskComplete?: boolean;
  lastEvent?: CatEvent | null;
}

const CAT_COLORS: { name: string; fur1: string; fur2: string; fur3: string; stripe: string; belly: string; eye: string }[] = [
  { name: "Laranja", fur1: "#e8a050", fur2: "#d08838", fur3: "#f0c080", stripe: "#c07028", belly: "#f8e0c0", eye: "#2a6040" },
  { name: "Cinza", fur1: "#8a8a9a", fur2: "#6a6a7a", fur3: "#a8a8b8", stripe: "#5a5a6a", belly: "#c8c8d8", eye: "#c89020" },
  { name: "Preto", fur1: "#3a3a4a", fur2: "#2a2a3a", fur3: "#5a5a6a", stripe: "#1a1a2a", belly: "#6a6a7a", eye: "#e0c040" },
  { name: "Branco", fur1: "#e8e8f0", fur2: "#d0d0d8", fur3: "#f5f5ff", stripe: "#c0c0c8", belly: "#ffffff", eye: "#4080c0" },
  { name: "Malhado", fur1: "#c88040", fur2: "#a06828", fur3: "#e8b880", stripe: "#303030", belly: "#f0d8b8", eye: "#308050" },
  { name: "Siamês", fur1: "#f0e0d0", fur2: "#d8c8b8", fur3: "#f8f0e8", stripe: "#8a6a50", belly: "#faf0e8", eye: "#4070b0" },
];

export const PixelCatCorner = ({ onTaskComplete, lastEvent }: CatProps) => {
  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState<CatMood>("coding");
  const [pets, setPets] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const catRef = useRef<HTMLDivElement>(null);
  const [isKneading, setIsKneading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [catName, setCatName] = useState(() => localStorage.getItem("cat-name") || "Miau");
  const [colorIdx, setColorIdx] = useState(() => {
    const saved = localStorage.getItem("cat-color");
    return saved ? parseInt(saved) : 0;
  });
  const lastEventRef = useRef<number>(0);

  const saveName = (n: string) => { setCatName(n); localStorage.setItem("cat-name", n); };
  const saveColor = (i: number) => { setColorIdx(i); localStorage.setItem("cat-color", String(i)); };

  const showMsg = useCallback((msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  }, []);

  const allMessages: Record<string, string[]> = {
    idle: ["miau~", "...", "*estica*", "*boceja*", "meow?", "*olha pela janela*", "hmm...", "*rola no chão*", "*limpa a patinha*", "preguiça...", "tô de boa", "*derruba o copo*", "cadê o laser?"],
    happy: ["nyaa~", "purrrr!", "*ronrona*", "mrrp!", "mais carinho!", "isso mesmo!", "*fecha os olhos*", "tão bom...", "*esfrega no braço*", "continua!", "adoro!", "*faz biscuit*"],
    purring: ["purrrrrr...", "*amassa pãozinho*", "tão quentinho...", "*ronrona alto*", "não para...", "vida boa...", "*derrete*"],
    sleeping: ["zzz...", "*sonha com peixe*", "mrrrm...", "*mexe a patinha*", "...atum...", "zzZzz...", "*ronca*"],
    coding: [
      "git push", "npm run dev", "// TODO: dormir", "console.log('miau')", "bug?", "LGTM!", "refactor time",
      "café + código", "deploy friday?", "tá compilando...", "testes passando!", "clean code", "feature pronta!",
      "funciona na minha máquina", "TypeScript!", "ship it! 🚀", "200 OK ✓", "dark mode > light mode",
      `${catName} approved ✓`, `sudo ${catName}`, "zero warnings!", "bora pra produção?",
    ],
    excited: ["MIAU!!", "WOOO!", "*pula*", "incrível!!", "mandou bem!", "boa!!", "*faz dancinha*", "isso aí!!", "perfeito!", "que orgulho!!", "SHIP IT!! 🚀"],
    belly: ["*mostra a barriga*", "coça aqui!", "confia...", "*rola pro lado*", "barriguinha!"],
    scratching: ["*coça o nariz*", "*coça atrás da orelha*", "*esfrega o focinho*", "tava coçando!"],
    stretching: ["*esticaaaa*", "*alongamento máximo*", "*estica as patinhas*", "ahhhh que bom"],
    // New reaction messages
    listening: ["♪ boa música!", "♫ *balança a cabeça*", "♪ gosto disso!", "~vibing~", "♫ nice beat", "*mexe a orelha*", "lofi mood ♪"],
    thirsty: ["tô com sede!", "beba água, humano!", "💧 cadê a água?", "*olha pro copo vazio*", "hidratação é vida!", "miau... sede..."],
    hydrated: ["boa! hidratado! 💧", "meta da água! 🎉", "*aprovação*", "isso aí! água é vida!"],
    caffeinated: ["café! ☕", "*cheira o café*", "hmm café...", "mais café!", "☕ bom demais"],
    focused: ["foco total! 🍅", "*concentrado*", "bora produzir!", "modo foco ON", "shh... focando"],
    alert: ["⚠️ tarefa urgente!", "ei! tarefa atrasada!", "não esquece!", "humano, olha isso!", "URGENTE!! 🚨", "*pula preocupado*"],
  };

  const pickMsg = useCallback((category: string) => {
    const msgs = allMessages[category] || allMessages.coding;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, [catName]);

  // Handle events from other components
  useEffect(() => {
    if (!lastEvent || lastEvent.timestamp === lastEventRef.current) return;
    lastEventRef.current = lastEvent.timestamp;

    switch (lastEvent.type) {
      case "music_play":
        setMood("listening");
        showMsg(pickMsg("listening"));
        setTimeout(() => setMood("coding"), 5000);
        break;
      case "music_stop":
        showMsg("♪ acabou a música...");
        break;
      case "water_low":
        setMood("thirsty");
        showMsg(pickMsg("thirsty"), 4000);
        setTimeout(() => setMood("coding"), 5000);
        break;
      case "water_full":
        setMood("excited");
        showMsg(pickMsg("hydrated"));
        setTimeout(() => setMood("coding"), 4000);
        break;
      case "water_add":
        showMsg("💧 +250ml!");
        break;
      case "coffee_add":
        setMood("happy");
        showMsg(pickMsg("caffeinated"));
        setTimeout(() => setMood("coding"), 3000);
        break;
      case "coffee_excess":
        showMsg("calma no café! 😰");
        break;
      case "pomodoro_start":
        setMood("focused");
        showMsg(pickMsg("focused"));
        setTimeout(() => setMood("coding"), 4000);
        break;
      case "pomodoro_end":
        setMood("excited");
        showMsg("🍅 timer acabou!");
        setTimeout(() => setMood("coding"), 4000);
        break;
      case "task_complete":
        setMood("excited");
        showMsg(pickMsg("excited"));
        setTimeout(() => setMood("coding"), 4000);
        break;
      case "urgent_overdue":
        setMood("alert");
        showMsg(pickMsg("alert"), 5000);
        setTimeout(() => setMood("coding"), 6000);
        break;
    }
  }, [lastEvent, pickMsg, showMsg]);

  // Legacy onTaskComplete support
  useEffect(() => {
    if (onTaskComplete) {
      setMood("excited");
      showMsg(pickMsg("excited"));
      setTimeout(() => setMood("coding"), 4000);
    }
  }, [onTaskComplete, pickMsg, showMsg]);

  // Eye tracking
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!catRef.current) return;
      const rect = catRef.current.getBoundingClientRect();
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
    }, 2000 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, [mood]);

  // Idle → sleeping
  useEffect(() => {
    if (mood === "idle") {
      const timeout = setTimeout(() => setMood("sleeping"), 25000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

  // Purring / happy timeouts
  useEffect(() => {
    if (mood === "purring") {
      setIsKneading(true);
      const timeout = setTimeout(() => { setMood("coding"); setIsKneading(false); }, 6000);
      return () => { clearTimeout(timeout); setIsKneading(false); };
    }
    if (mood === "happy") {
      const timeout = setTimeout(() => setMood("coding"), 4000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

  const handleAnimationEnd = useCallback(() => {
    if (mood === "belly" || mood === "scratching" || mood === "stretching") {
      setMood("coding");
    }
  }, [mood]);

  // Random spontaneous actions during coding
  useEffect(() => {
    if (mood !== "coding") return;
    const doRandomAction = () => {
      const rand = Math.random();
      if (rand < 0.15) {
        setMood("belly");
        showMsg(pickMsg("belly"));
      } else if (rand < 0.30) {
        setMood("scratching");
        showMsg(pickMsg("scratching"));
      } else if (rand < 0.45) {
        setMood("stretching");
        showMsg(pickMsg("stretching"));
      } else {
        showMsg(pickMsg("coding"), 4000);
      }
    };
    const interval = setInterval(doRandomAction, 8000 + Math.random() * 6000);
    return () => clearInterval(interval);
  }, [mood, catName, pickMsg, showMsg]);

  const handlePet = useCallback(() => {
    if (showSettings) return;
    const newPets = pets + 1;
    setPets(newPets);
    const newMood = newPets % 5 === 0 ? "purring" : "happy";
    setMood(newMood);
    showMsg(pickMsg(newMood));
    const heartId = Date.now();
    setHearts((h) => [...h, heartId]);
    setTimeout(() => setHearts((h) => h.filter((id) => id !== heartId)), 2000);
  }, [pets, showSettings, pickMsg, showMsg]);

  const c = CAT_COLORS[colorIdx];
  const earInner = "#f0a0a0";
  const nose = "#e07080";
  const pawPad = "#e89098";
  const collar = "hsl(var(--primary))";
  const bell = "hsl(var(--accent))";
  const eyeColor = c.eye;

  const showEyes = mood !== "sleeping" && !blink;
  const isHappy = mood === "happy" || mood === "purring" || mood === "excited" || mood === "belly" || mood === "listening" || mood === "hydrated";
  const isBelly = mood === "belly";
  const isScratching = mood === "scratching";
  const isStretching = mood === "stretching";
  const isAlert = mood === "alert" || mood === "thirsty";

  return (
    <div ref={catRef} className="fixed bottom-4 right-4 z-50 select-none group">
      {/* Speech bubble */}
      {message && !showSettings && (
        <div className={cn(
          "absolute -top-12 right-0 backdrop-blur-xl border rounded-xl px-3 py-2 shadow-lg animate-fade-in whitespace-nowrap max-w-[200px]",
          isAlert ? "bg-destructive/10 border-destructive/30" : "bg-card/95 border-border"
        )}>
          <p className={cn("text-[10px] font-mono truncate", isAlert ? "text-destructive" : "text-foreground")}>{message}</p>
          <div className={cn("absolute -bottom-1 right-8 w-2 h-2 border-r border-b rotate-45", isAlert ? "bg-destructive/10 border-destructive/30" : "bg-card/95 border-border")} />
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 shadow-xl animate-fade-in w-56">
          <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">// cat.config</h4>
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-mono text-muted-foreground/60 block mb-1">name:</label>
              <input value={catName} onChange={(e) => saveName(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" maxLength={12} />
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground/60 block mb-1.5">color:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {CAT_COLORS.map((color, i) => (
                  <button key={i} onClick={() => saveColor(i)}
                    className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-mono transition-all border",
                      colorIdx === i ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:bg-muted/40")}>
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color.fur1 }} />
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hearts */}
      {hearts.map((id, i) => (
        <span key={id} className="absolute text-sm animate-heart-float pointer-events-none"
          style={{ left: `${(i % 5) * 16}px`, top: "-8px" }}>
          {["♡", "✦", "♡", "⋆", "♡"][i % 5]}
        </span>
      ))}

      {/* Sleeping Zs */}
      {mood === "sleeping" && (
        <div className="absolute -top-10 right-2 flex gap-1.5">
          {[0, 0.4, 0.8].map((d, i) => (
            <span key={i} className="animate-float font-mono text-muted-foreground/50"
              style={{ animationDelay: `${d}s`, fontSize: `${9 + i * 3}px` }}>z</span>
          ))}
        </div>
      )}

      {/* Alert indicator */}
      {isAlert && (
        <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-destructive/80 animate-pulse flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">!</span>
        </div>
      )}

      <div
        className={cn(
          "transition-transform duration-500 ease-in-out",
          mood === "sleeping" ? "" : "animate-breathe",
          isBelly && "animate-belly-roll",
          isStretching && "animate-cat-stretch",
          isScratching && "animate-cat-scratch",
          isAlert && "animate-[shake_0.5s_ease-in-out_infinite]",
          mood === "listening" && "animate-[bounce_1s_ease-in-out_infinite]"
        )}
        onAnimationEnd={(e) => {
          if (e.currentTarget === e.target) handleAnimationEnd();
        }}
      >
        <svg width="120" height="108" viewBox="0 0 44 40"
          className="image-rendering-pixelated cursor-pointer drop-shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95"
          onClick={handlePet} role="button" aria-label={`Acariciar ${catName}`}>

          <ellipse cx="20" cy="38" rx="15" ry="2" fill="hsl(var(--foreground) / 0.04)" />

          {/* Tail */}
          <g className={isHappy ? "animate-tail-fast" : "animate-tail"}>
            <rect x="30" y="24" width="1" height="1" fill={c.fur2} />
            <rect x="31" y="23" width="1" height="1" fill={c.fur1} />
            <rect x="32" y="22" width="1" height="1" fill={c.fur1} />
            <rect x="33" y="21" width="2" height="1" fill={c.fur1} />
            <rect x="34" y="20" width="2" height="1" fill={c.stripe} />
            <rect x="35" y="19" width="2" height="1" fill={c.fur2} />
            <rect x="36" y="18" width="1" height="1" fill={c.stripe} />
            <rect x="37" y="17" width="1" height="1" fill={c.fur1} />
          </g>

          {/* Body */}
          <rect x="7" y="21" width="25" height="11" fill={c.fur1} />
          <rect x="8" y="20" width="23" height="1" fill={c.fur2} />
          <rect x="9" y="23" width="3" height="1" fill={c.stripe} />
          <rect x="10" y="25" width="2" height="1" fill={c.stripe} />
          <rect x="26" y="23" width="3" height="1" fill={c.stripe} />
          <rect x="27" y="25" width="2" height="1" fill={c.stripe} />
          <rect x="13" y="22" width="13" height="9" fill={c.belly} />

          {/* Collar */}
          <rect x="9" y="19" width="21" height="2" fill={collar} />
          <rect x="18" y="20" width="3" height="2" fill={bell} />
          <rect x="19" y="20" width="1" height="1" fill="white" opacity="0.4" />

          {/* Left ear */}
          <g className={mood === "listening" ? "animate-ear-twitch" : "animate-ear-twitch"}>
            <rect x="6" y="1" width="1" height="1" fill={c.fur2} />
            <rect x="7" y="0" width="4" height="1" fill={c.fur2} />
            <rect x="5" y="2" width="1" height="4" fill={c.fur2} />
            <rect x="6" y="2" width="1" height="3" fill={c.fur1} />
            <rect x="7" y="1" width="3" height="2" fill={c.fur1} />
            <rect x="7" y="2" width="2" height="2" fill={earInner} />
          </g>
          {/* Right ear */}
          <rect x="27" y="1" width="1" height="1" fill={c.fur2} />
          <rect x="28" y="0" width="4" height="1" fill={c.fur2} />
          <rect x="32" y="2" width="1" height="4" fill={c.fur2} />
          <rect x="31" y="2" width="1" height="3" fill={c.fur1} />
          <rect x="28" y="1" width="3" height="2" fill={c.fur1} />
          <rect x="29" y="2" width="2" height="2" fill={earInner} />

          {/* Head */}
          <rect x="6" y="6" width="27" height="2" fill={c.fur2} />
          <rect x="5" y="8" width="29" height="11" fill={c.fur1} />
          <rect x="6" y="7" width="25" height="1" fill={c.fur1} />
          <rect x="15" y="7" width="1" height="1" fill={c.stripe} />
          <rect x="16" y="6" width="1" height="2" fill={c.stripe} />
          <rect x="17" y="7" width="3" height="1" fill={c.stripe} />
          <rect x="20" y="6" width="1" height="2" fill={c.stripe} />
          <rect x="21" y="7" width="1" height="1" fill={c.stripe} />
          <rect x="6" y="14" width="6" height="4" fill={c.fur3} />
          <rect x="27" y="14" width="6" height="4" fill={c.fur3} />

          {/* Eyes */}
          {!showEyes ? (
            <>
              <rect x="10" y="12" width="6" height="1" fill={eyeColor} />
              <rect x="22" y="12" width="6" height="1" fill={eyeColor} />
            </>
          ) : isHappy ? (
            <>
              <rect x="10" y="11" width="6" height="1" fill={eyeColor} />
              <rect x="10" y="12" width="1" height="2" fill={eyeColor} />
              <rect x="15" y="12" width="1" height="2" fill={eyeColor} />
              <rect x="22" y="11" width="6" height="1" fill={eyeColor} />
              <rect x="22" y="12" width="1" height="2" fill={eyeColor} />
              <rect x="27" y="12" width="1" height="2" fill={eyeColor} />
            </>
          ) : (
            <>
              <rect x={10 + eyeOffset.x} y={10 + eyeOffset.y} width="6" height="5" fill={eyeColor} />
              <rect x={11 + eyeOffset.x} y={10 + eyeOffset.y} width="3" height="2" fill="white" />
              <rect x={14 + eyeOffset.x} y={13 + eyeOffset.y} width="1" height="1" fill="white" opacity="0.4" />
              <rect x={22 + eyeOffset.x} y={10 + eyeOffset.y} width="6" height="5" fill={eyeColor} />
              <rect x={23 + eyeOffset.x} y={10 + eyeOffset.y} width="3" height="2" fill="white" />
              <rect x={26 + eyeOffset.x} y={13 + eyeOffset.y} width="1" height="1" fill="white" opacity="0.4" />
            </>
          )}

          {/* Nose & mouth */}
          <rect x="17" y="15" width="4" height="2" fill={nose} />
          <rect x="18" y="15" width="2" height="1" fill="#f0909a" />
          <rect x="16" y="17" width="1" height="1" fill={c.fur2} />
          <rect x="21" y="17" width="1" height="1" fill={c.fur2} />
          {isHappy && <rect x="17" y="17" width="4" height="1" fill={nose} opacity="0.5" />}

          {/* Whiskers */}
          <rect x="1" y="13" width="8" height="1" fill={c.fur3} opacity="0.5" />
          <rect x="0" y="15" width="8" height="1" fill={c.fur3} opacity="0.5" />
          <rect x="2" y="17" width="7" height="1" fill={c.fur3} opacity="0.4" />
          <rect x="30" y="13" width="8" height="1" fill={c.fur3} opacity="0.5" />
          <rect x="31" y="15" width="8" height="1" fill={c.fur3} opacity="0.5" />
          <rect x="30" y="17" width="7" height="1" fill={c.fur3} opacity="0.4" />

          {/* Front paws */}
          {isScratching ? (
            <>
              <g className="animate-scratch-paw">
                <rect x="12" y="18" width="3" height="3" fill={c.fur1} />
                <rect x="13" y="17" width="2" height="1" fill={c.fur3} />
                <rect x="13" y="21" width="1" height="1" fill={pawPad} />
              </g>
              <rect x="25" y="32" width="7" height="4" fill={c.fur1} />
              <rect x="26" y="35" width="5" height="1" fill={c.fur3} />
              <rect x="27" y="34" width="1" height="1" fill={pawPad} />
              <rect x="29" y="34" width="1" height="1" fill={pawPad} />
            </>
          ) : isBelly ? (
            <>
              <g className="animate-belly-paws">
                <rect x="9" y="26" width="5" height="3" fill={c.fur1} />
                <rect x="10" y="25" width="3" height="1" fill={c.fur3} />
                <rect x="10" y="29" width="1" height="1" fill={pawPad} />
                <rect x="12" y="29" width="1" height="1" fill={pawPad} />
              </g>
              <g className="animate-belly-paws" style={{ animationDelay: "0.3s" }}>
                <rect x="25" y="26" width="5" height="3" fill={c.fur1} />
                <rect x="26" y="25" width="3" height="1" fill={c.fur3} />
                <rect x="26" y="29" width="1" height="1" fill={pawPad} />
                <rect x="28" y="29" width="1" height="1" fill={pawPad} />
              </g>
            </>
          ) : (
            <>
              <g className={isKneading ? "animate-knead-l" : ""}>
                <rect x="7" y="32" width="7" height="4" fill={c.fur1} />
                <rect x="8" y="35" width="5" height="1" fill={c.fur3} />
                <rect x="9" y="34" width="1" height="1" fill={pawPad} />
                <rect x="11" y="34" width="1" height="1" fill={pawPad} />
              </g>
              <g className={isKneading ? "animate-knead-r" : ""}>
                <rect x="25" y="32" width="7" height="4" fill={c.fur1} />
                <rect x="26" y="35" width="5" height="1" fill={c.fur3} />
                <rect x="27" y="34" width="1" height="1" fill={pawPad} />
                <rect x="29" y="34" width="1" height="1" fill={pawPad} />
              </g>
            </>
          )}

          {/* Coding laptop */}
          {(mood === "coding" || mood === "focused") && (
            <>
              <rect x="14" y="30" width="11" height="2" fill="#444" />
              <rect x="13" y="32" width="13" height="1" fill="#555" />
              <rect x="15" y="27" width="9" height="3" fill="#222" />
              <rect x="16" y="27" width="1" height="1" fill="#6f6" opacity="0.9" />
              <rect x="18" y="27" width="3" height="1" fill="#ff9" opacity="0.7" />
              <rect x="16" y="28" width="4" height="1" fill="#9cf" opacity="0.7" />
              <rect x="21" y="28" width="2" height="1" fill="#f9c" opacity="0.6" />
              <rect x="17" y="29" width="5" height="1" fill="#6f6" opacity="0.5" />
            </>
          )}

          {/* Music notes when listening */}
          {mood === "listening" && (
            <>
              <rect x="2" y="3" width="2" height="2" fill="hsl(var(--primary))" opacity="0.6" className="animate-float" />
              <rect x="36" y="5" width="2" height="2" fill="hsl(var(--accent))" opacity="0.5" className="animate-float" style={{ animationDelay: "0.3s" }} />
              <rect x="5" y="7" width="1" height="1" fill="hsl(var(--primary))" opacity="0.4" className="animate-float" style={{ animationDelay: "0.6s" }} />
            </>
          )}

          {mood === "excited" && (
            <>
              <rect x="2" y="5" width="2" height="2" fill="hsl(var(--accent))" opacity="0.8" />
              <rect x="36" y="3" width="2" height="2" fill="hsl(var(--accent))" opacity="0.6" />
              <rect x="5" y="0" width="1" height="1" fill="hsl(var(--primary))" opacity="0.7" />
              <rect x="34" y="7" width="1" height="1" fill="hsl(var(--primary))" opacity="0.5" />
            </>
          )}
        </svg>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-0.5 px-1">
        <p className="text-[8px] text-muted-foreground/40 font-mono tracking-widest truncate">
          {catName}
          <span className="text-muted-foreground/20 ml-1">
            {mood === "coding" && "⌨"}
            {mood === "sleeping" && "💤"}
            {mood === "happy" && "♡"}
            {mood === "purring" && "~"}
            {mood === "idle" && "·"}
            {mood === "excited" && "!"}
            {mood === "belly" && "🐾"}
            {mood === "scratching" && "👃"}
            {mood === "stretching" && "🧘"}
            {mood === "listening" && "♪"}
            {mood === "thirsty" && "💧"}
            {mood === "hydrated" && "✓"}
            {mood === "caffeinated" && "☕"}
            {mood === "focused" && "🍅"}
            {mood === "alert" && "⚠️"}
          </span>
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
          className="text-muted-foreground/20 hover:text-muted-foreground/60 transition-colors p-0.5"
        >
          <Settings2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
