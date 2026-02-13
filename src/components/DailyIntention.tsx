import { useState } from "react";

const INTENTIONS = [
  "Focar no que importa",
  "Ser gentil comigo",
  "Fazer progresso, não perfeição",
  "Uma coisa de cada vez",
  "Aproveitar o processo",
];

export const DailyIntention = () => {
  const [intention, setIntention] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (intention.trim()) setSaved(true);
  };

  const pickRandom = () => {
    const random = INTENTIONS[Math.floor(Math.random() * INTENTIONS.length)];
    setIntention(random);
    setSaved(true);
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        intenção do dia
      </h3>

      {saved ? (
        <div className="text-center py-1">
          <p className="text-xs text-foreground font-medium italic leading-relaxed truncate">
            "{intention}"
          </p>
          <button
            onClick={() => { setSaved(false); setIntention(""); }}
            className="text-[9px] text-muted-foreground/50 mt-1 hover:text-muted-foreground transition-colors font-mono"
          >
            trocar
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Qual sua intenção?"
            className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
          />
          <button
            onClick={pickRandom}
            className="w-full text-[9px] text-muted-foreground/50 hover:text-muted-foreground transition-colors font-mono"
          >
            aleatória ↻
          </button>
        </div>
      )}
    </div>
  );
};
