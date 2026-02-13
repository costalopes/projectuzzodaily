import { useState } from "react";
import { cn } from "@/lib/utils";

const MOODS = [
  { emoji: "🔥", label: "On fire", color: "bg-accent/15 border-accent/30" },
  { emoji: "😊", label: "Bem", color: "bg-success/15 border-success/30" },
  { emoji: "😐", label: "Meh", color: "bg-muted border-border" },
  { emoji: "😴", label: "Tired", color: "bg-primary/15 border-primary/30" },
  { emoji: "😤", label: "Grr", color: "bg-destructive/15 border-destructive/30" },
];

export const MoodTracker = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        como você tá?
      </h3>
      <div className="flex justify-between gap-0.5">
        {MOODS.map((mood, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg border transition-all",
              selected === i
                ? `${mood.color} scale-105`
                : "border-transparent hover:bg-muted/40"
            )}
          >
            <span className={cn("text-base transition-transform", selected === i && "scale-110")}>
              {mood.emoji}
            </span>
            <span className="text-[8px] text-muted-foreground">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
