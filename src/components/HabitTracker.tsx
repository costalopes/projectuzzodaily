import { useState } from "react";
import { cn } from "@/lib/utils";
import { Droplets, Dumbbell, BookOpen, Apple, BedDouble } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  icon: React.ElementType;
  days: boolean[];
}

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const today = new Date().getDay();
const todayIndex = today === 0 ? 6 : today - 1;

const HabitTracker = () => {
  const [habits, setHabits] = useState<Habit[]>([
    { id: "1", name: "Beber água", icon: Droplets, days: [true, true, false, false, false, false, false] },
    { id: "2", name: "Exercício", icon: Dumbbell, days: [true, false, true, false, false, false, false] },
    { id: "3", name: "Leitura", icon: BookOpen, days: [true, true, true, false, false, false, false] },
    { id: "4", name: "Alimentação", icon: Apple, days: [false, true, false, false, false, false, false] },
    { id: "5", name: "Dormir cedo", icon: BedDouble, days: [true, true, false, false, false, false, false] },
  ]);

  const toggleDay = (habitId: string, dayIndex: number) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? { ...h, days: h.days.map((d, i) => (i === dayIndex ? !d : d)) }
          : h
      )
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif">Hábitos da Semana</h2>

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_repeat(7,2.5rem)] gap-1 px-4 py-3 border-b border-border/50">
          <span className="text-xs text-muted-foreground font-medium">Hábito</span>
          {weekDays.map((d, i) => (
            <span
              key={d}
              className={cn(
                "text-xs text-center font-medium",
                i === todayIndex ? "text-primary" : "text-muted-foreground"
              )}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Rows */}
        {habits.map((habit, idx) => {
          const Icon = habit.icon;
          const streak = habit.days.filter(Boolean).length;
          return (
            <div
              key={habit.id}
              className={cn(
                "grid grid-cols-[1fr_repeat(7,2.5rem)] gap-1 px-4 py-3 items-center animate-fade-in",
                idx < habits.length - 1 && "border-b border-border/30"
              )}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{habit.name}</span>
                <span className="text-xs text-muted-foreground">{streak}/7</span>
              </div>
              {habit.days.map((done, dayIdx) => (
                <button
                  key={dayIdx}
                  onClick={() => toggleDay(habit.id, dayIdx)}
                  className={cn(
                    "w-7 h-7 rounded-lg mx-auto transition-all",
                    done
                      ? "bg-habit-complete/20 border-2 border-habit-complete"
                      : "bg-habit-incomplete border-2 border-transparent hover:border-muted-foreground/30",
                    dayIdx === todayIndex && !done && "border-primary/30"
                  )}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HabitTracker;
