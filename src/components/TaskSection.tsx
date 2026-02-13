import { useState } from "react";
import { Check, Plus, Sun, Sunset, Moon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "morning" | "afternoon" | "evening";

interface Task {
  id: string;
  text: string;
  done: boolean;
  period: Period;
}

const periodConfig = {
  morning: { label: "Manhã", icon: Sun, colorClass: "text-morning" },
  afternoon: { label: "Tarde", icon: Sunset, colorClass: "text-afternoon" },
  evening: { label: "Noite", icon: Moon, colorClass: "text-evening" },
};

const TaskSection = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Meditar por 10 minutos", done: false, period: "morning" },
    { id: "2", text: "Revisar metas da semana", done: false, period: "morning" },
    { id: "3", text: "Treino na academia", done: false, period: "afternoon" },
    { id: "4", text: "Ler 30 páginas", done: false, period: "evening" },
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [activePeriod, setActivePeriod] = useState<Period>("morning");

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        done: false,
        period: activePeriod,
      },
    ]);
    setNewTaskText("");
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const periods: Period[] = ["morning", "afternoon", "evening"];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif">Tarefas do Dia</h2>

      {/* Period tabs */}
      <div className="flex gap-2">
        {periods.map((p) => {
          const config = periodConfig[p];
          const Icon = config.icon;
          const count = tasks.filter((t) => t.period === p && !t.done).length;
          return (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activePeriod === p
                  ? "bg-card shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4", config.colorClass)} />
              {config.label}
              {count > 0 && (
                <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {tasks
          .filter((t) => t.period === activePeriod)
          .map((task, i) => (
            <div
              key={task.id}
              className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 group animate-fade-in border border-border/50"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  task.done
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/40 hover:border-primary"
                )}
              >
                {task.done && <Check className="w-3 h-3 text-primary-foreground" />}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm transition-all",
                  task.done && "line-through text-muted-foreground"
                )}
              >
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
      </div>

      {/* Add task */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder={`Adicionar tarefa para ${periodConfig[activePeriod].label.toLowerCase()}...`}
          className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        <button
          onClick={addTask}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TaskSection;
