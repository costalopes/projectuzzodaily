import { useEffect, useState } from "react";

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
      <rect x="3" y="5" width="9" height="1" fill="hsl(var(--accent))" />
      <rect x="3" y="6" width="1" height="7" fill="hsl(var(--accent))" />
      <rect x="11" y="6" width="1" height="7" fill="hsl(var(--accent))" />
      <rect x="3" y="13" width="9" height="1" fill="hsl(var(--accent))" />
      <rect x="4" y="7" width="7" height="6" fill="hsl(30 60% 30%)" />
      <rect x="4" y="7" width="7" height="1" fill="hsl(30 60% 45%)" />
      <rect x="12" y="7" width="2" height="1" fill="hsl(var(--accent))" />
      <rect x="13" y="8" width="1" height="3" fill="hsl(var(--accent))" />
      <rect x="12" y="11" width="2" height="1" fill="hsl(var(--accent))" />
      <rect x="1" y="14" width="13" height="1" fill="hsl(var(--muted-foreground) / 0.2)" />
    </svg>
  </div>
);

export const PixelClock = ({ className = "" }: { className?: string }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds();
  const showColon = seconds % 2 === 0;

  return (
    <div className={`font-mono text-2xl md:text-3xl font-bold tracking-wider ${className}`}>
      <span className="text-primary">{hours}</span>
      <span className={`text-primary transition-opacity duration-200 ${showColon ? "opacity-100" : "opacity-20"}`}>:</span>
      <span className="text-primary">{minutes}</span>
    </div>
  );
};
