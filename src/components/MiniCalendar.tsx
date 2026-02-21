import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Circle, Check, Loader2, Plus, X, CalendarPlus } from "lucide-react";
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
  onAddEvent?: (date: string, text: string) => void;
}

export const MiniCalendar = ({ tasks = [], onAddEvent }: MiniCalendarProps) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: string } | null>(null);
  const [addingEvent, setAddingEvent] = useState<string | null>(null);
  const [newEventText, setNewEventText] = useState("");
  const [localEvents, setLocalEvents] = useState<Record<string, { text: string; color: string }[]>>({});
  const contextRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    // Use click (not mousedown) to avoid closing immediately on the same right-click
    const timer = setTimeout(() => document.addEventListener("click", handler), 0);
    const ctxHandler = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("contextmenu", ctxHandler);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
      document.removeEventListener("contextmenu", ctxHandler);
    };
  }, [contextMenu]);

  // Focus input when adding event
  useEffect(() => {
    if (addingEvent && inputRef.current) inputRef.current.focus();
  }, [addingEvent]);

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

  const getTasksForDate = (dk: string) =>
    tasks.filter((t) => t.dueDate && t.dueDate.startsWith(dk));

  const getAllEvents = (dk: string) => [
    ...(EVENTS[dk] || []),
    ...(localEvents[dk] || []),
  ];

  const dayHasItems = (day: number) => {
    const dk = dateKey(day);
    return getAllEvents(dk).length > 0 || getTasksForDate(dk).length > 0;
  };

  const handleContextMenu = (e: React.MouseEvent, day: number) => {
    e.preventDefault();
    e.stopPropagation();
    const dk = dateKey(day);
    setContextMenu({ x: e.clientX, y: e.clientY, date: dk });
  };

  const handleAddEventFromContext = () => {
    if (!contextMenu) return;
    setAddingEvent(contextMenu.date);
    setSelectedDate(contextMenu.date);
    setContextMenu(null);
    setNewEventText("");
  };

  const handleAddEventFromButton = () => {
    const todayKey = dateKey(today.getDate());
    setAddingEvent(selectedDate || todayKey);
    if (!selectedDate) setSelectedDate(todayKey);
    setNewEventText("");
  };

  const submitEvent = () => {
    if (!newEventText.trim() || !addingEvent) return;
    const colors = [
      "bg-primary/15 text-primary",
      "bg-accent/20 text-accent-foreground",
      "bg-success/15 text-success",
      "bg-destructive/10 text-destructive",
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    setLocalEvents(prev => ({
      ...prev,
      [addingEvent]: [...(prev[addingEvent] || []), { text: newEventText.trim(), color }],
    }));
    onAddEvent?.(addingEvent, newEventText.trim());
    setNewEventText("");
    setAddingEvent(null);
  };

  const removeLocalEvent = (dk: string, idx: number) => {
    setLocalEvents(prev => {
      const events = [...(prev[dk] || [])];
      events.splice(idx, 1);
      return { ...prev, [dk]: events };
    });
  };

  const selectedEvents = selectedDate ? getAllEvents(selectedDate) : [];
  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const formatDateLabel = (dk: string) => {
    const parts = dk.split("-");
    return `${parts[2]}/${parts[1]}`;
  };

  return (
    <div className="space-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          📅 <span className="font-display">{MONTHS_PT[currentMonth]} {currentYear}</span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddEventFromButton}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
            title="Registrar evento"
          >
            <CalendarPlus className="w-4 h-4" />
          </button>
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
              onContextMenu={(e) => handleContextMenu(e, day)}
              className={cn(
                "aspect-square rounded-lg text-[11px] font-medium flex flex-col items-center justify-center transition-all relative",
                isSelected && "bg-primary text-primary-foreground ring-2 ring-primary/30 scale-110",
                isToday(day) && !isSelected && (selectedDate ? "ring-2 ring-primary text-primary font-bold" : "bg-primary text-primary-foreground font-bold"),
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

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextRef}
          className="fixed z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[180px] animate-fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground/50 border-b border-border/30">
            {formatDateLabel(contextMenu.date)}
          </div>
          <button
            onClick={handleAddEventFromContext}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-mono hover:bg-muted/40 transition-colors text-foreground"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            Registrar evento
          </button>
          <button
            onClick={() => {
              setSelectedDate(contextMenu.date);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-mono hover:bg-muted/40 transition-colors text-foreground"
          >
            <Circle className="w-3.5 h-3.5 text-muted-foreground" />
            Ver detalhes
          </button>
        </div>
      )}

      {/* Adding event inline */}
      {addingEvent && (
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-3 space-y-2 animate-fade-in">
          <p className="text-[10px] font-mono text-primary uppercase tracking-wider">
            Novo evento — {formatDateLabel(addingEvent)}
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={newEventText}
              onChange={(e) => setNewEventText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitEvent(); if (e.key === "Escape") setAddingEvent(null); }}
              placeholder="Ex: 📝 Reunião às 14h"
              className="flex-1 bg-muted/30 border border-border/40 rounded-md px-3 py-1.5 text-sm font-mono placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-colors"
            />
            <button onClick={submitEvent} className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setAddingEvent(null)} className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Selected day detail panel */}
      {selectedDate && !addingEvent && (
        <div className="border-t border-border/30 pt-3 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
              {formatDateLabel(selectedDate)}
            </p>
            <button
              onClick={() => { setAddingEvent(selectedDate); setNewEventText(""); }}
              className="flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-3 h-3" /> adicionar
            </button>
          </div>

          {/* Events */}
          {selectedEvents.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">Eventos</p>
              {selectedEvents.map((ev, i) => {
                const isLocal = i >= (EVENTS[selectedDate]?.length || 0);
                const localIdx = i - (EVENTS[selectedDate]?.length || 0);
                return (
                  <div key={i} className={cn("text-[11px] rounded-lg px-3 py-2 font-medium flex items-center justify-between group/ev", ev.color)}>
                    <span>{ev.text}</span>
                    {isLocal && (
                      <button
                        onClick={() => removeLocalEvent(selectedDate, localIdx)}
                        className="opacity-0 group-hover/ev:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
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
