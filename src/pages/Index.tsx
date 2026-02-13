import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, Check, Trash2, Flame, ArrowRight, LayoutList, Image as ImageIcon, Terminal, Timer, CalendarDays, ListChecks, StickyNote, Droplets, Coffee, Circle, Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PixelClock } from "@/components/PixelArt";
import { PixelCatCorner, type CatEvent } from "@/components/PixelCatCorner";
import { PomodoroWidget } from "@/components/PomodoroWidget";
import { QuickNotes } from "@/components/QuickNotes";
import { MiniCalendar } from "@/components/MiniCalendar";
import { BackgroundPicker, PRESET_GRADIENTS } from "@/components/BackgroundPicker";
import { AmbientParticles } from "@/components/AmbientParticles";
import { CodeQuote } from "@/components/CodeQuote";
import { HabitTracker } from "@/components/HabitTracker";
import { WaterTracker } from "@/components/WaterTracker";
import { CoffeeTracker } from "@/components/CoffeeTracker";
import { TaskDetailDialog, type Task, type TaskStatus } from "@/components/TaskDetailDialog";
import { LofiPlayer } from "@/components/LofiPlayer";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import deskBanner from "@/assets/desk-banner.jpg";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return { text: "Boa madrugada", emoji: "🌌", sub: "Codando até tarde?" };
  if (h < 12) return { text: "Bom dia", emoji: "☕", sub: "Um café e bora codar!" };
  if (h < 18) return { text: "Boa tarde", emoji: "☀️", sub: "Bora ser produtivo!" };
  return { text: "Boa noite", emoji: "🌙", sub: "Sessão noturna de coding!" };
};

const STATUS_FILTERS: { id: TaskStatus; label: string; icon: typeof Circle }[] = [
  { id: "todo", label: "// a fazer", icon: Circle },
  { id: "in_progress", label: "// em progresso", icon: Loader2 },
  { id: "done", label: "// concluídas", icon: Check },
];

type WidgetTab = "timer" | "calendar" | "habits" | "notes";

const WIDGET_TABS: { id: WidgetTab; label: string; icon: typeof Timer; file: string }[] = [
  { id: "timer", label: "pomodoro", icon: Timer, file: "timer.ts" },
  { id: "calendar", label: "calendar", icon: CalendarDays, file: "cal.ts" },
  { id: "habits", label: "habits", icon: ListChecks, file: "habits.ts" },
  { id: "notes", label: "notes", icon: StickyNote, file: "notes.ts" },
];

