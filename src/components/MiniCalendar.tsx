import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Some sample events
const EVENTS: Record<string, string[]> = {
  "2026-02-13": ["📞 Call cliente", "🚀 Deploy v2"],
  "2026-02-16": ["📝 Review sprint"],
  "2026-02-20": ["🎂 Aniversário Ana"],
  "2026-02-25": ["💼 Apresentação"],
};

export const MiniCalendar = () => {
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

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const selectedEvents = selectedDate ? EVENTS[selectedDate] || [] : [];

  return (
    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">
          {MONTHS_PT[currentMonth]} {currentYear}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_PT.map((d) => (
          <div key={d} className="text-[10px] text-center text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dk = dateKey(day);
          const hasEvent = !!EVENTS[dk];
          const isSelected = selectedDate === dk;
          return (
            <button
              key={dk}
              onClick={() => setSelectedDate(isSelected ? null : dk)}
              className={cn(
                "aspect-square rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all relative",
                isToday(day) && !isSelected && "bg-primary text-primary-foreground",
                isSelected && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                !isToday(day) && !isSelected && "hover:bg-muted text-foreground",
              )}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-warning" />
              )}
            </button>
          );
        })}
      </div>

      {/* Events */}
      {selectedDate && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5 animate-fade-in">
          {selectedEvents.length > 0 ? (
            selectedEvents.map((ev, i) => (
              <div key={i} className="text-xs text-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                {ev}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhum evento</p>
          )}
        </div>
      )}
    </div>
  );
};
