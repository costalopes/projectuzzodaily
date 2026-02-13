import { useState } from "react";
import { Plus, Check, Trash2, Flame, ArrowRight, Sparkles, Image as ImageIcon, Clock, AlertCircle, Minus, Terminal, Timer, CalendarDays, ListChecks, StickyNote, Droplets, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { PixelClock } from "@/components/PixelArt";
import { PixelCatCorner } from "@/components/PixelCatCorner";
import { PomodoroWidget } from "@/components/PomodoroWidget";
import { QuickNotes } from "@/components/QuickNotes";
import { MiniCalendar } from "@/components/MiniCalendar";
import { BackgroundPicker, PRESET_GRADIENTS } from "@/components/BackgroundPicker";
import { AmbientParticles } from "@/components/AmbientParticles";
import { CodeQuote } from "@/components/CodeQuote";
import { HabitTracker } from "@/components/HabitTracker";
import { DailyIntention } from "@/components/DailyIntention";
import { MoodTracker } from "@/components/MoodTracker";
import { WaterTracker } from "@/components/WaterTracker";
import { CoffeeTracker } from "@/components/CoffeeTracker";
import deskBanner from "@/assets/desk-banner.jpg";

type Priority = "urgent" | "medium" | "low";

interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  createdAt: string;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return { text: "Boa madrugada", emoji: "🌌", sub: "Codando até tarde?" };
  if (h < 12) return { text: "Bom dia", emoji: "☕", sub: "Um café e bora codar!" };
  if (h < 18) return { text: "Boa tarde", emoji: "☀️", sub: "Bora ser produtivo!" };
  return { text: "Boa noite", emoji: "🌙", sub: "Sessão noturna de coding!" };
};

const priorityConfig: Record<Priority, { color: string; bg: string; label: string; icon: typeof AlertCircle }> = {
  urgent: { color: "text-urgent", bg: "bg-urgent/10 border-urgent/20", label: "Urgente", icon: AlertCircle },
  medium: { color: "text-accent", bg: "bg-accent/10 border-accent/20", label: "Médio", icon: Clock },
  low: { color: "text-success", bg: "bg-success/10 border-success/20", label: "Baixo", icon: Minus },
};

type WidgetTab = "timer" | "calendar" | "habits" | "notes" | "water" | "coffee";

const WIDGET_TABS: { id: WidgetTab; label: string; icon: typeof Timer; file: string }[] = [
  { id: "timer", label: "pomodoro", icon: Timer, file: "timer.ts" },
  { id: "calendar", label: "calendar", icon: CalendarDays, file: "cal.ts" },
  { id: "habits", label: "habits", icon: ListChecks, file: "habits.ts" },
  { id: "notes", label: "notes", icon: StickyNote, file: "notes.ts" },
  { id: "water", label: "water", icon: Droplets, file: "water.ts" },
  { id: "coffee", label: "coffee", icon: Coffee, file: "coffee.ts" },
];

