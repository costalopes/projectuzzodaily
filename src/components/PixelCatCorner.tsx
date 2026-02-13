import { useEffect, useState, useCallback, useRef } from "react";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CatMood = "idle" | "happy" | "purring" | "sleeping" | "coding" | "excited" | "belly" | "scratching" | "stretching";

interface CatProps {
  onTaskComplete?: boolean;
}

const CAT_COLORS: { name: string; fur1: string; fur2: string; fur3: string; stripe: string; belly: string; eye: string }[] = [
  { name: "Laranja", fur1: "#e8a050", fur2: "#d08838", fur3: "#f0c080", stripe: "#c07028", belly: "#f8e0c0", eye: "#2a6040" },
  { name: "Cinza", fur1: "#8a8a9a", fur2: "#6a6a7a", fur3: "#a8a8b8", stripe: "#5a5a6a", belly: "#c8c8d8", eye: "#c89020" },
  { name: "Preto", fur1: "#3a3a4a", fur2: "#2a2a3a", fur3: "#5a5a6a", stripe: "#1a1a2a", belly: "#6a6a7a", eye: "#e0c040" },
  { name: "Branco", fur1: "#e8e8f0", fur2: "#d0d0d8", fur3: "#f5f5ff", stripe: "#c0c0c8", belly: "#ffffff", eye: "#4080c0" },
  { name: "Malhado", fur1: "#c88040", fur2: "#a06828", fur3: "#e8b880", stripe: "#303030", belly: "#f0d8b8", eye: "#308050" },
  { name: "Siamês", fur1: "#f0e0d0", fur2: "#d8c8b8", fur3: "#f8f0e8", stripe: "#8a6a50", belly: "#faf0e8", eye: "#4070b0" },
];

