import { useEffect, useState, useCallback } from "react";

type CatMood = "idle" | "happy" | "purring" | "sleeping" | "coding";

export const PixelCatCorner = () => {
  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState<CatMood>("coding");
  const [pets, setPets] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  const messages: Record<CatMood, string[]> = {
    idle: ["miau~ 🐾", "...", "*olha pra você*", "meow?"],
    happy: ["nyaa~ ♡", "purrrr!", "*ronrona alto*", "mrrp! 💕"],
    purring: ["purrrrrr...", "*massagem*", "prrrr~ 💤", "tão quentinho..."],
    sleeping: ["zzz...", "mrrrm...", "*sonha com peixe*"],
    coding: ["git push 🐱", "npm run dev", "console.log('miau')", "// TODO: dormir", "bug? que bug?", "merge conflict 😿"],
  };

  useEffect(() => {
    if (mood === "sleeping") return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [mood]);

  useEffect(() => {
    if (mood === "idle") {
      const timeout = setTimeout(() => setMood("sleeping"), 20000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

  useEffect(() => {
    if (mood === "purring" || mood === "happy") {
      const timeout = setTimeout(() => setMood("coding"), 5000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

  // Random messages when coding
  useEffect(() => {
    if (mood !== "coding") return;
    const interval = setInterval(() => {
      const msgs = messages.coding;
      setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
      setTimeout(() => setMessage(""), 3000);
    }, 8000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [mood]);

  const handlePet = useCallback(() => {
    const newPets = pets + 1;
    setPets(newPets);
    const newMood = newPets % 4 === 0 ? "purring" : "happy";
    setMood(newMood);
    const msgs = messages[newMood];
    setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
    setTimeout(() => setMessage(""), 3000);

    const heartId = Date.now();
    setHearts((h) => [...h, heartId]);
    setTimeout(() => setHearts((h) => h.filter((id) => id !== heartId)), 1800);
  }, [pets]);

  // Colors - warm orange tabby cat
  const fur1 = "#d4915a";      // main fur
  const fur2 = "#c47d48";      // darker fur
  const fur3 = "#e5a76e";      // lighter fur
  const furStripe = "#b06a35";  // stripes
  const belly = "#f0d0a8";     // belly/inner
  const earInner = "#e8a0a0";  // inner ear pink
  const nose = "#e07080";      // nose
  const pawPad = "#d88090";    // paw pads
  const eyeBase = "hsl(var(--primary))";
  const collar = "hsl(var(--accent))";

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none group">
      {/* Speech bubble */}
      {message && (
        <div className="absolute -top-12 right-0 bg-card border border-border rounded-2xl px-4 py-2 shadow-xl animate-fade-in whitespace-nowrap">
          <p className="text-xs font-mono text-foreground">{message}</p>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-card border-r border-b border-border rotate-45 rounded-br-sm" />
        </div>
      )}

      {/* Hearts */}
      {hearts.map((id, i) => (
        <span
          key={id}
          className="absolute text-lg animate-heart-float pointer-events-none"
          style={{ left: `${5 + (i % 5) * 16}px`, top: "-15px" }}
        >
          {["💖", "💕", "✨", "💜", "🧡"][i % 5]}
        </span>
      ))}

      {/* Sleeping */}
      {mood === "sleeping" && (
        <div className="absolute -top-10 right-0 flex gap-1">
          <span className="text-xs animate-float font-mono text-muted-foreground" style={{ animationDelay: "0s" }}>z</span>
          <span className="text-sm animate-float font-mono text-muted-foreground" style={{ animationDelay: "0.3s" }}>Z</span>
          <span className="text-base animate-float font-mono text-muted-foreground" style={{ animationDelay: "0.6s" }}>Z</span>
        </div>
      )}

      {/* Pet counter */}
      {pets > 0 && (
        <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground rounded-full min-w-[22px] h-[22px] flex items-center justify-center text-[9px] font-bold shadow-lg px-1">
          {pets > 99 ? "99+" : pets}
        </div>
      )}

      <div className={mood === "sleeping" ? "" : "animate-breathe"}>
        <svg
          width="120"
          height="108"
          viewBox="0 0 40 36"
          className="image-rendering-pixelated cursor-pointer drop-shadow-xl transition-transform hover:scale-105 active:scale-90"
          onClick={handlePet}
          role="button"
          aria-label="Acariciar o gatinho"
        >
          {/* Ground shadow */}
          <ellipse cx="18" cy="34" rx="14" ry="2" fill="hsl(var(--foreground) / 0.08)" />

          {/* Tail */}
          <g className={mood === "happy" || mood === "purring" ? "animate-tail-fast" : "animate-tail"}>
            <rect x="28" y="22" width="1" height="1" fill={fur2} />
            <rect x="29" y="21" width="1" height="1" fill={fur2} />
            <rect x="30" y="20" width="1" height="1" fill={fur1} />
            <rect x="31" y="19" width="1" height="1" fill={fur1} />
            <rect x="32" y="18" width="2" height="1" fill={fur1} />
            <rect x="33" y="17" width="2" height="1" fill={furStripe} />
            <rect x="34" y="16" width="2" height="1" fill={fur2} />
            <rect x="35" y="15" width="1" height="1" fill={furStripe} />
          </g>

          {/* Body */}
          <rect x="6" y="19" width="24" height="10" fill={fur1} />
          <rect x="7" y="18" width="22" height="1" fill={fur2} />
          {/* Body stripes */}
          <rect x="8" y="21" width="2" height="1" fill={furStripe} />
          <rect x="9" y="23" width="3" height="1" fill={furStripe} />
          <rect x="24" y="21" width="2" height="1" fill={furStripe} />
          <rect x="23" y="23" width="3" height="1" fill={furStripe} />
          {/* Belly */}
          <rect x="12" y="20" width="12" height="8" fill={belly} />
          <rect x="13" y="19" width="10" height="1" fill={fur3} />

          {/* Collar */}
          <rect x="8" y="17" width="20" height="2" fill={collar} />
          <rect x="17" y="18" width="2" height="2" fill="hsl(var(--warning))" />

          {/* Left ear */}
          <g className="animate-ear-twitch">
            <rect x="5" y="1" width="1" height="1" fill={fur2} />
            <rect x="6" y="0" width="4" height="1" fill={fur2} />
            <rect x="4" y="2" width="1" height="4" fill={fur2} />
            <rect x="5" y="2" width="1" height="3" fill={fur2} />
            <rect x="6" y="1" width="3" height="2" fill={fur1} />
            <rect x="6" y="2" width="2" height="2" fill={earInner} />
          </g>
          {/* Right ear */}
          <rect x="25" y="1" width="1" height="1" fill={fur2} />
          <rect x="26" y="0" width="4" height="1" fill={fur2} />
          <rect x="30" y="2" width="1" height="4" fill={fur2} />
          <rect x="29" y="2" width="1" height="3" fill={fur2} />
          <rect x="26" y="1" width="3" height="2" fill={fur1} />
          <rect x="27" y="2" width="2" height="2" fill={earInner} />

          {/* Head */}
          <rect x="5" y="6" width="26" height="2" fill={fur2} />
          <rect x="4" y="8" width="28" height="9" fill={fur1} />
          <rect x="5" y="7" width="24" height="1" fill={fur1} />
          {/* Forehead M pattern */}
          <rect x="14" y="7" width="1" height="1" fill={furStripe} />
          <rect x="15" y="6" width="1" height="2" fill={furStripe} />
          <rect x="16" y="7" width="2" height="1" fill={furStripe} />
          <rect x="18" y="6" width="1" height="2" fill={furStripe} />
          <rect x="19" y="7" width="1" height="1" fill={furStripe} />
          {/* Cheeks */}
          <rect x="5" y="13" width="6" height="3" fill={fur3} />
          <rect x="25" y="13" width="6" height="3" fill={fur3} />

          {/* Eyes */}
          {mood === "sleeping" ? (
            <>
              <rect x="9" y="11" width="6" height="1" fill={eyeBase} />
              <rect x="21" y="11" width="6" height="1" fill={eyeBase} />
            </>
          ) : blink ? (
            <>
              <rect x="9" y="11" width="6" height="1" fill={eyeBase} />
              <rect x="21" y="11" width="6" height="1" fill={eyeBase} />
            </>
          ) : mood === "happy" || mood === "purring" ? (
            <>
              <rect x="9" y="10" width="6" height="1" fill={eyeBase} />
              <rect x="9" y="11" width="1" height="2" fill={eyeBase} />
              <rect x="14" y="11" width="1" height="2" fill={eyeBase} />
              <rect x="21" y="10" width="6" height="1" fill={eyeBase} />
              <rect x="21" y="11" width="1" height="2" fill={eyeBase} />
              <rect x="26" y="11" width="1" height="2" fill={eyeBase} />
            </>
          ) : (
            <>
              {/* Left eye */}
              <rect x="9" y="9" width="6" height="5" fill={eyeBase} />
              <rect x="10" y="9" width="3" height="2" fill="white" />
              <rect x="13" y="12" width="1" height="1" fill="white" opacity="0.5" />
              {/* Right eye */}
              <rect x="21" y="9" width="6" height="5" fill={eyeBase} />
              <rect x="22" y="9" width="3" height="2" fill="white" />
              <rect x="25" y="12" width="1" height="1" fill="white" opacity="0.5" />
            </>
          )}

          {/* Nose */}
          <rect x="16" y="14" width="3" height="2" fill={nose} />
          <rect x="17" y="14" width="1" height="1" fill="#f0909a" />
          {/* Mouth */}
          {mood === "happy" || mood === "purring" ? (
            <>
              <rect x="15" y="16" width="1" height="1" fill={fur2} />
              <rect x="19" y="16" width="1" height="1" fill={fur2} />
              <rect x="16" y="16" width="3" height="1" fill={nose} opacity="0.6" />
            </>
          ) : (
            <>
              <rect x="15" y="16" width="1" height="1" fill={fur2} />
              <rect x="19" y="16" width="1" height="1" fill={fur2} />
            </>
          )}

          {/* Whiskers */}
          <rect x="1" y="12" width="7" height="1" fill={fur3} opacity="0.6" />
          <rect x="0" y="14" width="7" height="1" fill={fur3} opacity="0.6" />
          <rect x="2" y="16" width="6" height="1" fill={fur3} opacity="0.5" />
          <rect x="28" y="12" width="7" height="1" fill={fur3} opacity="0.6" />
          <rect x="29" y="14" width="7" height="1" fill={fur3} opacity="0.6" />
          <rect x="28" y="16" width="6" height="1" fill={fur3} opacity="0.5" />

          {/* Front paws */}
          <rect x="6" y="29" width="6" height="4" fill={fur1} />
          <rect x="7" y="32" width="4" height="1" fill={fur3} />
          <rect x="8" y="31" width="1" height="1" fill={pawPad} />
          <rect x="10" y="31" width="1" height="1" fill={pawPad} />
          <rect x="24" y="29" width="6" height="4" fill={fur1} />
          <rect x="25" y="32" width="4" height="1" fill={fur3} />
          <rect x="26" y="31" width="1" height="1" fill={pawPad} />
          <rect x="28" y="31" width="1" height="1" fill={pawPad} />

          {/* Coding laptop (when coding mood) */}
          {mood === "coding" && (
            <>
              <rect x="12" y="28" width="12" height="1" fill="#555" />
              <rect x="11" y="29" width="14" height="1" fill="#666" />
              <rect x="13" y="25" width="10" height="3" fill="#333" />
              <rect x="14" y="25" width="1" height="1" fill="#6f6" opacity="0.8" />
              <rect x="16" y="25" width="2" height="1" fill="#ff9" opacity="0.7" />
              <rect x="14" y="26" width="3" height="1" fill="#9cf" opacity="0.7" />
              <rect x="18" y="26" width="2" height="1" fill="#f9c" opacity="0.6" />
              <rect x="15" y="27" width="4" height="1" fill="#6f6" opacity="0.5" />
            </>
          )}
        </svg>
      </div>

      {/* Mood label */}
      <p className="text-[9px] text-muted-foreground/50 text-center mt-0.5 font-mono">
        {mood === "coding" && "⌨️ coding..."}
        {mood === "sleeping" && "💤 dormindo"}
        {mood === "happy" && "😸 feliz!"}
        {mood === "purring" && "😻 ronronando"}
        {mood === "idle" && "🐱 relaxando"}
      </p>
    </div>
  );
};
