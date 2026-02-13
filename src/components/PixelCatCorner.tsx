import { useEffect, useState, useCallback } from "react";

type CatMood = "idle" | "happy" | "purring" | "sleeping";

export const PixelCatCorner = () => {
  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState<CatMood>("idle");
  const [pets, setPets] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  const messages = [
    "miau~ 🐾",
    "purrrr...",
    "nyaa~ ♡",
    "zzz...",
    "*ronrona*",
    "meow!",
    "prrrr~ 💤",
  ];

  useEffect(() => {
    if (mood === "sleeping") return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [mood]);

  useEffect(() => {
    if (mood === "idle") {
      const timeout = setTimeout(() => setMood("sleeping"), 25000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

  useEffect(() => {
    if (mood === "purring" || mood === "happy") {
      const timeout = setTimeout(() => setMood("idle"), 4000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

  const handlePet = useCallback(() => {
    const newPets = pets + 1;
    setPets(newPets);
    setMood(newPets % 3 === 0 ? "purring" : "happy");
    setMessage(messages[Math.floor(Math.random() * messages.length)]);
    setTimeout(() => setMessage(""), 2500);

    const heartId = Date.now();
    setHearts((h) => [...h, heartId]);
    setTimeout(() => setHearts((h) => h.filter((id) => id !== heartId)), 1500);
  }, [pets]);

  const P = 3; // pixel unit

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none group">
      {/* Speech bubble */}
      {message && (
        <div className="absolute -top-10 right-0 bg-card border border-border rounded-xl px-3 py-1.5 shadow-lg animate-fade-in whitespace-nowrap">
          <p className="text-xs font-mono text-foreground">{message}</p>
          <div className="absolute -bottom-1 right-4 w-2 h-2 bg-card border-r border-b border-border rotate-45" />
        </div>
      )}

      {/* Hearts */}
      {hearts.map((id, i) => (
        <span
          key={id}
          className="absolute text-base animate-heart-float pointer-events-none"
          style={{ left: `${10 + (i % 4) * 15}px`, top: "-10px" }}
        >
          💖
        </span>
      ))}

      {/* Sleeping indicator */}
      {mood === "sleeping" && (
        <span className="absolute -top-8 right-2 text-sm animate-float font-mono text-muted-foreground">
          💤
        </span>
      )}

      {/* Pet counter badge */}
      {pets > 0 && (
        <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-bold shadow-sm">
          {pets > 99 ? "99+" : pets}
        </div>
      )}

      <svg
        width={36 * P}
        height={32 * P}
        viewBox="0 0 36 32"
        className="image-rendering-pixelated cursor-pointer drop-shadow-lg transition-transform hover:scale-110 active:scale-95"
        onClick={handlePet}
        role="button"
        aria-label="Acariciar o gatinho"
      >
        {/* Shadow */}
        <ellipse cx="16" cy="30" rx="12" ry="2" fill="hsl(var(--foreground) / 0.1)" />

        {/* Left ear outer */}
        <rect x="4" y="1" width="1" height="1" fill="#4a4a5a" />
        <rect x="5" y="0" width="3" height="1" fill="#4a4a5a" />
        <rect x="3" y="2" width="1" height="3" fill="#4a4a5a" />
        {/* Left ear inner */}
        <rect x="5" y="1" width="2" height="1" fill="#6b6b7b" />
        <rect x="4" y="2" width="3" height="2" fill="#8b7b8b" />
        {/* Right ear outer */}
        <rect x="24" y="1" width="1" height="1" fill="#4a4a5a" />
        <rect x="24" y="0" width="3" height="1" fill="#4a4a5a" />
        <rect x="28" y="2" width="1" height="3" fill="#4a4a5a" />
        {/* Right ear inner */}
        <rect x="25" y="1" width="2" height="1" fill="#6b6b7b" />
        <rect x="25" y="2" width="3" height="2" fill="#8b7b8b" />

        {/* Head */}
        <rect x="4" y="5" width="24" height="2" fill="#5a5a6a" />
        <rect x="3" y="7" width="26" height="8" fill="#5a5a6a" />
        {/* Forehead pattern */}
        <rect x="14" y="6" width="4" height="1" fill="#4a4a5a" />
        <rect x="15" y="7" width="2" height="1" fill="#4a4a5a" />
        {/* Cheeks lighter */}
        <rect x="4" y="11" width="5" height="3" fill="#6b6b7b" />
        <rect x="23" y="11" width="5" height="3" fill="#6b6b7b" />

        {/* Eyes */}
        {mood === "sleeping" ? (
          <>
            <rect x="8" y="10" width="5" height="1" fill="hsl(var(--primary))" />
            <rect x="19" y="10" width="5" height="1" fill="hsl(var(--primary))" />
          </>
        ) : blink ? (
          <>
            <rect x="8" y="10" width="5" height="1" fill="hsl(var(--primary))" />
            <rect x="19" y="10" width="5" height="1" fill="hsl(var(--primary))" />
          </>
        ) : mood === "happy" || mood === "purring" ? (
          <>
            {/* Happy ^ ^ eyes */}
            <rect x="8" y="9" width="5" height="1" fill="hsl(var(--primary))" />
            <rect x="8" y="10" width="1" height="2" fill="hsl(var(--primary))" />
            <rect x="12" y="10" width="1" height="2" fill="hsl(var(--primary))" />
            <rect x="19" y="9" width="5" height="1" fill="hsl(var(--primary))" />
            <rect x="19" y="10" width="1" height="2" fill="hsl(var(--primary))" />
            <rect x="23" y="10" width="1" height="2" fill="hsl(var(--primary))" />
          </>
        ) : (
          <>
            {/* Normal big eyes */}
            <rect x="8" y="8" width="5" height="4" fill="hsl(var(--primary))" />
            <rect x="9" y="8" width="2" height="2" fill="hsl(0 0% 100%)" />
            <rect x="11" y="10" width="1" height="1" fill="hsl(0 0% 100% / 0.5)" />
            <rect x="19" y="8" width="5" height="4" fill="hsl(var(--primary))" />
            <rect x="20" y="8" width="2" height="2" fill="hsl(0 0% 100%)" />
            <rect x="22" y="10" width="1" height="1" fill="hsl(0 0% 100% / 0.5)" />
          </>
        )}

        {/* Nose */}
        <rect x="15" y="12" width="2" height="2" fill="#d4788a" />
        {/* Mouth */}
        {mood === "happy" || mood === "purring" ? (
          <>
            <rect x="14" y="14" width="1" height="1" fill="#4a4a5a" />
            <rect x="17" y="14" width="1" height="1" fill="#4a4a5a" />
            <rect x="15" y="14" width="2" height="1" fill="#c4687a" />
          </>
        ) : (
          <>
            <rect x="14" y="14" width="1" height="1" fill="#4a4a5a" />
            <rect x="17" y="14" width="1" height="1" fill="#4a4a5a" />
          </>
        )}

        {/* Whiskers */}
        <rect x="1" y="11" width="6" height="1" fill="#7a7a8a" />
        <rect x="0" y="13" width="6" height="1" fill="#7a7a8a" />
        <rect x="25" y="11" width="6" height="1" fill="#7a7a8a" />
        <rect x="26" y="13" width="6" height="1" fill="#7a7a8a" />

        {/* Body */}
        <rect x="5" y="15" width="22" height="9" fill="#5a5a6a" />
        {/* Belly */}
        <rect x="11" y="16" width="10" height="7" fill="#7a7a8a" />
        {/* Body stripes */}
        <rect x="7" y="17" width="3" height="1" fill="#4a4a5a" />
        <rect x="22" y="17" width="3" height="1" fill="#4a4a5a" />
        <rect x="8" y="19" width="2" height="1" fill="#4a4a5a" />
        <rect x="22" y="19" width="2" height="1" fill="#4a4a5a" />

        {/* Front paws */}
        <rect x="5" y="24" width="5" height="4" fill="#5a5a6a" />
        <rect x="6" y="27" width="3" height="1" fill="#7a7a8a" />
        <rect x="22" y="24" width="5" height="4" fill="#5a5a6a" />
        <rect x="23" y="27" width="3" height="1" fill="#7a7a8a" />
        {/* Paw pads */}
        <rect x="7" y="26" width="1" height="1" fill="#d4788a" />
        <rect x="24" y="26" width="1" height="1" fill="#d4788a" />

        {/* Tail */}
        <g className={mood === "happy" || mood === "purring" ? "animate-tail-fast" : "animate-tail"}>
          <rect x="27" y="18" width="1" height="1" fill="#5a5a6a" />
          <rect x="28" y="17" width="1" height="1" fill="#5a5a6a" />
          <rect x="29" y="16" width="1" height="1" fill="#5a5a6a" />
          <rect x="30" y="15" width="2" height="1" fill="#5a5a6a" />
          <rect x="31" y="14" width="2" height="1" fill="#4a4a5a" />
          <rect x="32" y="13" width="1" height="1" fill="#4a4a5a" />
        </g>
      </svg>
    </div>
  );
};
