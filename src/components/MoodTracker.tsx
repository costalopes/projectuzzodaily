import { useState } from "react";
import { cn } from "@/lib/utils";

const MOODS = [
  { emoji: "🔥", label: "On fire", color: "bg-accent/15 border-accent/30" },
  { emoji: "😊", label: "Bem", color: "bg-success/15 border-success/30" },
  { emoji: "😐", label: "Meh", color: "bg-muted border-border" },
  { emoji: "😴", label: "Cansado", color: "bg-primary/15 border-primary/30" },
  { emoji: "😤", label: "Frustrado", color: "bg-destructive/15 border-destructive/30" },
];

export const MoodTracker = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        como você tá?
      </h3>

      <div className="flex justify-between gap-1">
        {MOODS.map((mood, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all",
              selected === i
                ? `${mood.color} scale-105`
                : "border-transparent hover:bg-muted/40"
            )}
          >
            <span className={cn("text-xl transition-transform", selected === i && "scale-110")}>
              {mood.emoji}
            </span>
            <span className="text-[9px] text-muted-foreground font-medium">{mood.label}</span>
          </button>
        ))}
      </div>

      {selected !== null && (
        <p className="text-[10px] text-muted-foreground/50 text-center mt-3 font-mono animate-fade-in">
          {selected === 0 && "produtividade no máximo!"}
          {selected === 1 && "bom dia pra codar"}
          {selected === 2 && "tudo bem, um passo de cada vez"}
          {selected === 3 && "talvez uma pausa ajude"}
          {selected === 4 && "respira... vai dar certo"}
        </p>
      )}
    </div>
  );
};
