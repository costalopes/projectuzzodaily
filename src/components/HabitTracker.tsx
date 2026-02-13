import { useState } from "react";
import { cn } from "@/lib/utils";

interface Habit {
  id: string;
  label: string;
  icon: string;
  done: boolean;
}

const DEFAULT_HABITS: Habit[] = [
  { id: "water", label: "Beber água", icon: "💧", done: false },
  { id: "stretch", label: "Alongar", icon: "🧘", done: false },
  { id: "walk", label: "Caminhar", icon: "🚶", done: true },
  { id: "read", label: "Ler 20min", icon: "📖", done: false },
  { id: "meditate", label: "Meditar", icon: "🧠", done: false },
  { id: "sleep", label: "Dormir cedo", icon: "🌙", done: false },
];

export const HabitTracker = () => {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);

  const toggle = (id: string) =>
    setHabits((h) => h.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const doneCount = habits.filter((h) => h.done).length;

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          hábitos do dia
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground/60">
          {doneCount}/{habits.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => toggle(habit.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
              habit.done
                ? "bg-success/10 border border-success/20"
                : "hover:bg-muted/40 border border-transparent"
            )}
          >
            <span className="text-sm">{habit.icon}</span>
            <span
              className={cn(
                "text-xs flex-1 transition-all",
                habit.done ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {habit.label}
            </span>
            <div
              className={cn(
                "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all",
                habit.done
                  ? "bg-success border-success"
                  : "border-muted-foreground/20"
              )}
            >
              {habit.done && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-success rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / habits.length) * 100}%` }}
        />
      </div>
    </div>
  );
};
