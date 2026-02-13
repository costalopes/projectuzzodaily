import { useState } from "react";
import { X, MessageSquare, FileText, Flag, Plus, Trash2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskImportance = "alta" | "média" | "baixa";

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  importance: TaskImportance;
  description: string;
  notes: string[];
  createdAt: string;
  dueDate?: string; // ISO date string
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: "A fazer", color: "text-accent", bg: "bg-accent/10 border-accent/20" },
  in_progress: { label: "Em progresso", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  done: { label: "Concluída", color: "text-success", bg: "bg-success/10 border-success/20" },
};

const IMPORTANCE_CONFIG: Record<TaskImportance, { label: string; color: string }> = {
  alta: { label: "Alta", color: "text-urgent" },
  média: { label: "Média", color: "text-accent" },
  baixa: { label: "Baixa", color: "text-success" },
};

interface TaskDetailDialogProps {
  task: Task;
  isOpen: boolean;
  isNew?: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskDetailDialog = ({ task, isOpen, isNew, onClose, onUpdate, onDelete }: TaskDetailDialogProps) => {
  const [title, setTitle] = useState(task.text);
  const [description, setDescription] = useState(task.description);
  const [newNote, setNewNote] = useState("");
  const [importance, setImportance] = useState<TaskImportance>(task.importance);
  const [status, setStatus] = useState<TaskStatus>(task.status);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdate({ ...task, text: title, description, importance, status });
  };

  const handleClose = () => {
    if (isNew && title.trim()) {
      onUpdate({ ...task, text: title, description, importance, status });
    }
    onClose();
  };

  const handleDueDate = (date: Date | undefined) => {
    onUpdate({ ...task, text: title, description, importance, status, dueDate: date ? date.toISOString() : undefined });
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    onUpdate({ ...task, text: title, description, importance, status, notes: [...task.notes, `[${now}] ${newNote.trim()}`] });
    setNewNote("");
  };

  const deleteNote = (idx: number) => {
    const updated = task.notes.filter((_, i) => i !== idx);
    onUpdate({ ...task, notes: updated });
  };

  const sc = STATUS_CONFIG[status];
  const dueDate = task.dueDate ? new Date(task.dueDate) : undefined;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== "done";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: "200ms" }} />
      <div
        className="relative bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col animate-enter"
        style={{ animationDuration: "300ms" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/30 bg-muted/10 px-4 py-2.5 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-destructive/60" />
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <div className="w-2 h-2 rounded-full bg-success/60" />
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/50">task_detail.tsx</span>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden p-6 space-y-6">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            autoFocus={isNew}
            placeholder="Nome da tarefa..."
            className="text-xl font-display font-bold text-foreground bg-transparent w-full focus:outline-none placeholder:text-muted-foreground/30 border-b border-transparent focus:border-primary/20 pb-1 transition-colors"
          />

          {/* Status + Importance row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wider">status</label>
              <div className="flex gap-1.5">
                {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => { setStatus(s); onUpdate({ ...task, description, importance, status: s }); }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-mono transition-all border",
                        status === s ? cfg.bg + " " + cfg.color : "border-border/30 text-muted-foreground/50 hover:bg-muted/30"
                      )}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
                <Flag className="w-3.5 h-3.5" /> importância
              </label>
              <div className="flex gap-1.5">
                {(Object.keys(IMPORTANCE_CONFIG) as TaskImportance[]).map((imp) => {
                  const cfg = IMPORTANCE_CONFIG[imp];
                  return (
                    <button
                      key={imp}
                      onClick={() => { setImportance(imp); onUpdate({ ...task, description, status, importance: imp }); }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-mono transition-all border",
                        importance === imp ? `border-current ${cfg.color} bg-current/10` : "border-border/30 text-muted-foreground/50 hover:bg-muted/30"
                      )}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" /> prazo
            </label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-mono transition-all",
                      dueDate
                        ? isOverdue
                          ? "border-urgent/30 bg-urgent/10 text-urgent"
                          : "border-border/40 bg-muted/20 text-foreground"
                        : "border-border/40 bg-muted/20 text-muted-foreground/50 hover:bg-muted/30"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    {dueDate
                      ? format(dueDate, "dd 'de' MMM, yyyy", { locale: ptBR })
                      : "Definir prazo..."}
                    {isOverdue && <span className="text-[10px] font-bold">ATRASADA</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border z-[110]" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={handleDueDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <button
                  onClick={() => handleDueDate(undefined)}
                  className="text-xs font-mono text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  limpar
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              placeholder="Adicione uma descrição..."
              rows={3}
              className="w-full bg-muted/20 border border-border/40 rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> notas ({task.notes.length})
            </label>

            {task.notes.length > 0 && (
              <div className="space-y-1.5">
                {task.notes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-muted/20 rounded-lg px-4 py-2.5 group">
                    <p className="text-sm font-mono text-foreground/80 flex-1">{note}</p>
                    <button onClick={() => deleteNote(idx)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0 mt-0.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
                placeholder="Adicionar nota..."
                className="flex-1 bg-muted/20 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button onClick={addNote} className="bg-primary/10 text-primary border border-primary/20 rounded-xl px-4 hover:bg-primary/20 transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="text-[10px] font-mono text-muted-foreground/30 pt-3 border-t border-border/20">
            criada: {task.createdAt} · id: {task.id.slice(0, 8)}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 px-5 py-3 flex justify-between items-center shrink-0">
          <button
            onClick={() => { onDelete(task.id); onClose(); }}
            className="text-xs font-mono text-destructive/60 hover:text-destructive transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> deletar
          </button>
          <span className={cn("text-xs font-mono px-3 py-1 rounded-lg border", sc.bg, sc.color)}>
            {sc.label}
          </span>
        </div>
      </div>
    </div>
  );
};
