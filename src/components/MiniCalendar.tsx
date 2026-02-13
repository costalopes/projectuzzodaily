import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Circle, Check, Loader2 } from "lucide-react";
import type { Task } from "@/components/TaskDetailDialog";

const DAYS_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const EVENTS: Record<string, { text: string; color: string }[]> = {
  "2026-02-13": [
    { text: "📞 Call cliente 15h", color: "bg-primary/15 text-primary" },
    { text: "🚀 Deploy v2.1", color: "bg-success/15 text-success" },
  ],
  "2026-02-16": [{ text: "📝 Review sprint", color: "bg-accent/20 text-accent-foreground" }],
  "2026-02-20": [{ text: "🎂 Aniversário Ana", color: "bg-destructive/10 text-destructive" }],
  "2026-02-25": [{ text: "💼 Apresentação Q1", color: "bg-primary/15 text-primary" }],
};

const STATUS_ICON = {
  todo: Circle,
  in_progress: Loader2,
  done: Check,
};

const IMPORTANCE_DOT: Record<string, string> = {
  alta: "bg-destructive",
  média: "bg-warning",
  baixa: "bg-muted-foreground/40",
};

interface MiniCalendarProps {
  tasks?: Task[];
}

export const MiniCalendar = ({ tasks = [] }: MiniCalendarProps) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const dateKey = (day: number) =>
    `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  // Get tasks for a specific date key
  const getTasksForDate = (dk: string) =>
    tasks.filter((t) => t.dueDate && t.dueDate.startsWith(dk));

  // Check if a day has events or tasks
  const dayHasItems = (day: number) => {
    const dk = dateKey(day);
    return !!EVENTS[dk] || getTasksForDate(dk).length > 0;
  };

  const selectedEvents = selectedDate ? EVENTS[selectedDate] || [] : [];
  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          📅 <span className="font-display">{MONTHS_PT[currentMonth]} {currentYear}</span>
        </h3>
        <div className="flex gap-0.5">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS_PT.map((d) => (
          <div key={d} className="text-[9px] text-center text-muted-foreground/50 font-mono font-semibold py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dk = dateKey(day);
          const hasItems = dayHasItems(day);
          const isSelected = selectedDate === dk;
          return (
            <button
              key={dk}
              onClick={() => setSelectedDate(isSelected ? null : dk)}
              className={cn(
                "aspect-square rounded-lg text-[11px] font-medium flex flex-col items-center justify-center transition-all relative",
                isToday(day) && !isSelected && "bg-primary text-primary-foreground font-bold",
                isSelected && "bg-primary text-primary-foreground ring-2 ring-primary/30 scale-110",
                !isToday(day) && !isSelected && "hover:bg-muted/40 text-foreground",
              )}
            >
              {day}
              {hasItems && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail panel */}
      {selectedDate && (
        <div className="border-t border-border/30 pt-3 space-y-2 animate-fade-in">
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
            {selectedDate.split("-")[2]}/{selectedDate.split("-")[1]}
          </p>

          {/* Events */}
          {selectedEvents.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">Eventos</p>
              {selectedEvents.map((ev, i) => (
                <div key={i} className={cn("text-[11px] rounded-lg px-3 py-2 font-medium", ev.color)}>
                  {ev.text}
                </div>
              ))}
            </div>
          )}

          {/* Tasks */}
          {selectedTasks.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">Tarefas</p>
              {selectedTasks.map((task) => {
                const Icon = STATUS_ICON[task.status];
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 bg-muted/20 border border-border/20 rounded-lg px-3 py-2"
                  >
                    <Icon className={cn(
                      "w-3 h-3 shrink-0",
                      task.status === "done" ? "text-success" : task.status === "in_progress" ? "text-primary animate-spin" : "text-muted-foreground/40"
                    )} />
                    <span className={cn(
                      "text-[11px] font-mono truncate flex-1",
                      task.status === "done" && "line-through text-muted-foreground/50"
                    )}>
                      {task.text}
                    </span>
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", IMPORTANCE_DOT[task.importance])} />
                  </div>
                );
              })}
            </div>
          )}

          {selectedEvents.length === 0 && selectedTasks.length === 0 && (
            <p className="text-[11px] text-muted-foreground/40 font-mono text-center py-3">
              Nenhum item neste dia
            </p>
          )}
        </div>
      )}
    </div>
  );
};
