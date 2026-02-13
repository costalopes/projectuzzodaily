import { useState, useRef } from "react";
import { Plus, Check, Trash2, Flame, Target, ArrowRight, Sparkles, Image as ImageIcon, Clock, AlertCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PixelCoffee, PixelClock } from "@/components/PixelArt";
import { PixelCatCorner } from "@/components/PixelCatCorner";
import { PomodoroWidget } from "@/components/PomodoroWidget";
import { QuickNotes } from "@/components/QuickNotes";
import { MiniCalendar } from "@/components/MiniCalendar";
import { BackgroundPicker, PRESET_GRADIENTS } from "@/components/BackgroundPicker";
import { AmbientParticles } from "@/components/AmbientParticles";
import { CodeQuote } from "@/components/CodeQuote";
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

  return (
    <div className="min-h-screen relative">
      {/* BG */}
      {customBg ? (
        <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${customBg})` }}>
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
      ) : (
        <div className={`fixed inset-0 bg-gradient-to-br ${bgGradient} transition-all duration-1000`} />
      )}

      <AmbientParticles />
      <PixelCatCorner onTaskComplete={taskCompleted} />

      <div className="relative z-10">
        {/* Banner */}
        <div className="relative w-full h-48 md:h-60 overflow-hidden">
          <img src={deskBanner} alt="Cozy dev workspace" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 mix-blend-overlay" />

          <button onClick={() => setShowBgPicker(!showBgPicker)}
            className="absolute top-4 right-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 hover:bg-black/50 transition-all group">
            <ImageIcon className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
          </button>

          {/* Code overlay */}
          <div className="absolute bottom-5 left-6 font-mono text-[11px] hidden md:block">
            <span className="text-success/70">const</span>{" "}
            <span className="text-accent/70">today</span>{" "}
            <span className="text-primary-foreground/30">=</span>{" "}
            <span className="text-primary/70">"productive"</span>
            <span className="animate-cursor text-primary-foreground/70">│</span>
          </div>
        </div>

        {/* BG Picker */}
        {showBgPicker && (
          <div className="max-w-5xl mx-auto px-6 -mt-2 relative z-30">
            <BackgroundPicker currentGradient={bgGradient} customBg={customBg}
              onGradientChange={setBgGradient} onCustomBg={setCustomBg}
              isOpen={showBgPicker} onClose={() => setShowBgPicker(false)} />
          </div>
        )}

        <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-10 pb-24">

          {/* Header */}
          <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl animate-fade-in animate-glow">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-2 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium font-mono">
                  {dateStr}
                </p>
                <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
                  {greeting.text}, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pedro</span> {greeting.emoji}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {greeting.sub} · <span className="text-foreground font-medium">{pendingTasks.length}</span> pendentes
                  {urgentCount > 0 && <span className="text-urgent ml-1">· {urgentCount} urgente{urgentCount > 1 ? "s" : ""}</span>}
                </p>
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                <PixelClock />
                <PixelCoffee />
              </div>
            </div>

            {/* Progress */}
            <div className="mt-6 pt-5 border-t border-border/50">
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium font-mono">progresso</span>
                    <span className="text-sm font-bold text-primary font-mono">{progress}%</span>
                  </div>
                  <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-xl font-display font-bold">{doneCount}<span className="text-muted-foreground text-sm font-normal">/{tasks.length}</span></p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">feitas</p>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <p className="text-xl font-display font-bold flex items-center gap-1">{streak} <Flame className="w-4 h-4 text-accent" /></p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">streak</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">

            {/* Tasks (2/3) */}
            <div className="lg:col-span-2 space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
              {/* Task header */}
              <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg overflow-hidden">
                <div className="p-5 pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Tarefas
                    </h2>
                    <button onClick={() => setShowInput(true)}
                      className="text-xs font-medium flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-3.5 py-2 hover:opacity-90 transition-opacity shadow-md">
                      <Plus className="w-3.5 h-3.5" /> Nova
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-1.5 mb-4">
                    {(["all", "urgent", "medium", "low"] as const).map((f) => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all uppercase tracking-wider",
                          filter === f ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")}>
                        {f === "all" ? "Todas" : priorityConfig[f].label}
                        {f !== "all" && (
                          <span className="ml-1 opacity-60">
                            {tasks.filter(t => !t.done && t.priority === f).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {showInput && (
                    <div className="flex gap-2 mb-4 animate-fade-in">
                      <input type="text" autoFocus value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addTask(); if (e.key === "Escape") setShowInput(false); }}
                        placeholder="O que precisa fazer?"
                        className="flex-1 bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" />
                      <button onClick={addTask}
                        className="bg-primary text-primary-foreground rounded-xl px-5 font-medium hover:opacity-90 transition-opacity shadow-md">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Task list as table-like */}
                <div className="px-3 pb-3">
                  {/* Header row */}
                  <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-3 py-2 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">
                    <span className="w-5" />
                    <span>Tarefa</span>
                    <span className="hidden sm:block">Prioridade</span>
                    <span className="w-8" />
                  </div>

                  <div className="space-y-1">
                    {pendingTasks.map((task) => {
                      const pc = priorityConfig[task.priority];
                      return (
                        <div key={task.id}
                          className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-3 py-3 rounded-xl hover:bg-muted/40 group transition-all cursor-default">
                          <button onClick={() => toggleTask(task.id)}
                            className="w-5 h-5 rounded-md border-2 border-muted-foreground/20 hover:border-primary flex items-center justify-center transition-all shrink-0 hover:bg-primary/10">
                          </button>
                          <span className="text-sm text-foreground truncate">{task.text}</span>
                          <span className={cn("hidden sm:flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-lg border", pc.bg)}>
                            <pc.icon className={cn("w-3 h-3", pc.color)} />
                            <span className={pc.color}>{pc.label}</span>
                          </span>
                          <button onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all w-8 flex justify-center">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {pendingTasks.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-sm text-muted-foreground/50 italic font-mono">
                          {filter !== "all" ? "Nenhuma tarefa com este filtro" : "Tudo feito! Hora do café ☕"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Done section */}
                {doneTasks.length > 0 && (
                  <div className="border-t border-border/50 px-3 pb-3 pt-2">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 px-3 py-2 flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-success" />
                      Concluídas ({doneTasks.length})
                    </p>
                    <div className="space-y-0.5">
                      {doneTasks.map((task) => (
                        <div key={task.id}
                          className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-3 py-2.5 rounded-xl group transition-all opacity-50 hover:opacity-80">
                          <button onClick={() => toggleTask(task.id)}
                            className="w-5 h-5 rounded-md bg-primary border-2 border-primary flex items-center justify-center transition-all shrink-0">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </button>
                          <span className="text-sm line-through text-muted-foreground truncate">{task.text}</span>
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

            {/* Sidebar (1/3) */}
            <div className="space-y-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <MiniCalendar />
              <PomodoroWidget />
              <QuickNotes />
            </div>
          </div>

          {/* Quote */}
          <div className="mt-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <CodeQuote />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
