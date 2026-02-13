import { useEffect, useState } from "react";

// Pixel Coffee with animated steam
export const PixelCoffee = ({ className = "" }: { className?: string }) => (
  <div className={`relative inline-block ${className}`}>
    <svg width="32" height="32" viewBox="0 0 16 16" className="image-rendering-pixelated">
      {/* Steam */}
      <g className="animate-steam">
        <rect x="5" y="1" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.3)" />
        <rect x="7" y="0" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.2)" />
        <rect x="9" y="1" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.3)" />
      </g>
      <g className="animate-steam-2">
        <rect x="6" y="2" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.2)" />
        <rect x="8" y="1" width="1" height="1" fill="hsl(var(--muted-foreground) / 0.15)" />
      </g>
      {/* Cup */}
      <rect x="3" y="5" width="9" height="1" fill="hsl(var(--primary))" />
      <rect x="3" y="6" width="1" height="7" fill="hsl(var(--primary))" />
      <rect x="11" y="6" width="1" height="7" fill="hsl(var(--primary))" />
      <rect x="3" y="13" width="9" height="1" fill="hsl(var(--primary))" />
      {/* Coffee liquid */}
      <rect x="4" y="7" width="7" height="6" fill="hsl(38 92% 35%)" />
      <rect x="4" y="7" width="7" height="1" fill="hsl(38 92% 50%)" />
      {/* Handle */}
      <rect x="12" y="7" width="2" height="1" fill="hsl(var(--primary))" />
      <rect x="13" y="8" width="1" height="3" fill="hsl(var(--primary))" />
      <rect x="12" y="11" width="2" height="1" fill="hsl(var(--primary))" />
      {/* Plate */}
      <rect x="1" y="14" width="13" height="1" fill="hsl(var(--muted-foreground) / 0.3)" />
    </svg>
  </div>
);

// Pixel Cat with blinking animation
export const PixelCat = ({ className = "" }: { className?: string }) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative inline-block ${className}`}>
      <svg width="40" height="36" viewBox="0 0 20 18" className="image-rendering-pixelated">
        {/* Ears */}
        <rect x="3" y="0" width="2" height="1" fill="hsl(var(--foreground) / 0.7)" />
        <rect x="2" y="1" width="1" height="2" fill="hsl(var(--foreground) / 0.7)" />
        <rect x="3" y="1" width="2" height="1" fill="hsl(var(--foreground) / 0.5)" />
        <rect x="14" y="0" width="2" height="1" fill="hsl(var(--foreground) / 0.7)" />
        <rect x="16" y="1" width="1" height="2" fill="hsl(var(--foreground) / 0.7)" />
        <rect x="14" y="1" width="2" height="1" fill="hsl(var(--foreground) / 0.5)" />
        {/* Head */}
        <rect x="3" y="3" width="13" height="1" fill="hsl(var(--foreground) / 0.7)" />
        <rect x="2" y="4" width="15" height="5" fill="hsl(var(--foreground) / 0.7)" />
        {/* Eyes */}
        {blink ? (
          <>
            <rect x="5" y="6" width="3" height="1" fill="hsl(var(--primary))" />
            <rect x="11" y="6" width="3" height="1" fill="hsl(var(--primary))" />
          </>
        ) : (
          <>
            <rect x="5" y="5" width="3" height="2" fill="hsl(var(--primary))" />
            <rect x="6" y="5" width="1" height="1" fill="hsl(0 0% 100%)" />
            <rect x="11" y="5" width="3" height="2" fill="hsl(var(--primary))" />
            <rect x="12" y="5" width="1" height="1" fill="hsl(0 0% 100%)" />
          </>
        )}
        {/* Nose */}
        <rect x="9" y="7" width="1" height="1" fill="hsl(350 60% 60%)" />
        {/* Mouth */}
        <rect x="8" y="8" width="1" height="1" fill="hsl(var(--foreground) / 0.5)" />
        <rect x="10" y="8" width="1" height="1" fill="hsl(var(--foreground) / 0.5)" />
        {/* Body */}
        <rect x="4" y="9" width="11" height="5" fill="hsl(var(--foreground) / 0.6)" />
        {/* Paws */}
        <rect x="4" y="14" width="3" height="2" fill="hsl(var(--foreground) / 0.7)" />
        <rect x="12" y="14" width="3" height="2" fill="hsl(var(--foreground) / 0.7)" />
        {/* Tail - animated */}
        <g className="animate-tail">
          <rect x="15" y="10" width="1" height="1" fill="hsl(var(--foreground) / 0.6)" />
          <rect x="16" y="9" width="1" height="1" fill="hsl(var(--foreground) / 0.6)" />
          <rect x="17" y="8" width="2" height="1" fill="hsl(var(--foreground) / 0.6)" />
        </g>
      </svg>
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
