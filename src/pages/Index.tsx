import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, Flame, ArrowRight, LayoutList, Image as ImageIcon, Terminal, Timer, CalendarDays, ListChecks, StickyNote, Droplets, Coffee, Circle, Loader2, CalendarIcon, ChevronLeft, ChevronRight, BookOpen, PenLine, FileText, LogOut, Webhook, User, Camera, Globe, Repeat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { TaskDetailDialog, type Task, type TaskStatus, type TaskRecurrence } from "@/components/TaskDetailDialog";
import { LofiPlayer } from "@/components/LofiPlayer";
import { StudyTab } from "@/components/StudyTab";
import { DiaryTab } from "@/components/DiaryTab";
import { AnnotationsTab } from "@/components/AnnotationsTab";
import { format, isToday, isTomorrow, isPast, parseISO, addDays, subDays, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type WorkspaceTab = "tasks" | "study" | "diary" | "annotations";

const WORKSPACE_TABS: { id: WorkspaceTab; label: string; icon: typeof LayoutList; file: string }[] = [
  { id: "tasks", label: "Tarefas", icon: LayoutList, file: "tasks.tsx" },
  { id: "study", label: "Estudo", icon: BookOpen, file: "estudo.tsx" },
  { id: "diary", label: "Diário", icon: PenLine, file: "diário.tsx" },
  { id: "annotations", label: "Anotações", icon: FileText, file: "notas.tsx" },
];

const Index = () => {
  const navigate = useNavigate();
  const greeting = getGreeting();
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

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
  const [selectedDay, setSelectedDay] = useState<Date>(startOfDay(new Date()));
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("tasks");
  const [catEvent, setCatEvent] = useState<CatEvent | null>(null);
  const [profileData, setProfileData] = useState<{ username: string; avatar_url: string | null; timezone: string }>({ username: "", avatar_url: null, timezone: "America/Sao_Paulo" });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("username, avatar_url, timezone").eq("user_id", user.id).maybeSingle();
      if (data) setProfileData({ username: data.username, avatar_url: data.avatar_url, timezone: data.timezone ?? "America/Sao_Paulo" });
    };
    loadProfile();
  }, []);

  // Load tasks from database
  useEffect(() => {
    const loadTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
      if (data) {
        setTasks(data.map((t: any) => ({
          id: t.id,
          text: t.text,
          status: t.status as TaskStatus,
          importance: t.importance as Task["importance"],
          description: t.description || "",
          notes: t.notes || [],
          createdAt: format(new Date(t.created_at), "dd/MM", { locale: ptBR }),
          dueDate: t.due_date || undefined,
          recurrence: t.recurrence || null,
        })));
      }
      setTasksLoaded(true);
    };
    loadTasks();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const filePath = `${user.id}/avatar.${file.name.split('.').pop()}`;
      await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      setProfileData(p => ({ ...p, avatar_url: publicUrl }));
    } catch (err) { console.error("Avatar upload error:", err); }
    setUploadingAvatar(false);
  };

  const handleUsernameChange = async (newUsername: string) => {
    if (!newUsername.trim()) return;
    if (newUsername.length > 50) return;
    setProfileData(p => ({ ...p, username: newUsername }));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ username: newUsername }).eq("user_id", user.id);
    }
  };

  const handleTimezoneChange = async (tz: string) => {
    setProfileData(p => ({ ...p, timezone: tz }));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ timezone: tz }).eq("user_id", user.id);
  };

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

  // Tasks for today (used for progress bar / counters)
  const todayTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), today));
  }, [tasks]);

  // Tasks for current view (day filter or all)
  const dayTasks = useMemo(() => {
    if (!viewByDay) return tasks;
    return tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), selectedDay));
  }, [tasks, viewByDay, selectedDay]);

  const doneCount = todayTasks.filter((t) => t.status === "done").length;
  const progress = todayTasks.length ? Math.round((doneCount / todayTasks.length) * 100) : 0;
  const streak = doneCount;

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    if (newStatus === "done") {
      setTaskCompleted(true);
      setTimeout(() => setTaskCompleted(false), 100);
      emitCatEvent("task_complete");

      // If recurring, create next occurrence
      if (task.recurrence && task.dueDate) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const currentDue = parseISO(task.dueDate);
          let nextDue: Date;
          if (task.recurrence === "daily") nextDue = addDays(currentDue, 1);
          else if (task.recurrence === "weekly") nextDue = addDays(currentDue, 7);
          else nextDue = new Date(currentDue.getFullYear(), currentDue.getMonth() + 1, currentDue.getDate());

          const { data } = await supabase.from("tasks").insert({
            user_id: user.id, text: task.text, status: "todo", importance: task.importance,
            description: task.description, notes: [], due_date: nextDue.toISOString(), recurrence: task.recurrence,
          }).select().single();
          if (data) {
            setTasks(p => [...p, {
              id: data.id, text: data.text, status: "todo" as TaskStatus,
              importance: data.importance as Task["importance"], description: data.description || "",
              notes: [], createdAt: "agora", dueDate: data.due_date || undefined, recurrence: (data.recurrence as TaskRecurrence) || null,
            }]);
          }
        }
      }
    }
    setTasks((p) => p.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const todayISO = startOfDay(new Date()).toISOString();
    const { data, error } = await supabase.from("tasks").insert({
      user_id: user.id,
      text: newTask.trim(),
      status: "todo",
      importance: "média",
      description: "",
      notes: [],
      due_date: todayISO,
    }).select().single();
    if (data && !error) {
      setTasks((p) => [...p, {
        id: data.id, text: data.text, status: data.status as TaskStatus,
        importance: data.importance as Task["importance"], description: data.description || "",
        notes: data.notes || [], createdAt: "agora", dueDate: data.due_date || undefined,
      }]);
    }
    setNewTask("");
    setShowInput(false);
  };

  const startNewTask = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const todayISO2 = startOfDay(new Date()).toISOString();
    const { data, error } = await supabase.from("tasks").insert({
      user_id: user.id, text: "Nova tarefa", status: "todo", importance: "média", description: "", notes: [], due_date: todayISO2,
    }).select().single();
    if (data && !error) {
      const draft: Task = {
        id: data.id, text: "", status: "todo", importance: "média",
        description: "", notes: [], createdAt: "agora",
      };
      setCreatingTask(draft);
    }
  };

  const updateTask = async (updated: Task) => {
    setTasks((p) => p.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
    await supabase.from("tasks").update({
      text: updated.text, status: updated.status, importance: updated.importance,
      description: updated.description, notes: updated.notes, due_date: updated.dueDate || null,
      recurrence: updated.recurrence || null,
    }).eq("id", updated.id);
  };

  const deleteTask = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };

  const IMPORTANCE_ORDER: Record<string, number> = { alta: 0, média: 1, baixa: 2 };
  const filteredTasks = dayTasks.filter((t) => t.status === filter).sort((a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]);
  const todoCount = dayTasks.filter(t => t.status === "todo").length;
  const inProgressCount = dayTasks.filter(t => t.status === "in_progress").length;

  // Group tasks by due date for day view (legacy grouped view, not used now but kept)
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

  const selectedDayLabel = isToday(selectedDay)
    ? "Hoje"
    : isTomorrow(selectedDay)
      ? "Amanhã"
      : format(selectedDay, "dd 'de' MMM", { locale: ptBR });

  const renderTaskRow = (task: Task, idx: number) => {
    const isDone = task.status === "done";
    const isInProgress = task.status === "in_progress";
    const hasDue = !!task.dueDate;
    const dueDate = hasDue ? parseISO(task.dueDate!) : null;
    const overdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !isDone;
    return (
      <motion.div key={task.id}
        layout
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: idx * 0.03 }}
        onClick={() => setSelectedTask(task)}
        className={cn(
          "grid grid-cols-[2.5rem_auto_1fr_auto_auto] gap-3 items-center px-4 py-3.5 rounded-xl hover:bg-muted/30 group transition-all cursor-pointer border border-transparent hover:border-border/30",
          isDone && "opacity-40 hover:opacity-70"
        )}>
        <span className="text-xs font-mono text-muted-foreground/30 text-right select-none">{idx + 1}</span>
        <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
          className={cn(
            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
            isDone ? "bg-success/80 border-success/80" : "border-muted-foreground/20 hover:border-primary hover:bg-primary/10"
          )}>
          <AnimatePresence>
            {isDone && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check className="w-3 h-3 text-success-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        <div className="min-w-0">
          <span className={cn("text-sm truncate font-mono block", isDone ? "line-through text-muted-foreground" : "text-foreground")}>
            {task.text}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            {task.recurrence && (
              <span className="text-[10px] font-mono text-primary/50 flex items-center gap-0.5">
                <Repeat className="w-3 h-3" />
                {task.recurrence === "daily" ? "diária" : task.recurrence === "weekly" ? "semanal" : "mensal"}
              </span>
            )}
            {task.description && (
              <span className="text-xs text-muted-foreground/40 font-mono truncate">{task.description}</span>
            )}
            {hasDue && !viewByDay && (
              <span className={cn("text-[10px] font-mono flex items-center gap-1 shrink-0",
                overdue ? "text-urgent" : "text-muted-foreground/40")}>
                <CalendarIcon className="w-3 h-3" />
                {isToday(dueDate!) ? "hoje" : isTomorrow(dueDate!) ? "amanhã" : format(dueDate!, "dd/MM")}
              </span>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border transition-colors",
            task.importance === "alta" ? "bg-urgent/10 border-urgent/20 text-urgent" :
            task.importance === "média" ? "bg-accent/10 border-accent/20 text-accent" :
            "bg-muted/30 border-border/20 text-muted-foreground/60"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full shrink-0",
              task.importance === "alta" ? "bg-urgent" :
              task.importance === "média" ? "bg-accent" :
              "bg-muted-foreground/40"
            )} />
            {task.importance === "alta" ? "Alta" : task.importance === "média" ? "Média" : "Baixa"}
          </span>
          <span className={cn(
            "inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border transition-colors",
            isDone ? "bg-success/10 border-success/20 text-success" :
            isInProgress ? "bg-primary/10 border-primary/20 text-primary" :
            "bg-muted/30 border-border/20 text-muted-foreground/50"
          )}>
            {isInProgress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isDone ? "✓ Concluída" : isInProgress ? "Em progresso" : "A fazer"}
          </span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all w-8 flex justify-center">
          <Trash2 className="w-4 h-4" />
        </button>
      </motion.div>
    );
  };

  const renderWidget = () => {
    switch (activeTab) {
      case "timer": return <PomodoroWidget onTimerEnd={() => emitCatEvent("pomodoro_end")} onTimerStart={() => emitCatEvent("pomodoro_start")} />;
      case "calendar": return <MiniCalendar tasks={tasks} />;
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

        {/* BG Picker Modal */}
        {showBgPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowBgPicker(false)}>
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
              <BackgroundPicker currentGradient={bgGradient} customBg={customBg}
                onGradientChange={setBgGradient} onCustomBg={setCustomBg}
                isOpen={showBgPicker} onClose={() => setShowBgPicker(false)} />
            </div>
          </div>
        )}

        {/* Main area — fits viewport, no page scroll */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 pt-2 pb-4 relative z-10 flex flex-col gap-3 h-full">

            {/* Top bar — Notion-style */}
            <div className="flex items-center justify-between h-12 animate-fade-in shrink-0">
              {/* Left: greeting */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-base font-display font-semibold text-foreground whitespace-nowrap">
                  {greeting.emoji} {greeting.text}, <span className="text-primary">{profileData.username || "dev"}</span>
                </span>
                <span className="hidden md:inline text-muted-foreground/30 font-mono text-sm">·</span>
                <span className="hidden md:inline text-muted-foreground/40 text-sm font-mono truncate">{greeting.sub}</span>
              </div>

              {/* Right: stats + actions — uniform h-8 pills */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden md:flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-mono bg-muted/30 border border-border/20 rounded-lg px-3 h-9">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                    <span className="text-foreground/80">{todoCount}</span>
                    <span className="text-muted-foreground/40 text-xs">todo</span>
                  </span>
                  {inProgressCount > 0 && (
                    <span className="inline-flex items-center gap-2 text-sm font-mono bg-primary/5 border border-primary/10 rounded-lg px-3 h-9">
                      <Loader2 className="w-3.5 h-3.5 text-primary/60 animate-spin" />
                      <span className="text-primary/70">{inProgressCount}</span>
                    </span>
                  )}
                  <button
                    onClick={() => setFilter("done")}
                    className={cn(
                      "inline-flex items-center gap-2 text-sm font-mono border rounded-lg px-3 h-9 transition-all cursor-pointer hover:bg-muted/50",
                      filter === "done" ? "bg-primary/10 border-primary/30 shadow-sm" : "bg-muted/30 border-border/20"
                    )}
                  >
                    <span className="text-foreground/80">{doneCount}</span>
                    <span className="text-muted-foreground/30 text-xs">/{todayTasks.length}</span>
                    <Check className="w-3.5 h-3.5 text-success/50" />
                  </button>
                  <button
                    onClick={() => setFilter("todo")}
                    className={cn(
                      "inline-flex items-center gap-2 text-sm font-mono border rounded-lg px-3 h-9 transition-all cursor-pointer hover:bg-muted/50",
                      "bg-muted/30 border-border/20"
                    )}
                    title={`${streak} tarefas concluídas`}
                  >
                    <Flame className="w-3.5 h-3.5 text-accent/60" />
                    <span className="text-foreground/80">{streak}</span>
                  </button>
                  <span className="inline-flex items-center gap-2 text-sm font-mono bg-muted/30 border border-border/20 rounded-lg px-3 h-9">
                    <div className="w-16 h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/50 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-primary/70">{progress}%</span>
                  </span>
                </div>

                <div className="hidden md:block w-px h-5 bg-border/20 mx-0.5" />

                {/* Dashboard */}
                <button onClick={() => navigate("/webhooks")}
                  className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground/60 hover:text-foreground bg-muted/30 border border-border/20 rounded-lg px-3 h-9 hover:bg-muted/40 transition-all">
                  <Webhook className="w-4 h-4" />
                  <span className="hidden md:inline">dashboard</span>
                </button>

                {/* Clock */}
                <PixelClock className="hidden md:flex" timezone={profileData.timezone} />

                {/* Profile */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center gap-2 bg-muted/30 border border-border/20 rounded-lg px-3 h-9 hover:bg-muted/40 transition-all group">
                      {profileData.avatar_url ? (
                        <img src={profileData.avatar_url} alt="avatar" className="w-6 h-6 rounded-md object-cover border border-primary/15" />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/15 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-primary/70" />
                        </div>
                      )}
                      <span className="hidden md:block text-sm font-mono text-foreground/60 group-hover:text-foreground transition-colors">{profileData.username || "user"}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-3 bg-card/95 backdrop-blur-xl border-border/50">
                    {/* Avatar section */}
                    <div className="flex items-center gap-3 pb-3 border-b border-border/30 mb-2">
                      <label className="relative cursor-pointer group">
                        {profileData.avatar_url ? (
                          <img src={profileData.avatar_url} alt="avatar" className="w-12 h-12 rounded-xl object-cover border-2 border-primary/20" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/15 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {uploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                      </label>
                      <div>
                        <p className="text-sm font-semibold">{profileData.username || "user"}</p>
                        <p className="text-[10px] font-mono text-muted-foreground/40">online · {dateStr}</p>
                      </div>
                    </div>

                    {/* Timezone */}
                    <div className="px-1 py-1.5 mb-2">
                      <label className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60 mb-1.5">
                        <User className="w-3 h-3" /> Nome do perfil
                      </label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        maxLength={50}
                        placeholder="Seu nome"
                        className="w-full bg-card border border-border/30 rounded-md px-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />

                      <label className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60 mb-1.5 mt-2">
                        <Globe className="w-3 h-3" /> Fuso horário
                      </label>
                      <Select value={profileData.timezone} onValueChange={handleTimezoneChange}>
                        <SelectTrigger className="w-full bg-card border border-border/30 rounded-md text-xs font-mono h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border/50 z-[200]">
                          <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                          <SelectItem value="America/Manaus">Manaus (AMT)</SelectItem>
                          <SelectItem value="America/Bahia">Bahia (BRT)</SelectItem>
                          <SelectItem value="America/Noronha">Fernando de Noronha (FNT)</SelectItem>
                          <SelectItem value="America/Rio_Branco">Rio Branco (ACT)</SelectItem>
                          <SelectItem value="America/New_York">New York (EST)</SelectItem>
                          <SelectItem value="America/Chicago">Chicago (CST)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                          <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                          <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                          <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                          <SelectItem value="Pacific/Auckland">Auckland (NZST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <button onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/auth");
                    }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-destructive/10 transition-all text-xs font-mono text-destructive/70 hover:text-destructive">
                      <LogOut className="w-3.5 h-3.5" />
                      auth.signOut()
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Main grid: Tasks + Side panel — fills remaining space */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 flex-1 min-h-0 overflow-hidden animate-fade-in" style={{ animationDelay: "80ms" }}>

              {/* Tasks — scrollable inside */}
              <div className="min-h-0">
                <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg overflow-hidden h-full flex flex-col">
                  {/* File tab bar */}
                   <div className="flex items-center border-b border-border/30 bg-muted/10 shrink-0 overflow-x-auto scrollbar-hidden">
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      {WORKSPACE_TABS.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setWorkspaceTab(tab.id)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-t-lg text-xs font-mono transition-all whitespace-nowrap",
                            workspaceTab === tab.id
                              ? "bg-card border border-border/30 border-b-0 -mb-px relative z-10 text-foreground"
                              : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/20"
                          )}
                        >
                          <tab.icon className={cn("w-4 h-4", workspaceTab === tab.id && "text-primary")} />
                          {tab.file}
                          {tab.id === "tasks" && workspaceTab === tab.id && (
                            <span className="w-2 h-2 rounded-full bg-primary/60" />
                          )}
                        </button>
                      ))}
                    </div>
                    {workspaceTab === "tasks" && (
                      <div className="ml-auto pr-3 flex gap-2">
                        <button onClick={() => setShowInput(true)}
                          className="text-xs font-mono flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg px-3 py-2 transition-all">
                          <Plus className="w-4 h-4" /> rápida
                        </button>
                        <button onClick={startNewTask}
                          className="text-xs font-mono flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-lg px-4 py-2 hover:bg-primary/20 transition-all">
                          <Plus className="w-4 h-4" /> new Task()
                        </button>
                      </div>
                    )}
                  </div>

                  {workspaceTab === "tasks" ? (
                    <>
                      <div className="px-4 pt-3 shrink-0">
                        <div className="flex gap-1.5 mb-3">
                          {STATUS_FILTERS.map((f) => (
                            <button key={f.id} onClick={() => setFilter(f.id)}
                              className={cn("relative px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5",
                                filter === f.id
                                  ? "text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                              {filter === f.id && (
                                <motion.div
                                  layoutId="task-status-filter"
                                  className="absolute inset-0 bg-primary rounded-lg"
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10 flex items-center gap-1.5">
                                <f.icon className="w-3.5 h-3.5" />
                                {f.label}
                                <span className="opacity-50">{tasks.filter(t => t.status === f.id).length}</span>
                              </span>
                            </button>
                          ))}
                          <div className="ml-auto">
                            <button onClick={() => setViewByDay(!viewByDay)}
                              className={cn("px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5",
                                viewByDay
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                              <CalendarIcon className="w-3.5 h-3.5" />
                              por dia
                            </button>
                          </div>
                        </div>

                        {/* Date navigation bar */}
                        {viewByDay && (
                          <div className="flex items-center gap-1 mb-2 animate-fade-in">
                            <button
                              onClick={() => setSelectedDay(d => subDays(d, 1))}
                              className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all"
                              title="Dia anterior"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSelectedDay(startOfDay(new Date()))}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all",
                                isToday(selectedDay)
                                  ? "bg-primary/15 text-primary border border-primary/20"
                                  : "text-muted-foreground hover:bg-muted/40"
                              )}
                            >
                              hoje
                            </button>

                            <div className="flex-1 text-center">
                              <span className="text-[11px] font-mono font-semibold text-foreground">
                                {selectedDayLabel}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground/40 ml-1.5">
                                {format(selectedDay, "dd/MM/yyyy")}
                              </span>
                            </div>

                            <button
                              onClick={() => setSelectedDay(d => addDays(d, 1))}
                              className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all"
                              title="Próximo dia"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all" title="Escolher dia">
                                  <CalendarDays className="w-3.5 h-3.5" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                  mode="single"
                                  selected={selectedDay}
                                  onSelect={(d) => d && setSelectedDay(startOfDay(d))}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}

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
                        {viewByDay ? (
                          <div className="space-y-1">
                            {filteredTasks.map((task, idx) => renderTaskRow(task, idx))}
                            {filteredTasks.length === 0 && (
                              <div className="text-center py-6">
                                <p className="text-xs text-muted-foreground/40 font-mono">// nenhuma tarefa para {selectedDayLabel.toLowerCase()}</p>
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
                    </>
                  ) : workspaceTab === "study" ? (
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden p-4">
                      <StudyTab />
                    </div>
                  ) : workspaceTab === "diary" ? (
                    <div className="flex-1 min-h-0 overflow-hidden p-4">
                      <DiaryTab />
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden p-4">
                      <AnnotationsTab />
                    </div>
                  )}
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
                  {/* Tabs como "arquivos" estilo editor */}
                   <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/30 bg-muted/10 shrink-0 overflow-x-auto scrollbar-hidden">
                    {WIDGET_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all",
                          activeTab === tab.id
                            ? "bg-card border border-border/40 text-foreground shadow-sm"
                            : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/20"
                        )}
                      >
                        <tab.icon className={cn("w-4 h-4", activeTab === tab.id && "text-primary")} />
                        {tab.file}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden p-4"
                    >
                      {renderWidget()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer quote — compact, hidden when space is tight */}
            <div className="shrink-0 py-1 hidden xl:block">
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
          onClose={() => {
            if (creatingTask) {
              // On close, persist the creating task to the list if it has text
              const current = creatingTask;
              setCreatingTask(null);
              // Task already exists in DB from startNewTask, just update text if needed
              if (current.text?.trim()) {
                updateTask(current);
                setTasks((p) => {
                  if (p.find(t => t.id === current.id)) return p;
                  return [...p, current];
                });
              }
            }
            setSelectedTask(null);
            setCreatingTask(null);
          }}
          onUpdate={(t) => {
            if (creatingTask) {
              // Keep dialog open, just update the creating task reference
              setCreatingTask(t);
              updateTask(t);
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
