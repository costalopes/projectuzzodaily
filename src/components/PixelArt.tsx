import { useEffect, useState, useCallback } from "react";

// Pixel Coffee with animated steam
export const PixelCoffee = ({ className = "" }: { className?: string }) => (
  <div className={`relative inline-block ${className}`}>
    <svg width="32" height="32" viewBox="0 0 16 16" className="image-rendering-pixelated">
      <g className="animate-steam">
        <rect x="5" y="1" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.3)" />
        <rect x="7" y="0" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.2)" />
        <rect x="9" y="1" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.3)" />
      </g>
      <g className="animate-steam-2">
        <rect x="6" y="2" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.2)" />
        <rect x="8" y="1" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.15)" />
      </g>
      <rect x="3" y="5" width="9" height="1" fill="hsl(var(--primary))" />
      <rect x="3" y="6" width="1" height="7" fill="hsl(var(--primary))" />
      <rect x="11" y="6" width="1" height="7" fill="hsl(var(--primary))" />
      <rect x="3" y="13" width="9" height="1" fill="hsl(var(--primary))" />
      <rect x="4" y="7" width="7" height="6" fill="hsl(38 92% 35%)" />
      <rect x="4" y="7" width="7" height="1" fill="hsl(38 92% 50%)" />
      <rect x="12" y="7" width="2" height="1" fill="hsl(var(--primary))" />
      <rect x="13" y="8" width="1" height="3" fill="hsl(var(--primary))" />
      <rect x="12" y="11" width="2" height="1" fill="hsl(var(--primary))" />
      <rect x="1" y="14" width="13" height="1" fill="hsl(var(--muted-foreground) / 0.3)" />
    </svg>
  </div>
);

type CatMood = "idle" | "happy" | "purring" | "sleeping";