const Index = () => {
  const greeting = getGreeting();
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Revisar PR do frontend", status: "done", importance: "alta", description: "", notes: [], createdAt: "hoje", dueDate: new Date().toISOString() },
    { id: "2", text: "Setup CI/CD pipeline", status: "todo", importance: "alta", description: "Configurar GitHub Actions para deploy automático", notes: [], createdAt: "hoje", dueDate: new Date(Date.now() + 86400000).toISOString() },
    { id: "3", text: "Design system — tokens de cor", status: "done", importance: "média", description: "", notes: [], createdAt: "ontem" },
    { id: "4", text: "Documentar API endpoints", status: "in_progress", importance: "média", description: "Swagger + exemplos de request/response", notes: ["[14:30] Iniciando pela rota de auth"], createdAt: "hoje", dueDate: new Date().toISOString() },
    { id: "5", text: "Call com cliente às 15h", status: "todo", importance: "baixa", description: "", notes: [], createdAt: "hoje" },
    { id: "6", text: "Refatorar hook useAuth", status: "in_progress", importance: "média", description: "", notes: [], createdAt: "ontem", dueDate: new Date(Date.now() + 172800000).toISOString() },
  ]);

  const [newTask, setNewTask] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [creatingTask, setCreatingTask] = useState<Task | null>(null);
  const [bgGradient, setBgGradient] = useState(PRESET_GRADIENTS[0].class);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [filter, setFilter] = useState<TaskStatus>("todo");
  const [activeTab, setActiveTab] = useState<WidgetTab>("timer");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewByDay, setViewByDay] = useState(false);
  const [catEvent, setCatEvent] = useState<CatEvent | null>(null);

  const emitCatEvent = useCallback((type: CatEvent["type"]) => {
    setCatEvent({ type, timestamp: Date.now() });
  }, []);

  // Check for urgent overdue tasks periodically
  useEffect(() => {
    const check = () => {
      const hasUrgentOverdue = tasks.some(t =>
        t.status !== "done" && t.importance === "alta" && t.dueDate &&
        isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))
      );
      if (hasUrgentOverdue) emitCatEvent("urgent_overdue");
    };
    const interval = setInterval(check, 60000); // check every minute
    check(); // initial check
    return () => clearInterval(interval);
  }, [tasks, emitCatEvent]);

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const streak = 7;

  const toggleTask = (id: string) => {
    setTasks((p) => p.map((t) => {
      if (t.id === id) {
        const newStatus: TaskStatus = t.status === "done" ? "todo" : "done";
        if (newStatus === "done") {
          setTaskCompleted(true);
          setTimeout(() => setTaskCompleted(false), 100);
          emitCatEvent("task_complete");
        }
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const draft: Task = { id: Date.now().toString(), text: newTask.trim(), status: "todo", importance: "média", description: "", notes: [], createdAt: "agora" };
    setTasks((p) => [...p, draft]);
    setNewTask("");
    setShowInput(false);
    setCreatingTask(draft);
  };

  const startNewTask = () => {
    const draft: Task = { id: Date.now().toString(), text: "", status: "todo", importance: "média", description: "", notes: [], createdAt: "agora" };
    setCreatingTask(draft);
  };

  const updateTask = (updated: Task) => {
    setTasks((p) => p.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const deleteTask = (id: string) => setTasks((p) => p.filter((t) => t.id !== id));

  const filteredTasks = tasks.filter((t) => t.status === filter);
  const todoCount = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;

  // Group tasks by due date for day view
  const groupedByDay = useMemo(() => {
    if (!viewByDay) return null;
    const groups: Record<string, Task[]> = {};
    const noDue: Task[] = [];
    filteredTasks.forEach((t) => {
      if (t.dueDate) {
        const key = format(parseISO(t.dueDate), "yyyy-MM-dd");
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      } else {
        noDue.push(t);
      }
    });
    const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    if (noDue.length) sorted.push(["sem-prazo", noDue]);
    return sorted;
  }, [filteredTasks, viewByDay]);

  const renderTaskRow = (task: Task, idx: number) => {
    const isDone = task.status === "done";
    const isInProgress = task.status === "in_progress";
    const hasDue = !!task.dueDate;
    const dueDate = hasDue ? parseISO(task.dueDate!) : null;
    const overdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !isDone;
    return (
      <div key={task.id}
        onClick={() => setSelectedTask(task)}
        className={cn(
          "grid grid-cols-[2rem_auto_1fr_auto_auto] gap-2 items-center px-3 py-3 rounded-xl hover:bg-muted/30 group transition-all cursor-pointer border border-transparent hover:border-border/30",
          isDone && "opacity-40 hover:opacity-70"
        )}>
        <span className="text-[10px] font-mono text-muted-foreground/30 text-right select-none">{idx + 1}</span>
        <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
          className={cn(
            "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
            isDone ? "bg-success/80 border-success/80" : "border-muted-foreground/20 hover:border-primary hover:bg-primary/10"
          )}>
          {isDone && <Check className="w-2.5 h-2.5 text-success-foreground" />}
        </button>
        <div className="min-w-0">
          <span className={cn("text-sm truncate font-mono block", isDone ? "line-through text-muted-foreground" : "text-foreground")}>
            {task.text}
          </span>
          <div className="flex items-center gap-2">
            {task.description && (
              <span className="text-[10px] text-muted-foreground/40 font-mono truncate">{task.description}</span>
            )}
            {hasDue && !viewByDay && (
              <span className={cn("text-[9px] font-mono flex items-center gap-0.5 shrink-0",
                overdue ? "text-urgent" : "text-muted-foreground/40")}>
                <CalendarIcon className="w-2.5 h-2.5" />
                {isToday(dueDate!) ? "hoje" : isTomorrow(dueDate!) ? "amanhã" : format(dueDate!, "dd/MM")}
              </span>
            )}
          </div>
        </div>
        <span className={cn(
          "hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg border",
          isDone ? "bg-success/10 border-success/20 text-success" :
          isInProgress ? "bg-primary/10 border-primary/20 text-primary" :
          "bg-accent/10 border-accent/20 text-accent"
        )}>
          {isInProgress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isDone ? "Concluída" : isInProgress ? "Em progresso" : "A fazer"}
        </span>
        <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all w-7 flex justify-center">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  const renderWidget = () => {
    switch (activeTab) {
      case "timer": return <PomodoroWidget onTimerEnd={() => emitCatEvent("pomodoro_end")} onTimerStart={() => emitCatEvent("pomodoro_start")} />;
      case "calendar": return <MiniCalendar />;
      case "habits": return <HabitTracker />;
      case "notes": return <QuickNotes />;
    }
  };

  return (
    <div className="h-screen overflow-hidden relative flex flex-col">
      {/* BG — behind everything */}
      {customBg ? (
        <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${customBg})` }}>
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
      ) : (
        <div className="fixed inset-0 z-0 bg-background">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>
      )}

      <AmbientParticles />
      <PixelCatCorner onTaskComplete={taskCompleted} lastEvent={catEvent} />
      <LofiPlayer onPlayingChange={(p) => emitCatEvent(p ? "music_play" : "music_stop")} />

      {/* Main content — z-10 above background */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Compact banner */}
        <div className="relative w-full h-28 md:h-36 shrink-0 overflow-hidden">
          <img src={deskBanner} alt="Cozy dev workspace" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

          <button onClick={() => setShowBgPicker(!showBgPicker)}
            className="absolute top-3 right-3 bg-card/40 backdrop-blur-xl border border-border/30 rounded-xl p-2 hover:bg-card/60 transition-all group z-20">
            <ImageIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {/* Terminal overlay */}
          <div className="absolute bottom-3 left-4 font-mono text-[10px] hidden md:flex items-center gap-4 z-20">
            <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-primary" />
              <span className="text-success">~</span>
              <span className="text-muted-foreground/60">/workspace</span>
              <span className="text-foreground/30">$</span>
              <span className="text-primary">npm run dev</span>
              <span className="animate-pulse text-primary">▊</span>
            </div>
          </div>
        </div>

        {/* BG Picker */}
        {showBgPicker && (
          <div className="max-w-6xl mx-auto px-4 -mt-2 relative z-30">
            <BackgroundPicker currentGradient={bgGradient} customBg={customBg}
              onGradientChange={setBgGradient} onCustomBg={setCustomBg}
              isOpen={showBgPicker} onClose={() => setShowBgPicker(false)} />
          </div>
        )}

        {/* Scrollable main area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10 h-full flex flex-col gap-3">

            {/* Header card — compact */}
            <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl animate-fade-in overflow-hidden shrink-0">
              {/* Terminal title bar */}
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 bg-muted/20">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-destructive/60" />
                  <div className="w-2 h-2 rounded-full bg-primary/60" />
                  <div className="w-2 h-2 rounded-full bg-success/60" />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/50 ml-1">dashboard.tsx — Pedro's workspace</span>
              </div>

              <div className="px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono flex items-center gap-1.5 mb-1">
                      <span className="text-success">●</span> {dateStr}
                    </p>
                    <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
                      {greeting.text}, <span className="text-primary">Pedro</span> {greeting.emoji}
                    </h1>
                    <p className="text-muted-foreground text-sm font-mono mt-1">
                      <span className="text-success/60">{">"}</span> {greeting.sub} · <span className="text-foreground font-medium">{todoCount}</span> a fazer
                      {inProgressCount > 0 && <span className="text-primary ml-1">· {inProgressCount} em progresso</span>}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-4">
                    {/* Inline progress */}
                    <div className="hidden md:flex items-center gap-3">
                      <div className="w-24">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] text-muted-foreground font-mono">
                            <span className="text-primary/50">const</span> progress
                          </span>
                          <span className="text-[10px] font-bold text-primary font-mono">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-3 text-center">
                        <div>
                          <p className="text-lg font-display font-bold leading-none">{doneCount}<span className="text-muted-foreground text-xs font-normal">/{tasks.length}</span></p>
                          <p className="text-[8px] text-muted-foreground font-mono uppercase">feitas</p>
                        </div>
                        <div>
                          <p className="text-lg font-display font-bold leading-none flex items-center gap-0.5">{streak}<Flame className="w-3.5 h-3.5 text-accent" /></p>
                          <p className="text-[8px] text-muted-foreground font-mono uppercase">streak</p>
                        </div>
                      </div>
                    </div>
                    <PixelClock />
                  </div>
                </div>
              </div>
            </div>

            {/* Main grid: Tasks + Side panel — fills remaining space */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 flex-1 min-h-0 animate-fade-in" style={{ animationDelay: "80ms" }}>

              {/* Tasks — scrollable inside */}
              <div className="min-h-0">
                <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg overflow-hidden h-full flex flex-col">
                  {/* File tab bar */}
                   <div className="flex items-center border-b border-border/30 bg-muted/10 shrink-0">
                    <div className="flex items-center gap-0.5 px-1 py-1">
                      <div className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-t-lg border border-border/30 border-b-0 -mb-px relative z-10">
                        <LayoutList className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-mono text-foreground">tasks.tsx</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      </div>
                    </div>
                    <div className="ml-auto pr-2 flex gap-1.5">
                      <button onClick={() => setShowInput(true)}
                        className="text-[10px] font-mono flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg px-2.5 py-1.5 transition-all">
                        <Plus className="w-3.5 h-3.5" /> rápida
                      </button>
                      <button onClick={startNewTask}
                        className="text-[10px] font-mono flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-all">
                        <Plus className="w-3.5 h-3.5" /> new Task()
                      </button>
                    </div>
                  </div>

                  <div className="px-3 pt-2 shrink-0">
                    <div className="flex gap-1 mb-2">
                      {STATUS_FILTERS.map((f) => (
                        <button key={f.id} onClick={() => setFilter(f.id)}
                          className={cn("px-2.5 py-1 rounded-lg text-[9px] font-mono transition-all flex items-center gap-1",
                            filter === f.id
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                          <f.icon className="w-3 h-3" />
                          {f.label}
                          <span className="opacity-50">{tasks.filter(t => t.status === f.id).length}</span>
                        </button>
                      ))}
                      <div className="ml-auto">
                        <button onClick={() => setViewByDay(!viewByDay)}
                          className={cn("px-2.5 py-1 rounded-lg text-[9px] font-mono transition-all flex items-center gap-1",
                            viewByDay
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                          <CalendarIcon className="w-3 h-3" />
                          por dia
                        </button>
                      </div>
                    </div>

                    {showInput && (
                      <div className="flex gap-2 mb-2 animate-fade-in">
                        <div className="flex items-center gap-2 flex-1 bg-muted/30 border border-border rounded-xl px-3">
                          <span className="text-primary/40 font-mono text-xs">{">"}</span>
                          <input type="text" autoFocus value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") addTask(); if (e.key === "Escape") setShowInput(false); }}
                            placeholder="O que precisa fazer?"
                            className="flex-1 bg-transparent py-2 text-sm placeholder:text-muted-foreground/30 focus:outline-none font-mono" />
                        </div>
                        <button onClick={addTask}
                          className="bg-primary text-primary-foreground rounded-xl px-4 font-medium hover:opacity-90 transition-opacity">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Scrollable task list */}
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden px-2 pb-2">
                    {viewByDay && groupedByDay ? (
                      <div className="space-y-3">
                        {groupedByDay.map(([dateKey, dayTasks]) => {
                          const label = dateKey === "sem-prazo"
                            ? "Sem prazo"
                            : isToday(parseISO(dateKey))
                              ? "Hoje"
                              : isTomorrow(parseISO(dateKey))
                                ? "Amanhã"
                                : format(parseISO(dateKey), "dd 'de' MMM", { locale: ptBR });
                          const overdue = dateKey !== "sem-prazo" && isPast(parseISO(dateKey)) && !isToday(parseISO(dateKey));
                          return (
                            <div key={dateKey}>
                              <p className={cn("text-[10px] font-mono px-2 py-1 flex items-center gap-1.5",
                                overdue ? "text-urgent" : "text-muted-foreground/50")}>
                                <CalendarIcon className="w-3 h-3" />
                                {label}
                                {overdue && <span className="text-[8px] font-bold">ATRASADO</span>}
                                <span className="opacity-40">({dayTasks.length})</span>
                              </p>
                              <div className="space-y-1">
                                {dayTasks.map((task, idx) => renderTaskRow(task, idx))}
                              </div>
                            </div>
                          );
                        })}
                        {groupedByDay.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-xs text-muted-foreground/40 font-mono">// nenhuma tarefa aqui</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredTasks.map((task, idx) => renderTaskRow(task, idx))}
                        {filteredTasks.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-xs text-muted-foreground/40 font-mono">// nenhuma tarefa aqui</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar — water, coffee + widgets */}
              <div className="min-h-0 flex flex-col gap-3">
                {/* Water & Coffee */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <WaterTracker onWaterEvent={(t) => emitCatEvent(t)} />
                  <CoffeeTracker onCoffeeEvent={(t) => emitCatEvent(t)} />
                </div>

                {/* Widget tabs panel */}
                <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg overflow-hidden flex-1 min-h-0 flex flex-col">
                  <div className="flex flex-wrap border-b border-border/30 bg-muted/10 shrink-0">
                    {WIDGET_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-mono transition-all border-b-2 -mb-px",
                          activeTab === tab.id
                            ? "border-primary text-primary bg-card/60"
                            : "border-transparent text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/20"
                        )}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">{tab.file}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden p-2" key={activeTab}>
                    {renderWidget()}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer quote — compact */}
            <div className="shrink-0 py-1">
              <CodeQuote />
            </div>
          </div>
        </div>
      </div>
      {(selectedTask || creatingTask) && (
        <TaskDetailDialog
          task={(selectedTask || creatingTask)!}
          isOpen={true}
          isNew={!!creatingTask}
          onClose={() => { setSelectedTask(null); setCreatingTask(null); }}
          onUpdate={(t) => {
            if (creatingTask) {
              // Adding new task
              if (t.text.trim()) {
                setTasks((p) => [...p, t]);
              }
              setCreatingTask(null);
            } else {
              updateTask(t);
            }
          }}
          onDelete={(id) => { deleteTask(id); setSelectedTask(null); setCreatingTask(null); }}
        />
      )}
    </div>
  );
};

export default Index;
