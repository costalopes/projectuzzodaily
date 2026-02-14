import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, Flame, ArrowRight, LayoutList, Image as ImageIcon, Terminal, Timer, CalendarDays, ListChecks, StickyNote, Droplets, Coffee, Circle, Loader2, CalendarIcon, ChevronLeft, ChevronRight, BookOpen, PenLine, FileText, LogOut, Webhook, User, Camera, Globe } from "lucide-react";
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
import { TaskDetailDialog, type Task, type TaskStatus } from "@/components/TaskDetailDialog";
import { LofiPlayer } from "@/components/LofiPlayer";
import { StudyTab } from "@/components/StudyTab";
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

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const streak = doneCount; // streak baseado em tarefas concluídas

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    if (newStatus === "done") {
      setTaskCompleted(true);
      setTimeout(() => setTaskCompleted(false), 100);
      emitCatEvent("task_complete");
    }
    setTasks((p) => p.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("tasks").insert({
      user_id: user.id,
      text: newTask.trim(),
      status: "todo",
      importance: "média",
      description: "",
      notes: [],
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
    const { data, error } = await supabase.from("tasks").insert({
      user_id: user.id, text: "Nova tarefa", status: "todo", importance: "média", description: "", notes: [],
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
    }).eq("id", updated.id);
  };

  const deleteTask = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };

  const IMPORTANCE_ORDER: Record<string, number> = { alta: 0, média: 1, baixa: 2 };
  const filteredTasks = tasks.filter((t) => t.status === filter).sort((a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]);
  const todoCount = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;

  // Filter tasks for selected day view
  const dayFilteredTasks = useMemo(() => {
    if (!viewByDay) return filteredTasks;
    return filteredTasks.filter((t) => {
      if (!t.dueDate) return false;
      return isSameDay(parseISO(t.dueDate), selectedDay);
    });
  }, [filteredTasks, viewByDay, selectedDay]);

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
          "grid grid-cols-[2rem_auto_1fr_auto_auto] gap-2 items-center px-3 py-3 rounded-xl hover:bg-muted/30 group transition-all cursor-pointer border border-transparent hover:border-border/30",
          isDone && "opacity-40 hover:opacity-70"
        )}>
        <span className="text-[10px] font-mono text-muted-foreground/30 text-right select-none">{idx + 1}</span>
        <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
          className={cn(
            "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
            isDone ? "bg-success/80 border-success/80" : "border-muted-foreground/20 hover:border-primary hover:bg-primary/10"
          )}>
          <AnimatePresence>
            {isDone && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check className="w-2.5 h-2.5 text-success-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
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
        <div className="hidden sm:flex items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-md border transition-colors",
            task.importance === "alta" ? "bg-urgent/10 border-urgent/20 text-urgent" :
            task.importance === "média" ? "bg-accent/10 border-accent/20 text-accent" :
            "bg-muted/30 border-border/20 text-muted-foreground/60"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              task.importance === "alta" ? "bg-urgent" :
              task.importance === "média" ? "bg-accent" :
              "bg-muted-foreground/40"
            )} />
            {task.importance === "alta" ? "Alta" : task.importance === "média" ? "Média" : "Baixa"}
          </span>
          <span className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-md border transition-colors",
            isDone ? "bg-success/10 border-success/20 text-success" :
            isInProgress ? "bg-primary/10 border-primary/20 text-primary" :
            "bg-muted/30 border-border/20 text-muted-foreground/50"
          )}>
            {isInProgress && <Loader2 className="w-3 h-3 animate-spin" />}
            {isDone ? "✓ Concluída" : isInProgress ? "Em progresso" : "A fazer"}
          </span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all w-7 flex justify-center">
          <Trash2 className="w-3.5 h-3.5" />
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

        {/* BG Picker */}
        {showBgPicker && (
          <div className="max-w-6xl mx-auto px-4 -mt-2 relative z-30">
            <BackgroundPicker currentGradient={bgGradient} customBg={customBg}
              onGradientChange={setBgGradient} onCustomBg={setCustomBg}
              isOpen={showBgPicker} onClose={() => setShowBgPicker(false)} />
          </div>
        )}

        {/* Scrollable main area */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden">
          <div className="max-w-7xl mx-auto px-6 pt-2 pb-4 relative z-10 flex flex-col gap-3">

            {/* Top bar — Notion-style */}
            <div className="flex items-center justify-between h-10 animate-fade-in shrink-0">
              {/* Left: greeting */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm font-display font-semibold text-foreground whitespace-nowrap">
                  {greeting.emoji} {greeting.text}, <span className="text-primary">{profileData.username || "dev"}</span>
                </span>
                <span className="hidden md:inline text-muted-foreground/30 font-mono text-xs">·</span>
                <span className="hidden md:inline text-muted-foreground/40 text-xs font-mono truncate">{greeting.sub}</span>
              </div>

              {/* Right: stats + actions — uniform h-8 pills */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="hidden md:flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-muted/30 border border-border/20 rounded-lg px-2.5 h-8">
                    <span className="w-2 h-2 rounded-full bg-accent/60" />
                    <span className="text-foreground/80">{todoCount}</span>
                    <span className="text-muted-foreground/40 text-[11px]">todo</span>
                  </span>
                  {inProgressCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-primary/5 border border-primary/10 rounded-lg px-2.5 h-8">
                      <Loader2 className="w-3 h-3 text-primary/60 animate-spin" />
                      <span className="text-primary/70">{inProgressCount}</span>
                    </span>
                  )}
                  <button
                    onClick={() => setFilter("done")}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-mono border rounded-lg px-2.5 h-8 transition-all cursor-pointer hover:bg-muted/50",
                      filter === "done" ? "bg-primary/10 border-primary/30 shadow-sm" : "bg-muted/30 border-border/20"
                    )}
                  >
                    <span className="text-foreground/80">{doneCount}</span>
                    <span className="text-muted-foreground/30 text-[11px]">/{tasks.length}</span>
                    <Check className="w-3 h-3 text-success/50" />
                  </button>
                  <button
                    onClick={() => setFilter("todo")}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-mono border rounded-lg px-2.5 h-8 transition-all cursor-pointer hover:bg-muted/50",
                      "bg-muted/30 border-border/20"
                    )}
                    title={`${streak} tarefas concluídas`}
                  >
                    <Flame className="w-3 h-3 text-accent/60" />
                    <span className="text-foreground/80">{streak}</span>
                  </button>
                  <span className="inline-flex items-center gap-2 text-xs font-mono bg-muted/30 border border-border/20 rounded-lg px-2.5 h-8">
                    <div className="w-14 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/50 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-primary/70">{progress}%</span>
                  </span>
                </div>

                <div className="hidden md:block w-px h-5 bg-border/20 mx-0.5" />

                {/* Dashboard */}
                <button onClick={() => navigate("/webhooks")}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground/60 hover:text-foreground bg-muted/30 border border-border/20 rounded-lg px-2.5 h-8 hover:bg-muted/40 transition-all">
                  <Webhook className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">dashboard</span>
                </button>

                {/* Clock */}
                <PixelClock className="hidden md:flex" timezone={profileData.timezone} />

                {/* Profile */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center gap-2 bg-muted/30 border border-border/20 rounded-lg px-2.5 h-8 hover:bg-muted/40 transition-all group">
                      {profileData.avatar_url ? (
                        <img src={profileData.avatar_url} alt="avatar" className="w-5 h-5 rounded-md object-cover border border-primary/15" />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/15 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary/70" />
                        </div>
                      )}
                      <span className="hidden md:block text-xs font-mono text-foreground/60 group-hover:text-foreground transition-colors">{profileData.username || "user"}</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 flex-1 min-h-0 animate-fade-in" style={{ animationDelay: "80ms" }}>

              {/* Tasks — scrollable inside */}
              <div className="min-h-0">
                <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg overflow-hidden h-full flex flex-col">
                  {/* File tab bar */}
                   <div className="flex items-center border-b border-border/30 bg-muted/10 shrink-0 overflow-x-auto scrollbar-hidden">
                    <div className="flex items-center gap-0.5 px-1 py-1">
                      {WORKSPACE_TABS.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setWorkspaceTab(tab.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-[10px] font-mono transition-all whitespace-nowrap",
                            workspaceTab === tab.id
                              ? "bg-card border border-border/30 border-b-0 -mb-px relative z-10 text-foreground"
                              : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/20"
                          )}
                        >
                          <tab.icon className={cn("w-3 h-3", workspaceTab === tab.id && "text-primary")} />
                          {tab.file}
                          {tab.id === "tasks" && workspaceTab === tab.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          )}
                        </button>
                      ))}
                    </div>
                    {workspaceTab === "tasks" && (
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
                    )}
                  </div>

                  {workspaceTab === "tasks" ? (
                    <>
                      <div className="px-3 pt-2 shrink-0">
                        <div className="flex gap-1 mb-2">
                          {STATUS_FILTERS.map((f) => (
                            <button key={f.id} onClick={() => setFilter(f.id)}
                              className={cn("relative px-2.5 py-1 rounded-lg text-[9px] font-mono transition-all flex items-center gap-1",
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
                              <span className="relative z-10 flex items-center gap-1">
                                <f.icon className="w-3 h-3" />
                                {f.label}
                                <span className="opacity-50">{tasks.filter(t => t.status === f.id).length}</span>
                              </span>
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
                            {dayFilteredTasks.map((task, idx) => renderTaskRow(task, idx))}
                            {dayFilteredTasks.length === 0 && (
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
                  ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden p-4">
                      <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                        {workspaceTab === "diary" && (
                          <>
                            <PenLine className="w-10 h-10 text-primary/30" />
                            <h3 className="text-lg font-display font-bold text-foreground">Diário</h3>
                            <p className="text-sm text-muted-foreground/50 font-mono text-center max-w-xs">
                              Registre seus pensamentos, reflexões e progresso diário.
                            </p>
                            <span className="text-[10px] font-mono text-muted-foreground/30 bg-muted/20 px-3 py-1 rounded-lg">
                              // em breve
                            </span>
                          </>
                        )}
                        {workspaceTab === "annotations" && (
                          <>
                            <FileText className="w-10 h-10 text-primary/30" />
                            <h3 className="text-lg font-display font-bold text-foreground">Anotações</h3>
                            <p className="text-sm text-muted-foreground/50 font-mono text-center max-w-xs">
                              Crie e organize anotações rápidas, snippets de código e referências.
                            </p>
                            <span className="text-[10px] font-mono text-muted-foreground/30 bg-muted/20 px-3 py-1 rounded-lg">
                              // em breve
                            </span>
                          </>
                        )}
                      </div>
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
                  <div className="flex items-center gap-0.5 px-1.5 py-1.5 border-b border-border/30 bg-muted/10 shrink-0 overflow-x-auto scrollbar-hidden">
                    {WIDGET_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all",
                          activeTab === tab.id
                            ? "bg-card border border-border/40 text-foreground shadow-sm"
                            : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/20"
                        )}
                      >
                        <tab.icon className={cn("w-3 h-3", activeTab === tab.id && "text-primary")} />
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
                      className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden p-3"
                    >
                      {renderWidget()}
                    </motion.div>
                  </AnimatePresence>
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