// Big Interactive Pixel Cat
export const PixelCat = ({ className = "" }: { className?: string }) => {
  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState<CatMood>("idle");
  const [pets, setPets] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);

  // Blinking
  useEffect(() => {
    if (mood === "sleeping") return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, [mood]);

  // Auto-sleep after idle
  useEffect(() => {
    if (mood === "idle") {
      const timeout = setTimeout(() => setMood("sleeping"), 30000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

  // Reset mood after purring/happy
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
    
    // Spawn a heart
    const heartId = Date.now();
    setHearts((h) => [...h, heartId]);
    setTimeout(() => setHearts((h) => h.filter((id) => id !== heartId)), 1500);
  }, [pets]);

  const catColor = "hsl(var(--foreground) / 0.65)";
  const catDark = "hsl(var(--foreground) / 0.75)";
  const catLight = "hsl(var(--foreground) / 0.5)";
  const eyeColor = "hsl(var(--primary))";
  const noseColor = "hsl(350 60% 60%)";
  const px = 4; // pixel size

  return (
    <div className={`relative select-none ${className}`}>
      {/* Hearts */}
      {hearts.map((id, i) => (
        <span
          key={id}
          className="absolute text-lg animate-heart-float pointer-events-none"
          style={{ left: `${30 + (i % 3) * 20}px`, top: "-8px" }}
        >
          💖
        </span>
      ))}

      {/* Purr text */}
      {mood === "purring" && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono text-primary animate-pulse whitespace-nowrap">
          purrrr... 🐾
        </span>
      )}
      {mood === "sleeping" && (
        <span className="absolute -top-6 right-0 text-sm animate-float font-mono text-muted-foreground">
          zzZ
        </span>
      )}

      <svg
        width={28 * px}
        height={24 * px}
        viewBox={`0 0 ${28 * 1} ${24 * 1}`}
        className="image-rendering-pixelated cursor-pointer transition-transform hover:scale-105 active:scale-95"
        onClick={handlePet}
        role="button"
        aria-label="Acariciar o gatinho"
      >
        {/* Left ear */}
        <rect x="4" y="0" width="3" height="1" fill={catDark} />
        <rect x="3" y="1" width="1" height="3" fill={catDark} />
        <rect x="4" y="1" width="3" height="2" fill={catLight} />
        {/* Right ear */}
        <rect x="19" y="0" width="3" height="1" fill={catDark} />
        <rect x="22" y="1" width="1" height="3" fill={catDark} />
        <rect x="19" y="1" width="3" height="2" fill={catLight} />
        {/* Head top */}
        <rect x="4" y="4" width="18" height="1" fill={catDark} />
        {/* Head body */}
        <rect x="3" y="5" width="20" height="7" fill={catColor} />
        {/* Eyes */}
        {mood === "sleeping" ? (
          <>
            <rect x="7" y="8" width="4" height="1" fill={eyeColor} />
            <rect x="15" y="8" width="4" height="1" fill={eyeColor} />
          </>
        ) : blink ? (
          <>
            <rect x="7" y="8" width="4" height="1" fill={eyeColor} />
            <rect x="15" y="8" width="4" height="1" fill={eyeColor} />
          </>
        ) : mood === "happy" || mood === "purring" ? (
          <>
            {/* Happy squint eyes */}
            <rect x="7" y="7" width="4" height="1" fill={eyeColor} />
            <rect x="7" y="8" width="1" height="1" fill={eyeColor} />
            <rect x="10" y="8" width="1" height="1" fill={eyeColor} />
            <rect x="15" y="7" width="4" height="1" fill={eyeColor} />
            <rect x="15" y="8" width="1" height="1" fill={eyeColor} />
            <rect x="18" y="8" width="1" height="1" fill={eyeColor} />
          </>
        ) : (
          <>
            {/* Normal eyes */}
            <rect x="7" y="7" width="4" height="3" fill={eyeColor} />
            <rect x="8" y="7" width="2" height="1" fill="hsl(0 0% 100%)" />
            <rect x="15" y="7" width="4" height="3" fill={eyeColor} />
            <rect x="16" y="7" width="2" height="1" fill="hsl(0 0% 100%)" />
          </>
        )}
        {/* Nose */}
        <rect x="12" y="10" width="2" height="1" fill={noseColor} />
        {/* Mouth */}
        {mood === "happy" || mood === "purring" ? (
          <>
            <rect x="11" y="11" width="1" height="1" fill={catDark} />
            <rect x="14" y="11" width="1" height="1" fill={catDark} />
            <rect x="12" y="11" width="2" height="1" fill={noseColor} />
          </>
        ) : (
          <>
            <rect x="11" y="11" width="1" height="1" fill={catDark} />
            <rect x="14" y="11" width="1" height="1" fill={catDark} />
          </>
        )}
        {/* Whiskers */}
        <rect x="2" y="9" width="4" height="1" fill={catLight} />
        <rect x="2" y="11" width="4" height="1" fill={catLight} />
        <rect x="20" y="9" width="4" height="1" fill={catLight} />
        <rect x="20" y="11" width="4" height="1" fill={catLight} />
        {/* Body */}
        <rect x="5" y="12" width="16" height="7" fill={catColor} />
        {/* Belly stripe */}
        <rect x="10" y="13" width="6" height="5" fill={catLight} />
        {/* Front paws */}
        <rect x="5" y="19" width="4" height="3" fill={catDark} />
        <rect x="17" y="19" width="4" height="3" fill={catDark} />
        {/* Tail */}
        <g className={mood === "happy" || mood === "purring" ? "animate-tail-fast" : "animate-tail"}>
          <rect x="21" y="14" width="1" height="1" fill={catColor} />
          <rect x="22" y="13" width="1" height="1" fill={catColor} />
          <rect x="23" y="12" width="1" height="1" fill={catColor} />
          <rect x="24" y="11" width="2" height="1" fill={catColor} />
          <rect x="25" y="10" width="1" height="1" fill={catDark} />
        </g>
      </svg>

      {/* Pet counter */}
      {pets > 0 && (
        <p className="text-[10px] text-muted-foreground/60 text-center mt-1 font-mono">
          {pets} carinho{pets > 1 ? "s" : ""} 💕
        </p>
      )}
    </div>
  );
};

// Pixel Clock with ticking animation
export const PixelClock = ({ className = "" }: { className?: string }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const showColon = time.getSeconds() % 2 === 0;

  return (
    <div className={`font-mono text-2xl md:text-3xl font-bold tracking-wider ${className}`}>
      <span className="text-primary">{hours}</span>
      <span className={`text-primary transition-opacity duration-200 ${showColon ? "opacity-100" : "opacity-20"}`}>:</span>
      <span className="text-primary">{minutes}</span>
    </div>
  );
};

// Background themes
export const BG_THEMES = [
  { id: "clean", label: "Clean", bg: "from-background to-background", accent: "" },
  { id: "sunset", label: "Sunset 🌅", bg: "from-orange-50 to-amber-50", accent: "dark:from-orange-950/20 dark:to-amber-950/20" },
  { id: "ocean", label: "Ocean 🌊", bg: "from-blue-50 to-cyan-50", accent: "dark:from-blue-950/20 dark:to-cyan-950/20" },
  { id: "forest", label: "Forest 🌿", bg: "from-emerald-50 to-green-50", accent: "dark:from-emerald-950/20 dark:to-green-950/20" },
  { id: "night", label: "Night 🌙", bg: "from-slate-100 to-indigo-50", accent: "dark:from-slate-950/30 dark:to-indigo-950/20" },
  { id: "sakura", label: "Sakura 🌸", bg: "from-pink-50 to-rose-50", accent: "dark:from-pink-950/20 dark:to-rose-950/20" },
] as const;

export type BgThemeId = (typeof BG_THEMES)[number]["id"];
