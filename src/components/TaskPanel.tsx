import { useState } from "react";
import { Check, Plus, Circle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskStatus = "open" | "todo" | "in_progress" | "done";
type Priority = "urgent" | "medium" | "low";

interface Task {
  id: string;
  text: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assignee?: string;
  dueDate?: string;
}

const statusTabs: { key: TaskStatus | "all"; label: string }[] = [
  { key: "all", label: "Em aberto" },
  { key: "todo", label: "A Fazer" },
  { key: "in_progress", label: "Em Progresso" },
  { key: "done", label: "Concluídas" },
];

const priorityConfig: Record<Priority, { label: string; dotClass: string }> = {
  urgent: { label: "Urgente", dotClass: "bg-urgent" },
  medium: { label: "Média", dotClass: "bg-warning" },
  low: { label: "Baixa", dotClass: "bg-success" },
};

const initialTasks: Task[] = [
  { id: "1", text: "Organizar Portfólio", status: "todo", priority: "medium" },
  { id: "2", text: "Fazer assinatura email", status: "todo", priority: "medium" },
  { id: "3", text: "Fazer cartão visita", status: "todo", priority: "medium" },
  { id: "4", text: "Vincular LinkedIn e Facebook ao URL do Site", status: "todo", priority: "medium", assignee: "Pedro Lopes" },
  { id: "5", text: "Banner LinkedIn", status: "todo", priority: "medium" },
  { id: "6", text: "Fazer banner WhatsApp", status: "todo", priority: "medium" },
  { id: "7", text: "Organizar kit de marca", status: "todo", priority: "urgent", dueDate: "19 de fev." },
  { id: "8", text: "Fazer webhook discord termos", status: "todo", priority: "medium", assignee: "Pedro Lopes" },
  { id: "9", text: "Terminar construção bot discord", status: "in_progress", priority: "medium" },
  { id: "10", text: "Revisar documentação do projeto", status: "done", priority: "low" },
  { id: "11", text: "Setup ambiente de dev", status: "done", priority: "medium" },
  { id: "12", text: "Definir roadmap Q1", status: "todo", priority: "urgent" },
];

const TaskPanel = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<TaskStatus | "all">("all");
  const [newTaskText, setNewTaskText] = useState("");
  const [showInput, setShowInput] = useState(false);

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "all") return t.status !== "done";
    return t.status === activeTab;
  });

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const progress = Math.round((doneCount / totalCount) * 100);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "todo" : "done" }
          : t
      )
    );
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        status: "todo",
        priority: "medium",
      },
    ]);
    setNewTaskText("");
    setShowInput(false);
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Check className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Tarefas</h2>
            <p className="text-xs text-muted-foreground">
              {doneCount} de {totalCount} concluídas
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInput(true)}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 py-3 border-b border-border">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Progresso geral</span>
          <span className="text-primary font-semibold">{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 py-3 border-b border-border">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add task input */}
      {showInput && (
        <div className="px-5 py-3 border-b border-border animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
                if (e.key === "Escape") setShowInput(false);
              }}
              placeholder="Nova tarefa..."
              autoFocus
              className="flex-1 bg-muted border-none rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <button
              onClick={addTask}
              className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.map((task, i) => {
          const prio = priorityConfig[task.priority];
          return (
            <div
              key={task.id}
              className="flex items-start gap-3 px-5 py-3.5 border-b border-border/50 group hover:bg-muted/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={cn(
                  "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  task.status === "done"
                    ? "bg-primary border-primary"
                    : "border-border hover:border-primary"
                )}
              >
                {task.status === "done" && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    task.status === "done" &&
                      "line-through text-muted-foreground"
                  )}
                >
                  {task.text}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Circle className="w-2.5 h-2.5" />
                    {task.status === "done"
                      ? "Concluída"
                      : task.status === "in_progress"
                      ? "Em progresso"
                      : "A fazer"}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <span className={cn("w-2 h-2 rounded-full", prio.dotClass)} />
                    <span className={cn(
                      task.priority === "urgent" ? "text-urgent" : "text-warning",
                      task.priority === "low" && "text-success"
                    )}>
                      {prio.label}
                    </span>
                  </span>
                  {task.assignee && (
                    <span className="text-xs text-muted-foreground">
                      👤 {task.assignee}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      · {task.dueDate}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all mt-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskPanel;