export const PixelCatCorner = ({ onTaskComplete }: CatProps) => {
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

  const saveName = (n: string) => { setCatName(n); localStorage.setItem("cat-name", n); };
  const saveColor = (i: number) => { setColorIdx(i); localStorage.setItem("cat-color", String(i)); };

  const allMessages: Record<CatMood, string[]> = {
    idle: [
      "miau~", "...", "*estica*", "*boceja*", "meow?",
      "*olha pela janela*", "hmm...", "*rola no chão*",
      "*limpa a patinha*", "preguiça...", "*espreita*",
      "tô de boa", "*ronca baixinho*", "*sobe na mesa*",
      "*derruba o copo*", "cadê o laser?", "*ignora humano*",
      "*finge que não viu*", "*olha fixo pra parede*",
      "*persegue a própria cauda*", "*late. ops*",
      "*empurra algo da mesa*", "cadê meu atum?",
      "*olha pro teto*", "...*cai da cadeira*",
      "*caça mosquito imaginário*", "tédio...",
    ],
    happy: [
      "nyaa~", "purrrr!", "*ronrona*", "mrrp!", "mais carinho!",
      "isso mesmo!", "*fecha os olhos*", "tão bom...",
      "*esfrega no braço*", "continua!", "adoro!",
      "*amassa a almofada*", "melhor humano!", "*olhinhos brilhando*",
      "faz mais!", "*vira a barriga*", "posso ficar aqui forever",
      "*faz biscuit*", "meu humano favorito!",
      "*estica as patinhas*", "*pega na mão*",
      "carinho é vida", "*ronrona intensamente*",
    ],
    purring: [
      "purrrrrr...", "*amassa pãozinho*", "tão quentinho...",
      "*ronrona alto*", "não para...", "vida boa...",
      "*derrete*", "hmmmm...", "*relaxa total*",
      "*vibra de felicidade*", "melhor momento do dia",
      "*ronrona no volume máximo*", "zen mode on",
      "*deita no teclado*", "sou puro amor",
    ],
    sleeping: [
      "zzz...", "*sonha com peixe*", "mrrrm...",
      "*mexe a patinha*", "...atum...", "*suspira*",
      "zzZzz...", "*vira de lado*", "*sonha com yarn*",
      "*corre dormindo*", "...npm install...", "*ronca*",
      "*murmura*...bug...", "*patinha treme*",
      "...deploy...", "*ronca alto*", "...café...",
      "*sonha que é tigre*", "...merge conflict...",
    ],
    coding: [
      "git push", "npm run dev", "// TODO: dormir",
      "console.log('miau')", "bug?", "LGTM!",
      "refactor time", "café + código", "deploy friday?",
      "tá compilando...", "hmm esse hook...",
      "mais um commit", "testes passando!",
      "clean code", "feature pronta!", "PR aprovado!",
      "stack overflow", "ctrl+s ctrl+s", "debugando...",
      "aquele bug...", "funciona na minha máquina",
      "code review", "pair programming?",
      "esse import...", "TypeScript!", "async await...",
      "useEffect cleanup", "null pointer? aqui não",
      "docker up", "git stash pop", "merge conflict 😱",
      "CI passando ✓", "hotfix incoming", "404 sleep not found",
      "chmod 777 😬", "sudo rm -rf preguiça", "localhost:3000",
      `${catName} approved ✓`, "ship it! 🚀",
      "const sleep = null", "try { code } catch { nap }",
      "while(true) { code() }", "segfault emocional",
      "grep -r 'bug' .", "vim ou vscode?",
      "npm audit fix 🙏", "200 OK ✓",
      "SELECT * FROM nap", "git blame quem?",
      `${catName}.exe parou`, "sudo ${catName}",
      "linting... ✓", "zero warnings!",
      "dark mode > light mode", "café.length === 0 😱",
      "bora pra produção?", "staging first!",
      "esse regex...", "/^miau$/gi",
      "Infinity loop 🔄", "404 motivation not found",
    ],
    excited: [
      "MIAU!!", "WOOO!", "*pula*", "incrível!!",
      "mandou bem!", "boa!!", "*faz dancinha*",
      "isso aí!!", "perfeito!", "*olhos brilhando*",
      "que orgulho!!", "show!!", "*gira de felicidade*",
      `${catName} tá feliz!!`, "SHIP IT!! 🚀",
      "PRODUÇÃO!! 🎉", "*pula no teclado*",
      "MEGA PR!!", "100% coverage!!",
      "*faz a dancinha do deploy*", "MIAU MIAU!!",
    ],
    belly: [
      "*mostra a barriga*", "coça aqui!", "confia...",
      "*rola pro lado*", "barriguinha!", "tô vulnerável",
      "*patinhas pra cima*", "carinho na barriga?",
      "*expõe o belly*", "armadilha? talvez...",
      "prometo que não mordo", "*estiquinha total*",
    ],
    scratching: [
      "*coça o nariz*", "*coça atrás da orelha*",
      "*esfrega o focinho*", "tava coçando!",
      "*coça a bochecha*", "*limpa o bigode*",
      "*esfrega na patinha*", "hmm coceirinha",
      "*coça coça*", "*patinha no focinho*",
    ],
    stretching: [
      "*esticaaaa*", "*alongamento máximo*",
      "*estica as patinhas*", "ahhhh que bom",
      "*yoga cat pose*", "*estica e boceja*",
      "*stretching time*", "*se alonga todo*",
      "preguiça gostosa", "*estica até tremer*",
    ],
  };

  // Clamp eye offset to prevent going outside head
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!catRef.current) return;
      const rect = catRef.current.getBoundingClientRect();
      const catCenterX = rect.left + rect.width / 2;
      const catCenterY = rect.top + rect.height / 2;
      const dx = e.clientX - catCenterX;
      const dy = e.clientY - catCenterY;
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

  useEffect(() => {
    if (onTaskComplete) {
      setMood("excited");
      const msgs = allMessages.excited;
      setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
      setTimeout(() => setMessage(""), 3000);
      setTimeout(() => setMood("coding"), 4000);
    }
  }, [onTaskComplete]);

  useEffect(() => {
    if (mood === "sleeping") return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 2000 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, [mood]);

  useEffect(() => {
    if (mood === "idle") {
      const timeout = setTimeout(() => setMood("sleeping"), 25000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

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
    if (mood === "belly" || mood === "scratching" || mood === "stretching") {
      const timeout = setTimeout(() => setMood("coding"), 5000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

  // Random spontaneous animations during coding
  useEffect(() => {
    if (mood !== "coding") return;

    const doRandomAction = () => {
      const rand = Math.random();
      if (rand < 0.15) {
        // Spontaneous belly
        setMood("belly");
        const msgs = allMessages.belly;
        setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
        setTimeout(() => setMessage(""), 3000);
      } else if (rand < 0.30) {
        // Spontaneous scratch
        setMood("scratching");
        const msgs = allMessages.scratching;
        setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
        setTimeout(() => setMessage(""), 3000);
      } else if (rand < 0.45) {
        // Spontaneous stretch
        setMood("stretching");
        const msgs = allMessages.stretching;
        setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
        setTimeout(() => setMessage(""), 3000);
      } else {
        // Normal coding message
        const msgs = allMessages.coding;
        setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
        setTimeout(() => setMessage(""), 4000);
      }
    };

    const interval = setInterval(doRandomAction, 8000 + Math.random() * 6000);
    return () => clearInterval(interval);
  }, [mood, catName]);

  const handlePet = useCallback(() => {
    if (showSettings) return;
    const newPets = pets + 1;
    setPets(newPets);
    const newMood = newPets % 5 === 0 ? "purring" : "happy";
    setMood(newMood);
    const msgs = allMessages[newMood];
    setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
    setTimeout(() => setMessage(""), 3000);

    const heartId = Date.now();
    setHearts((h) => [...h, heartId]);
    setTimeout(() => setHearts((h) => h.filter((id) => id !== heartId)), 2000);
  }, [pets, showSettings]);

  const c = CAT_COLORS[colorIdx];
  const earInner = "#f0a0a0";
  const nose = "#e07080";
  const pawPad = "#e89098";
  const collar = "hsl(var(--primary))";
  const bell = "hsl(var(--accent))";
  const eyeColor = c.eye;

  const showEyes = mood !== "sleeping" && !blink;
  const isHappy = mood === "happy" || mood === "purring" || mood === "excited" || mood === "belly";
  const isBelly = mood === "belly";
  const isScratching = mood === "scratching";
  const isStretching = mood === "stretching";

  return (
    <div ref={catRef} className="fixed bottom-4 right-4 z-50 select-none group">
      {/* Speech bubble */}
      {message && !showSettings && (
        <div className="absolute -top-12 right-0 bg-card/95 backdrop-blur-xl border border-border rounded-xl px-3 py-2 shadow-lg animate-fade-in whitespace-nowrap max-w-[200px]">
          <p className="text-[10px] font-mono text-foreground truncate">{message}</p>
          <div className="absolute -bottom-1 right-8 w-2 h-2 bg-card/95 border-r border-b border-border rotate-45" />
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 shadow-xl animate-fade-in w-56">
          <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">
            // cat.config
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-mono text-muted-foreground/60 block mb-1">name:</label>
              <input
                value={catName}
                onChange={(e) => saveName(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                maxLength={12}
              />
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground/60 block mb-1.5">color:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {CAT_COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => saveColor(i)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-mono transition-all border",
                      colorIdx === i
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
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

      <div className={cn(
        mood === "sleeping" ? "" : "animate-breathe",
        isBelly && "animate-belly-roll",
        isStretching && "animate-cat-stretch",
        isScratching && "animate-cat-scratch"
      )}>
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
          <g className="animate-ear-twitch">
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

          {/* Eyes — clamped offset */}
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
              {/* Left eye */}
              <rect x={10 + eyeOffset.x} y={10 + eyeOffset.y} width="6" height="5" fill={eyeColor} />
              <rect x={11 + eyeOffset.x} y={10 + eyeOffset.y} width="3" height="2" fill="white" />
              <rect x={14 + eyeOffset.x} y={13 + eyeOffset.y} width="1" height="1" fill="white" opacity="0.4" />
              {/* Right eye */}
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
              {/* Left paw reaching to nose */}
              <g className="animate-scratch-paw">
                <rect x="12" y="18" width="3" height="3" fill={c.fur1} />
                <rect x="13" y="17" width="2" height="1" fill={c.fur3} />
                <rect x="13" y="21" width="1" height="1" fill={pawPad} />
              </g>
              {/* Right paw normal */}
              <rect x="25" y="32" width="7" height="4" fill={c.fur1} />
              <rect x="26" y="35" width="5" height="1" fill={c.fur3} />
              <rect x="27" y="34" width="1" height="1" fill={pawPad} />
              <rect x="29" y="34" width="1" height="1" fill={pawPad} />
            </>
          ) : isBelly ? (
            <>
              {/* Paws up in the air */}
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
          {mood === "coding" && (
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

      {/* Bottom bar: name + settings */}
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
