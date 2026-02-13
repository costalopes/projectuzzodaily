import { useState, useRef } from "react";
import { Plus, Check, Trash2, Flame, Target, ArrowRight, Sparkles, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { PixelCoffee, PixelClock } from "@/components/PixelArt";
import { PixelCatCorner } from "@/components/PixelCatCorner";
import { PomodoroWidget } from "@/components/PomodoroWidget";
import { QuickNotes } from "@/components/QuickNotes";
import { MiniCalendar } from "@/components/MiniCalendar";
import { BackgroundPicker, PRESET_GRADIENTS } from "@/components/BackgroundPicker";
import { AmbientParticles } from "@/components/AmbientParticles";
import { CodeQuote } from "@/components/CodeQuote";
import cozyBanner from "@/assets/cozy-banner.jpg";

type Priority = "urgent" | "medium" | "low";

interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: "Bom dia", emoji: "☕" };
  if (h < 18) return { text: "Boa tarde", emoji: "☀️" };
  return { text: "Boa noite", emoji: "🌙" };
};

const priorityDot: Record<Priority, string> = {
  urgent: "bg-urgent",
  medium: "bg-warning",
  low: "bg-success",
};

const priorityLabel: Record<Priority, string> = {
  urgent: "Urgente",
  medium: "Médio",
  low: "Baixo",
};

const Index = () => {
  const greeting = getGreeting();
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Revisar PR do frontend", done: true, priority: "urgent" },
    { id: "2", text: "Setup CI/CD pipeline", done: false, priority: "urgent" },
    { id: "3", text: "Design system — tokens de cor", done: true, priority: "medium" },
    { id: "4", text: "Documentar API endpoints", done: false, priority: "medium" },
    { id: "5", text: "Call com cliente às 15h", done: false, priority: "low" },
    { id: "6", text: "Refatorar hook useAuth", done: false, priority: "medium" },
  ]);

  const [newTask, setNewTask] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [bgGradient, setBgGradient] = useState(PRESET_GRADIENTS[0].class);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);

  const doneCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const streak = 7;

  const toggleTask = (id: string) =>
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((p) => [
      ...p,
      { id: Date.now().toString(), text: newTask.trim(), done: false, priority: "medium" },
    ]);
    setNewTask("");
    setShowInput(false);
  };

  const deleteTask = (id: string) =>
    setTasks((p) => p.filter((t) => t.id !== id));

  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  return (
    <div className="min-h-screen relative">
      {/* Background layers */}
      {customBg ? (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${customBg})` }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
      ) : (
        <div className={`fixed inset-0 bg-gradient-to-br ${bgGradient} transition-all duration-1000`} />
      )}

      <AmbientParticles />
      <PixelCatCorner />

      {/* Content */}
      <div className="relative z-10">
        {/* Banner */}
        <div className="relative w-full h-44 md:h-56 overflow-hidden">
          <img
            src={cozyBanner}
            alt="Cozy dev workspace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent/60 to-background/90" />

          {/* BG picker button */}
          <button
            onClick={() => setShowBgPicker(!showBgPicker)}
            className="absolute top-3 right-3 bg-card/70 backdrop-blur-md border border-border/50 rounded-xl p-2.5 hover:bg-card/90 transition-all group"
          >
            <Image className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          {/* Code typing decoration */}
          <div className="absolute bottom-4 left-5 font-mono text-[10px] text-primary-foreground/60">
            <span className="text-success/80">const</span> <span className="text-accent/90">workspace</span> <span className="text-primary-foreground/40">=</span> <span className="text-warning/80">"cozy"</span>
            <span className="animate-cursor text-primary-foreground/80">|</span>
          </div>
        </div>

        {/* BG picker dropdown */}
        {showBgPicker && (
          <div className="max-w-4xl mx-auto px-5 -mt-2 relative z-30">
            <BackgroundPicker
              currentGradient={bgGradient}
              customBg={customBg}
              onGradientChange={setBgGradient}
              onCustomBg={setCustomBg}
              isOpen={showBgPicker}
              onClose={() => setShowBgPicker(false)}
            />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-5 -mt-8 relative z-10 pb-20 space-y-6">

          {/* Header */}
          <div className="bg-card/85 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-lg animate-fade-in animate-glow">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  {dateStr}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {greeting.text}, Pedro {greeting.emoji}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {pendingTasks.length} tarefas pendentes · {streak} dias seguidos 🔥
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <PixelClock />
                <PixelCoffee />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-card/70 backdrop-blur-sm border border-border/40 rounded-2xl p-4 animate-fade-in" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">✨ Progresso do dia</span>
              <span className="text-sm font-bold text-primary font-mono">{progress}%</span>
            </div>
            <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-primary/80 to-accent rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground">{doneCount}/{tasks.length} concluídas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] text-muted-foreground">{streak} dias seguidos</span>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 animate-fade-in" style={{ animationDelay: "160ms" }}>

            {/* Tasks (3/5) */}
            <div className="md:col-span-3 space-y-3">
              <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Tarefas pendentes
                  </h2>
                  <button
                    onClick={() => setShowInput(true)}
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:opacity-80 transition-opacity bg-primary/10 rounded-lg px-2.5 py-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova
                  </button>
                </div>

                {showInput && (
                  <div className="flex gap-2 mb-3 animate-fade-in">
                    <input
                      type="text"
                      autoFocus
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTask();
                        if (e.key === "Escape") setShowInput(false);
                      }}
                      placeholder="O que precisa fazer?"
                      className="flex-1 bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                    <button
                      onClick={addTask}
                      className="bg-primary text-primary-foreground rounded-xl px-4 text-sm font-medium hover:opacity-90 transition-opacity shadow-md"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  {pendingTasks.map((task, i) => (
                    <TaskRow key={task.id} task={task} index={i} onToggle={toggleTask} onDelete={deleteTask} />
                  ))}
                  {pendingTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground/50 text-center py-6 italic">
                      Tudo feito! Hora de um café ☕
                    </p>
                  )}
                </div>
              </div>

              {doneTasks.length > 0 && (
                <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-success" />
                    Concluídas ({doneTasks.length})
                  </h2>
                  <div className="space-y-1.5">
                    {doneTasks.map((task, i) => (
                      <TaskRow key={task.id} task={task} index={i} onToggle={toggleTask} onDelete={deleteTask} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar (2/5) */}
            <div className="md:col-span-2 space-y-5">
              <MiniCalendar />
              <PomodoroWidget />
              <QuickNotes />
            </div>
          </div>

          {/* Quote footer */}
          <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <CodeQuote />
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskRow = ({
  task,
  index,
  onToggle,
  onDelete,
}: {
  task: Task;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) => (
  <div
    className="flex items-center gap-3 bg-muted/30 border border-border/30 rounded-xl px-4 py-3 group hover:bg-muted/50 hover:border-primary/15 transition-all"
  >
    <button
      onClick={() => onToggle(task.id)}
      className={cn(
        "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all shrink-0",
        task.done ? "bg-primary border-primary" : "border-muted-foreground/25 hover:border-primary"
      )}
    >
      {task.done && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
    </button>
    <span className={cn("flex-1 text-sm", task.done && "line-through text-muted-foreground/60")}>
      {task.text}
    </span>
    <span className={cn("w-2 h-2 rounded-full shrink-0", priorityDot[task.priority])} />
    <button
      onClick={() => onDelete(task.id)}
      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

export default Index;
