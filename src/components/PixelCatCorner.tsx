import { useEffect, useState, useCallback, useRef } from "react";

type CatMood = "idle" | "happy" | "purring" | "sleeping" | "coding" | "excited";

interface CatProps {
  onTaskComplete?: boolean;
}

export const PixelCatCorner = ({ onTaskComplete }: CatProps) => {
  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState<CatMood>("coding");
  const [pets, setPets] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const catRef = useRef<HTMLDivElement>(null);
  const [isKneading, setIsKneading] = useState(false);

  const allMessages: Record<CatMood, string[]> = {
    idle: ["miau~ 🐾", "...", "*estica*", "*boceja*", "meow?"],
    happy: ["nyaa~ ♡", "purrrr!", "*ronrona*", "mrrp! 💕", "mais carinho!"],
    purring: ["purrrrrr...", "*amassa pãozinho*", "tão bom...", "💜"],
    sleeping: ["zzz...", "*sonha com peixe*", "mrrrm..."],
    coding: ["git push 🐱", "npm run dev ✨", "// TODO: dormir", "console.log('🐱')", "bug? 🐛", "LGTM! ✅", "refactor time", "☕ + 💻 = 💜"],
    excited: ["MIAU!! 🎉", "WOOO!", "*pula*", "incrível!! ✨"],
  };

  // Mouse tracking for eyes
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!catRef.current) return;
      const rect = catRef.current.getBoundingClientRect();
      const catCenterX = rect.left + rect.width / 2;
      const catCenterY = rect.top + rect.height / 2;
      const dx = e.clientX - catCenterX;
      const dy = e.clientY - catCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 2;
      setEyeOffset({
        x: Math.round((dx / Math.max(dist, 1)) * maxOffset),
        y: Math.round((dy / Math.max(dist, 1)) * maxOffset * 0.6),
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  // React to task completion
  useEffect(() => {
    if (onTaskComplete) {
      setMood("excited");
      setMessage("Boa!! 🎉");
      setTimeout(() => setMessage(""), 3000);
      setTimeout(() => setMood("coding"), 4000);
    }
  }, [onTaskComplete]);

  // Blinking
  useEffect(() => {
    if (mood === "sleeping") return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 2000 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, [mood]);

  // Auto-sleep
  useEffect(() => {
    if (mood === "idle") {
      const timeout = setTimeout(() => setMood("sleeping"), 25000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

  // Return from happy/purring
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

  // Coding messages
  useEffect(() => {
    if (mood !== "coding") return;
    const interval = setInterval(() => {
      const msgs = allMessages.coding;
      setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
      setTimeout(() => setMessage(""), 3500);
    }, 10000 + Math.random() * 8000);
    return () => clearInterval(interval);
  }, [mood]);

  const handlePet = useCallback(() => {
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
  }, [pets]);

  // Colors
  const fur1 = "#e8a050"; const fur2 = "#d08838"; const fur3 = "#f0c080";
  const furStripe = "#c07028"; const belly = "#f8e0c0";
  const earInner = "#f0a0a0"; const nose = "#e07080";
  const pawPad = "#e89098"; const collar = "hsl(var(--primary))";
  const bell = "hsl(var(--accent))";
  const eyeColor = "hsl(var(--primary))";

  const showEyes = mood !== "sleeping" && !blink;
  const isHappy = mood === "happy" || mood === "purring" || mood === "excited";

  return (
    <div ref={catRef} className="fixed bottom-3 right-3 z-50 select-none group">
      {/* Speech bubble */}
      {message && (
        <div className="absolute -top-14 right-0 bg-card/95 backdrop-blur-xl border border-border rounded-2xl px-4 py-2.5 shadow-2xl animate-fade-in whitespace-nowrap max-w-[200px]">
          <p className="text-[11px] font-mono text-foreground font-medium">{message}</p>
          <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-card/95 border-r border-b border-border rotate-45 rounded-br-sm" />
        </div>
      )}

      {/* Hearts */}
      {hearts.map((id, i) => (
        <span key={id} className="absolute text-lg animate-heart-float pointer-events-none"
          style={{ left: `${(i % 6) * 18}px`, top: "-12px" }}>
          {["💜", "🧡", "✨", "💖", "⭐", "💕"][i % 6]}
        </span>
      ))}

      {/* Sleeping Zs */}
      {mood === "sleeping" && (
        <div className="absolute -top-12 right-2 flex gap-1.5">
          {[0, 0.4, 0.8].map((d, i) => (
            <span key={i} className="animate-float font-mono text-muted-foreground/60"
              style={{ animationDelay: `${d}s`, fontSize: `${10 + i * 3}px` }}>Z</span>
          ))}
        </div>
      )}

      {/* Pet counter */}
      {pets > 0 && (
        <div className="absolute -top-1 -left-1 bg-accent text-white rounded-full min-w-[24px] h-[24px] flex items-center justify-center text-[10px] font-bold shadow-lg px-1.5 border-2 border-background">
          {pets > 99 ? "99+" : pets}
        </div>
      )}

      <div className={mood === "sleeping" ? "" : "animate-breathe"}>
        <svg width="132" height="118" viewBox="0 0 44 40"
          className="image-rendering-pixelated cursor-pointer drop-shadow-2xl transition-transform duration-200 hover:scale-110 active:scale-90"
          onClick={handlePet} role="button" aria-label="Acariciar o gatinho">

          {/* Shadow */}
          <ellipse cx="20" cy="38" rx="15" ry="2" fill="hsl(var(--foreground) / 0.06)" />

          {/* Tail */}
          <g className={isHappy ? "animate-tail-fast" : "animate-tail"}>
            <rect x="30" y="24" width="1" height="1" fill={fur2} />
            <rect x="31" y="23" width="1" height="1" fill={fur1} />
            <rect x="32" y="22" width="1" height="1" fill={fur1} />
            <rect x="33" y="21" width="2" height="1" fill={fur1} />
            <rect x="34" y="20" width="2" height="1" fill={furStripe} />
            <rect x="35" y="19" width="2" height="1" fill={fur2} />
            <rect x="36" y="18" width="1" height="1" fill={furStripe} />
            <rect x="37" y="17" width="1" height="1" fill={fur1} />
          </g>

          {/* Body */}
          <rect x="7" y="21" width="25" height="11" fill={fur1} />
          <rect x="8" y="20" width="23" height="1" fill={fur2} />
          {/* Stripes */}
          <rect x="9" y="23" width="3" height="1" fill={furStripe} />
          <rect x="10" y="25" width="2" height="1" fill={furStripe} />
          <rect x="26" y="23" width="3" height="1" fill={furStripe} />
          <rect x="27" y="25" width="2" height="1" fill={furStripe} />
          {/* Belly */}
          <rect x="13" y="22" width="13" height="9" fill={belly} />

          {/* Collar */}
          <rect x="9" y="19" width="21" height="2" fill={collar} />
          <rect x="18" y="20" width="3" height="2" fill={bell} />
          <rect x="19" y="20" width="1" height="1" fill="white" opacity="0.4" />

          {/* Left ear */}
          <g className="animate-ear-twitch">
            <rect x="6" y="1" width="1" height="1" fill={fur2} />
            <rect x="7" y="0" width="4" height="1" fill={fur2} />
            <rect x="5" y="2" width="1" height="4" fill={fur2} />
            <rect x="6" y="2" width="1" height="3" fill={fur1} />
            <rect x="7" y="1" width="3" height="2" fill={fur1} />
            <rect x="7" y="2" width="2" height="2" fill={earInner} />
          </g>
          {/* Right ear */}
          <rect x="27" y="1" width="1" height="1" fill={fur2} />
          <rect x="28" y="0" width="4" height="1" fill={fur2} />
          <rect x="32" y="2" width="1" height="4" fill={fur2} />
          <rect x="31" y="2" width="1" height="3" fill={fur1} />
          <rect x="28" y="1" width="3" height="2" fill={fur1} />
          <rect x="29" y="2" width="2" height="2" fill={earInner} />

          {/* Head */}
          <rect x="6" y="6" width="27" height="2" fill={fur2} />
          <rect x="5" y="8" width="29" height="11" fill={fur1} />
          <rect x="6" y="7" width="25" height="1" fill={fur1} />
          {/* Forehead M */}
          <rect x="15" y="7" width="1" height="1" fill={furStripe} />
          <rect x="16" y="6" width="1" height="2" fill={furStripe} />
          <rect x="17" y="7" width="3" height="1" fill={furStripe} />
          <rect x="20" y="6" width="1" height="2" fill={furStripe} />
          <rect x="21" y="7" width="1" height="1" fill={furStripe} />
          {/* Cheeks */}
          <rect x="6" y="14" width="6" height="4" fill={fur3} />
          <rect x="27" y="14" width="6" height="4" fill={fur3} />

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
              {/* Left eye with mouse tracking */}
              <rect x={10 + eyeOffset.x} y={10 + eyeOffset.y} width="6" height="5" fill={eyeColor} />
              <rect x={11 + eyeOffset.x} y={10 + eyeOffset.y} width="3" height="2" fill="white" />
              <rect x={14 + eyeOffset.x} y={13 + eyeOffset.y} width="1" height="1" fill="white" opacity="0.4" />
              {/* Right eye */}
              <rect x={22 + eyeOffset.x} y={10 + eyeOffset.y} width="6" height="5" fill={eyeColor} />
              <rect x={23 + eyeOffset.x} y={10 + eyeOffset.y} width="3" height="2" fill="white" />
              <rect x={26 + eyeOffset.x} y={13 + eyeOffset.y} width="1" height="1" fill="white" opacity="0.4" />
            </>
          )}

          {/* Nose */}
          <rect x="17" y="15" width="4" height="2" fill={nose} />
          <rect x="18" y="15" width="2" height="1" fill="#f0909a" />
          {/* Mouth */}
          <rect x="16" y="17" width="1" height="1" fill={fur2} />
          <rect x="21" y="17" width="1" height="1" fill={fur2} />
          {isHappy && <rect x="17" y="17" width="4" height="1" fill={nose} opacity="0.5" />}

          {/* Whiskers */}
          <rect x="1" y="13" width="8" height="1" fill={fur3} opacity="0.5" />
          <rect x="0" y="15" width="8" height="1" fill={fur3} opacity="0.5" />
          <rect x="2" y="17" width="7" height="1" fill={fur3} opacity="0.4" />
          <rect x="30" y="13" width="8" height="1" fill={fur3} opacity="0.5" />
          <rect x="31" y="15" width="8" height="1" fill={fur3} opacity="0.5" />
          <rect x="30" y="17" width="7" height="1" fill={fur3} opacity="0.4" />

          {/* Front paws - kneading */}
          <g className={isKneading ? "animate-knead-l" : ""}>
            <rect x="7" y="32" width="7" height="4" fill={fur1} />
            <rect x="8" y="35" width="5" height="1" fill={fur3} />
            <rect x="9" y="34" width="1" height="1" fill={pawPad} />
            <rect x="11" y="34" width="1" height="1" fill={pawPad} />
          </g>
          <g className={isKneading ? "animate-knead-r" : ""}>
            <rect x="25" y="32" width="7" height="4" fill={fur1} />
            <rect x="26" y="35" width="5" height="1" fill={fur3} />
            <rect x="27" y="34" width="1" height="1" fill={pawPad} />
            <rect x="29" y="34" width="1" height="1" fill={pawPad} />
          </g>

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

          {/* Excited sparkles */}
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

      {/* Status */}
      <p className="text-[8px] text-muted-foreground/40 text-center mt-0.5 font-mono tracking-wide">
        {mood === "coding" && "⌨ coding"}
        {mood === "sleeping" && "💤 zzz"}
        {mood === "happy" && "😸 feliz"}
        {mood === "purring" && "😻 purrr"}
        {mood === "idle" && "🐱 idle"}
        {mood === "excited" && "🎉 hype!"}
      </p>
    </div>
  );
};
