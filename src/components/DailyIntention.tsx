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
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        intenção do dia
      </h3>

      {saved ? (
        <div className="text-center py-3">
          <p className="text-sm text-foreground font-medium italic leading-relaxed">
            "{intention}"
          </p>
          <button
            onClick={() => { setSaved(false); setIntention(""); }}
            className="text-[10px] text-muted-foreground/50 mt-3 hover:text-muted-foreground transition-colors font-mono"
          >
            trocar
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Qual sua intenção hoje?"
            className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            onClick={pickRandom}
            className="w-full text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1 font-mono"
          >
            ou escolha uma aleatória ↻
          </button>
        </div>
      )}
    </div>
  );
};
