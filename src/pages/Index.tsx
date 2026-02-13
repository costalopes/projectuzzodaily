import { useState } from "react";
import { Plus, Check, Trash2, Coffee, Sun, Moon, Flame, Target, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PixelCoffee, PixelCat, PixelClock } from "@/components/PixelArt";
import pixelBanner from "@/assets/pixel-banner.png";

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
    <div className="min-h-screen bg-background">
      {/* Pixel Banner */}
      <div className="relative w-full h-40 md:h-52 overflow-hidden">
        <img
          src={pixelBanner}
          alt="Pixel art cozy dev workspace"
          className="w-full h-full object-cover"
          style={{ imageRendering: "auto" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      <div className="max-w-2xl mx-auto px-5 -mt-10 relative z-10 pb-12 space-y-6">

        {/* Header card with clock, greeting and pixel friends */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                {dateStr}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {greeting.text}, Pedro {greeting.emoji}
              </h1>
              <p className="text-muted-foreground text-sm">
                {pendingTasks.length} tarefas pendentes · {streak} dias seguidos 🔥
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <PixelClock />
              <div className="flex items-end gap-2">
                <PixelCoffee />
                <PixelCat />
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground font-medium">Progresso do dia</span>
            <span className="text-xs font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2.5 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Target className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{progress}%</p>
            <p className="text-[10px] text-muted-foreground">progresso</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Check className="w-4 h-4 text-success mx-auto mb-1" />
            <p className="text-lg font-bold">{doneCount}<span className="text-muted-foreground font-normal text-xs">/{tasks.length}</span></p>
            <p className="text-[10px] text-muted-foreground">concluídas</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Flame className="w-4 h-4 text-warning mx-auto mb-1" />
            <p className="text-lg font-bold">{streak}</p>
            <p className="text-[10px] text-muted-foreground">dias seguidos</p>
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Pendentes
            </h2>
            <button
              onClick={() => setShowInput(true)}
              className="text-xs text-primary font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova tarefa
            </button>
          </div>

          {showInput && (
            <div className="flex gap-2 animate-fade-in">
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
                className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
              <button
                onClick={addTask}
                className="bg-primary text-primary-foreground rounded-xl px-4 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            {pendingTasks.map((task, i) => (
              <TaskRow key={task.id} task={task} index={i} onToggle={toggleTask} onDelete={deleteTask} />
            ))}
          </div>

          {doneTasks.length > 0 && (
            <>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-3">
                Concluídas
              </h2>
              <div className="space-y-1.5">
                {doneTasks.map((task, i) => (
                  <TaskRow key={task.id} task={task} index={i} onToggle={toggleTask} onDelete={deleteTask} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <p className="text-[11px] text-muted-foreground/50 italic font-mono">
            ~ foco no processo, não no resultado ~
          </p>
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
    className="flex items-center gap-3 bg-card border border-border/60 rounded-xl px-4 py-3 group hover:border-primary/20 transition-all animate-fade-in"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <button
      onClick={() => onToggle(task.id)}
      className={cn(
        "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all shrink-0",
        task.done
          ? "bg-primary border-primary"
          : "border-muted-foreground/30 hover:border-primary"
      )}
    >
      {task.done && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
    </button>
    <span className={cn("flex-1 text-sm", task.done && "line-through text-muted-foreground")}>
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