const Index = () => {
  const greeting = getGreeting();
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Revisar PR do frontend", done: true, priority: "urgent", createdAt: "hoje" },
    { id: "2", text: "Setup CI/CD pipeline", done: false, priority: "urgent", createdAt: "hoje" },
    { id: "3", text: "Design system — tokens de cor", done: true, priority: "medium", createdAt: "ontem" },
    { id: "4", text: "Documentar API endpoints", done: false, priority: "medium", createdAt: "hoje" },
    { id: "5", text: "Call com cliente às 15h", done: false, priority: "low", createdAt: "hoje" },
    { id: "6", text: "Refatorar hook useAuth", done: false, priority: "medium", createdAt: "ontem" },
  ]);

  const [newTask, setNewTask] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [bgGradient, setBgGradient] = useState(PRESET_GRADIENTS[0].class);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [filter, setFilter] = useState<"all" | Priority>("all");
  const [activeTab, setActiveTab] = useState<WidgetTab>("timer");

  const doneCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const streak = 7;

  const toggleTask = (id: string) => {
    setTasks((p) => p.map((t) => {
      if (t.id === id) {
        if (!t.done) { setTaskCompleted(true); setTimeout(() => setTaskCompleted(false), 100); }
        return { ...t, done: !t.done };
      }
      return t;
    }));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((p) => [...p, { id: Date.now().toString(), text: newTask.trim(), done: false, priority: "medium", createdAt: "agora" }]);
    setNewTask("");
    setShowInput(false);
  };

  const deleteTask = (id: string) => setTasks((p) => p.filter((t) => t.id !== id));

  const pendingTasks = tasks.filter((t) => !t.done && (filter === "all" || t.priority === filter));
  const doneTasks = tasks.filter((t) => t.done);
  const urgentCount = tasks.filter((t) => !t.done && t.priority === "urgent").length;

  const renderWidget = () => {
    switch (activeTab) {
      case "timer": return <PomodoroWidget />;
      case "calendar": return <MiniCalendar />;
      case "habits": return <HabitTracker />;
      case "notes": return <QuickNotes />;
      case "water": return <WaterTracker />;
      case "coffee": return <CoffeeTracker />;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* BG */}
      {customBg ? (
        <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${customBg})` }}>
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
      ) : (
        <div className="fixed inset-0 bg-background">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[100px]" />
          {/* Dot grid pattern */}
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
      <PixelCatCorner onTaskComplete={taskCompleted} />

      <div className="relative z-10">
        {/* Banner */}
        <div className="relative w-full h-48 md:h-56 overflow-hidden">
          <img src={deskBanner} alt="Cozy dev workspace" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

          <button onClick={() => setShowBgPicker(!showBgPicker)}
            className="absolute top-4 right-4 bg-card/40 backdrop-blur-xl border border-border/30 rounded-xl p-2.5 hover:bg-card/60 transition-all group">
            <ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {/* Terminal-style overlay */}
          <div className="absolute bottom-4 left-6 font-mono text-[11px] hidden md:flex items-center gap-4">
            <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Terminal className="w-3 h-3 text-primary" />
              <span className="text-success">~</span>
              <span className="text-muted-foreground">/workspace</span>
              <span className="text-foreground/40">$</span>
              <span className="text-primary">npm run dev</span>
              <span className="animate-pulse text-primary">▊</span>
            </div>
          </div>
        </div>

        {/* BG Picker */}
        {showBgPicker && (
          <div className="max-w-6xl mx-auto px-6 -mt-2 relative z-30">
            <BackgroundPicker currentGradient={bgGradient} customBg={customBg}
              onGradientChange={setBgGradient} onCustomBg={setCustomBg}
              isOpen={showBgPicker} onClose={() => setShowBgPicker(false)} />
          </div>
        )}

        <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-10 pb-24">

          {/* Header card */}
          <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl animate-fade-in overflow-hidden">
            {/* Terminal title bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/20">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50 ml-2">dashboard.tsx — Pedro's workspace</span>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium font-mono flex items-center gap-2">
                    <span className="text-success">●</span> {dateStr}
                  </p>
                  <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
                    {greeting.text}, <span className="text-primary">Pedro</span> {greeting.emoji}
                  </h1>
                  <p className="text-muted-foreground text-sm font-mono">
                    <span className="text-success/60">{">"}</span> {greeting.sub} · <span className="text-foreground font-medium">{pendingTasks.length}</span> pendentes
                    {urgentCount > 0 && <span className="text-urgent ml-1">· {urgentCount} urgente{urgentCount > 1 ? "s" : ""}</span>}
                  </p>
                </div>
                <div className="shrink-0">
                  <PixelClock />
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6 pt-5 border-t border-border/30">
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium font-mono">
                        <span className="text-primary/60">const</span> progress <span className="text-foreground/30">=</span>
                      </span>
                      <span className="text-sm font-bold text-primary font-mono">{progress}%</span>
                    </div>
                    <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <p className="text-xl font-display font-bold">{doneCount}<span className="text-muted-foreground text-sm font-normal">/{tasks.length}</span></p>
                      <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">feitas</p>
                    </div>
                    <div className="w-px bg-border/30" />
                    <div>
                      <p className="text-xl font-display font-bold flex items-center gap-1">{streak} <Flame className="w-4 h-4 text-accent" /></p>
                      <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">streak</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 animate-fade-in" style={{ animationDelay: "80ms" }}>
            <MoodTracker />
            <DailyIntention />
            <WaterTracker />
            <CoffeeTracker />
          </div>

          {/* Main grid: Tasks + Widget panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

            {/* Tasks (2/3) */}
            <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg overflow-hidden">
                {/* File tab bar */}
                <div className="flex items-center border-b border-border/30 bg-muted/10">
                  <div className="flex items-center gap-0.5 px-1 py-1">
                    <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-t-lg border border-border/30 border-b-0 -mb-px relative z-10">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-[11px] font-mono text-foreground">tasks.tsx</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    </div>
                  </div>
                  <div className="ml-auto pr-3">
                    <button onClick={() => setShowInput(true)}
                      className="text-[10px] font-mono flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-all">
                      <Plus className="w-3 h-3" /> new Task()
                    </button>
                  </div>
                </div>

                <div className="p-4 pb-0">
                  {/* Filters as code comments */}
                  <div className="flex gap-1.5 mb-3">
                    {(["all", "urgent", "medium", "low"] as const).map((f) => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all",
                          filter === f
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                        {f === "all" ? "// all" : `// ${priorityConfig[f].label.toLowerCase()}`}
                        {f !== "all" && <span className="ml-1 opacity-50">{tasks.filter(t => !t.done && t.priority === f).length}</span>}
                      </button>
                    ))}
                  </div>

                  {showInput && (
                    <div className="flex gap-2 mb-3 animate-fade-in">
                      <div className="flex items-center gap-2 flex-1 bg-muted/30 border border-border rounded-xl px-3">
                        <span className="text-primary/40 font-mono text-xs">{">"}</span>
                        <input type="text" autoFocus value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") addTask(); if (e.key === "Escape") setShowInput(false); }}
                          placeholder="O que precisa fazer?"
                          className="flex-1 bg-transparent py-3 text-sm placeholder:text-muted-foreground/30 focus:outline-none font-mono" />
                      </div>
                      <button onClick={addTask}
                        className="bg-primary text-primary-foreground rounded-xl px-5 font-medium hover:opacity-90 transition-opacity shadow-md">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Task list with line numbers */}
                <div className="px-2 pb-3">
                  <div className="space-y-0.5">
                    {pendingTasks.map((task, idx) => {
                      const pc = priorityConfig[task.priority];
                      return (
                        <div key={task.id}
                          className="grid grid-cols-[2rem_auto_1fr_auto_auto] gap-2 items-center px-2 py-2.5 rounded-xl hover:bg-muted/30 group transition-all cursor-default">
                          {/* Line number */}
                          <span className="text-[10px] font-mono text-muted-foreground/30 text-right select-none">{idx + 1}</span>
                          <button onClick={() => toggleTask(task.id)}
                            className="w-4.5 h-4.5 rounded-md border-2 border-muted-foreground/20 hover:border-primary flex items-center justify-center transition-all shrink-0 hover:bg-primary/10" />
                          <span className="text-sm text-foreground truncate font-mono">{task.text}</span>
                          <span className={cn("hidden sm:flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md border", pc.bg)}>
                            <pc.icon className={cn("w-3 h-3", pc.color)} />
                            <span className={pc.color}>{pc.label}</span>
                          </span>
                          <button onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all w-7 flex justify-center">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {pendingTasks.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-sm text-muted-foreground/40 font-mono">
                          {filter !== "all" ? "// nenhuma tarefa com este filtro" : "// tudo feito! hora do café ☕"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {doneTasks.length > 0 && (
                  <div className="border-t border-border/30 px-2 pb-3 pt-2">
                    <p className="text-[10px] font-mono text-muted-foreground/40 px-4 py-2 flex items-center gap-1.5">
                      <span className="text-success/60">{"/*"}</span>
                      concluídas ({doneTasks.length})
                      <span className="text-success/60">{"*/"}</span>
                    </p>
                    <div className="space-y-0.5">
                      {doneTasks.map((task, idx) => (
                        <div key={task.id}
                          className="grid grid-cols-[2rem_auto_1fr_auto] gap-2 items-center px-2 py-2 rounded-xl group transition-all opacity-40 hover:opacity-70">
                          <span className="text-[10px] font-mono text-muted-foreground/20 text-right select-none">{pendingTasks.length + idx + 1}</span>
                          <button onClick={() => toggleTask(task.id)}
                            className="w-4.5 h-4.5 rounded-md bg-success/80 border-2 border-success/80 flex items-center justify-center transition-all shrink-0">
                            <Check className="w-3 h-3 text-success-foreground" />
                          </button>
                          <span className="text-sm line-through text-muted-foreground truncate font-mono">{task.text}</span>
                          <button onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar — IDE-style tabbed panel */}
            <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg overflow-hidden">
                {/* Tab bar — file tabs */}
                <div className="flex flex-wrap border-b border-border/30 bg-muted/10">
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
                      <tab.icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{tab.file}</span>
                    </button>
                  ))}
                </div>

                {/* Widget content */}
                <div className="p-0 animate-fade-in" key={activeTab}>
                  {renderWidget()}
                </div>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="mt-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-3 justify-center text-muted-foreground/30 font-mono text-[10px]">
              <div className="h-px flex-1 bg-border/20" />
              <span>{"// EOF"}</span>
              <div className="h-px flex-1 bg-border/20" />
            </div>
            <CodeQuote />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
