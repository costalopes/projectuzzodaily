import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen, Plus, ArrowLeft, Link2, Trash2, Check, X,
  Timer, Layers, ListChecks, ExternalLink, Play, Pause,
  RotateCcw, ChevronRight, HelpCircle, Shuffle, ThumbsUp,
  ThumbsDown, FileText, ChevronDown, FolderOpen, FolderPlus,
  Calendar, Flag, Clock, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ── Types ──────────────────────────────────────────────────────

interface Flashcard {
  id: string;
  front: string;
  back: string;
  correct: number;
  incorrect: number;
}

interface StudyLink {
  id: string;
  title: string;
  url: string;
}

interface TopicNote {
  id: string;
  text: string;
  folderId?: string; // null = root
}

interface NoteFolder {
  id: string;
  name: string;
}

interface TopicTask {
  id: string;
  text: string;
  done: boolean;
  status: "todo" | "in_progress" | "done";
  importance: "low" | "medium" | "high";
  dueDate?: string;
}

interface ContentPage {
  id: string;
  title: string;
  content: string;
  folderId?: string;
}

interface ContentFolder {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  text: string;
  done: boolean;
  notes: TopicNote[];
  tasks: TopicTask[];
  folders: NoteFolder[];
  content: string;
  contentPages: ContentPage[];
  contentFolders: ContentFolder[];
}

interface StudySession {
  date: string;
  seconds: number;
}

interface Subject {
  id: string;
  name: string;
  cover: string;
  emoji: string;
  flashcards: Flashcard[];
  links: StudyLink[];
  topics: Topic[];
  sessions: StudySession[];
  totalSeconds: number;
  createdAt: string;
}

type SubjectView = "topics" | "flashcards" | "links" | "timer";

const COVER_PRESETS = [
  "from-violet-600/30 to-indigo-900/30",
  "from-emerald-600/30 to-teal-900/30",
  "from-amber-600/30 to-orange-900/30",
  "from-rose-600/30 to-pink-900/30",
  "from-cyan-600/30 to-blue-900/30",
  "from-fuchsia-600/30 to-purple-900/30",
];

const EMOJI_PRESETS = ["📚", "💻", "🧮", "🎨", "🔬", "📐", "🌍", "🧠", "⚡", "🎯"];

const uid = () => Math.random().toString(36).slice(2, 10);
const LS_KEY = "pixel-planner-study";
const loadSubjects = (): Subject[] => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } };
const saveSubjects = (s: Subject[]) => localStorage.setItem(LS_KEY, JSON.stringify(s));

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

const formatTotal = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min`;
};

// ── Help Tooltip ───────────────────────────────────────────────

const HelpTip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs font-mono bg-card border-border z-[120]">
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// ── Main Component ─────────────────────────────────────────────

export const StudyTab = () => {
  const [subjects, setSubjects] = useState<Subject[]>(loadSubjects);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<SubjectView>("topics");
  const [creating, setCreating] = useState(false);

  useEffect(() => { saveSubjects(subjects); }, [subjects]);

  const subject = subjects.find(s => s.id === activeSubject) ?? null;

  const updateSubject = useCallback((id: string, updater: (s: Subject) => Subject) => {
    setSubjects(prev => prev.map(s => s.id === id ? updater(s) : s));
  }, []);

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setActiveSubject(null);
  };

  if (subject) {
    return (
      <SubjectDetail
        subject={subject}
        view={activeView}
        onViewChange={setActiveView}
        onBack={() => { setActiveSubject(null); setActiveView("topics"); }}
        onUpdate={(updater) => updateSubject(subject.id, updater)}
        onDelete={() => deleteSubject(subject.id)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-mono text-muted-foreground/60">
            {subjects.length} matéria{subjects.length !== 1 ? "s" : ""}
          </span>
          <HelpTip text="Crie matérias como workspaces para organizar tópicos, flashcards, links e cronômetro de estudo." />
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> nova matéria
        </button>
      </div>

      {creating && (
        <CreateSubjectForm
          onSubmit={(s) => { setSubjects(prev => [s, ...prev]); setCreating(false); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {subjects.length === 0 && !creating ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
          <BookOpen className="w-10 h-10 text-primary/20" />
          <p className="text-sm font-mono text-muted-foreground/40 text-center max-w-[220px]">
            Crie sua primeira matéria para organizar seus estudos
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-2">
          {subjects.map(s => (
            <button key={s.id} onClick={() => setActiveSubject(s.id)}
              className="group relative rounded-xl border border-border/30 overflow-hidden hover:border-primary/30 transition-all text-left">
              <div className={cn("h-20 bg-gradient-to-br flex items-center justify-center", s.cover)}>
                <span className="text-3xl drop-shadow-lg">{s.emoji}</span>
              </div>
              <div className="p-3 bg-card/80 space-y-1">
                <h4 className="text-sm font-display font-semibold text-foreground truncate">{s.name}</h4>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/50">
                  <span>{s.topics.length} tópicos</span>
                  <span>·</span>
                  <span>{s.flashcards.length} cards</span>
                  {s.totalSeconds > 0 && (<><span>·</span><span className="text-primary/60">{formatTotal(s.totalSeconds)}</span></>)}
                </div>
                {s.topics.length > 0 && (
                  <div className="w-full h-1 bg-muted/30 rounded-full mt-1.5">
                    <div className="h-full bg-primary/50 rounded-full transition-all"
                      style={{ width: `${(s.topics.filter(t => t.done).length / s.topics.length) * 100}%` }} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Create Subject Form ────────────────────────────────────────

const CreateSubjectForm = ({ onSubmit, onCancel }: { onSubmit: (s: Subject) => void; onCancel: () => void }) => {
  const [name, setName] = useState("");
  const [cover, setCover] = useState(COVER_PRESETS[0]);
  const [emoji, setEmoji] = useState("📚");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      id: uid(), name: name.trim(), cover, emoji,
      flashcards: [], links: [], topics: [], sessions: [],
      totalSeconds: 0, createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-muted/20 border border-border/30 rounded-xl p-4 mb-3 space-y-3 animate-fade-in">
      <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
        placeholder="Nome da matéria..." autoFocus
        className="w-full bg-transparent text-sm font-display font-semibold text-foreground placeholder:text-muted-foreground/30 focus:outline-none border-b border-border/20 pb-2" />
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-muted-foreground/50 uppercase">ícone</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_PRESETS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              className={cn("w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all border",
                emoji === e ? "bg-primary/10 border-primary/30 scale-110" : "border-border/20 hover:bg-muted/30"
              )}>{e}</button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-muted-foreground/50 uppercase">capa</label>
        <div className="flex gap-1.5">
          {COVER_PRESETS.map(c => (
            <button key={c} onClick={() => setCover(c)}
              className={cn("w-8 h-8 rounded-lg bg-gradient-to-br transition-all border-2", c,
                cover === c ? "border-primary scale-110" : "border-transparent"
              )} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="text-xs font-mono text-muted-foreground/50 hover:text-foreground transition-colors px-3 py-1.5">cancelar</button>
        <button onClick={handleSubmit} disabled={!name.trim()}
          className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-4 py-1.5 hover:bg-primary/20 transition-all disabled:opacity-30">criar</button>
      </div>
    </div>
  );
};

// ── Subject Detail ─────────────────────────────────────────────

const VIEW_TABS: { id: SubjectView; label: string; icon: typeof Timer }[] = [
  { id: "topics", label: "Tópicos", icon: ListChecks },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "links", label: "Links", icon: Link2 },
  { id: "timer", label: "Timer", icon: Timer },
];

interface SubjectDetailProps {
  subject: Subject;
  view: SubjectView;
  onViewChange: (v: SubjectView) => void;
  onBack: () => void;
  onUpdate: (updater: (s: Subject) => Subject) => void;
  onDelete: () => void;
}

const SubjectDetail = ({ subject, view, onViewChange, onBack, onUpdate, onDelete }: SubjectDetailProps) => {
  const topicsDone = subject.topics.filter(t => t.done).length;
  const progress = subject.topics.length > 0 ? Math.round((topicsDone / subject.topics.length) * 100) : 0;

  return (
    <div className="h-full flex flex-col">
      <div className={cn("relative h-16 bg-gradient-to-br rounded-xl mb-3 flex items-center px-4 shrink-0", subject.cover)}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-mono text-foreground/80 hover:text-foreground bg-card/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> voltar
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-2xl">{subject.emoji}</span>
          <div className="text-right">
            <h3 className="text-sm font-display font-bold text-foreground">{subject.name}</h3>
            <span className="text-[10px] font-mono text-foreground/60">{progress}% · {formatTotal(subject.totalSeconds)} estudados</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-3 shrink-0">
        {VIEW_TABS.map(t => (
          <button key={t.id} onClick={() => onViewChange(t.id)}
            className={cn("flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-all",
              view === t.id ? "bg-primary/10 border-primary/20 text-primary" : "border-border/20 text-muted-foreground/50 hover:bg-muted/20"
            )}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
        <button onClick={onDelete} className="ml-auto text-[11px] font-mono text-destructive/50 hover:text-destructive transition-colors px-2">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden">
        {view === "topics" && <TopicsView subject={subject} onUpdate={onUpdate} />}
        {view === "flashcards" && <FlashcardsView subject={subject} onUpdate={onUpdate} />}
        {view === "links" && <LinksView subject={subject} onUpdate={onUpdate} />}
        {view === "timer" && <StudyTimerView subject={subject} onUpdate={onUpdate} />}
      </div>
    </div>
  );
};

// ── Topics View (Notion-like) ──────────────────────────────────

const TopicsView = ({ subject, onUpdate }: { subject: Subject; onUpdate: (u: (s: Subject) => Subject) => void }) => {
  const [input, setInput] = useState("");
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  const addTopic = () => {
    if (!input.trim()) return;
    onUpdate(s => ({ ...s, topics: [...s.topics, { id: uid(), text: input.trim(), done: false, notes: [], tasks: [], folders: [], content: "", contentPages: [], contentFolders: [] }] }));
    setInput("");
  };

  const toggleTopic = (id: string) => {
    onUpdate(s => ({ ...s, topics: s.topics.map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  };

  const deleteTopic = (id: string) => {
    onUpdate(s => ({ ...s, topics: s.topics.filter(t => t.id !== id) }));
    if (openTopic === id) setOpenTopic(null);
  };

  const updateTopic = (id: string, updater: (t: Topic) => Topic) => {
    onUpdate(s => ({ ...s, topics: s.topics.map(t => t.id === id ? updater(t) : t) }));
  };

  const opened = openTopic ? subject.topics.find(t => t.id === openTopic) : null;

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-mono text-muted-foreground/40 uppercase">
            {subject.topics.filter(t => t.done).length}/{subject.topics.length} concluídos
          </span>
          <HelpTip text="Clique no nome de um tópico para abri-lo como uma página completa. Dentro, adicione anotações, subtarefas e conteúdo detalhado." />
        </div>

        {subject.topics.map(t => {
          const hasContent = t.content || t.notes.length > 0 || t.tasks.length > 0;
          return (
            <div key={t.id} className="flex items-center gap-2 group rounded-lg hover:bg-muted/20 px-2 py-2 transition-all">
              <button onClick={(e) => { e.stopPropagation(); toggleTopic(t.id); }}
                className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                  t.done ? "bg-success/80 border-success/80" : "border-muted-foreground/20 hover:border-primary"
                )}>
                {t.done && <Check className="w-2.5 h-2.5 text-success-foreground" />}
              </button>
              <button onClick={() => setOpenTopic(t.id)} className="flex-1 text-left min-w-0 flex items-center gap-1.5">
                <span className={cn("text-sm font-mono truncate", t.done ? "line-through text-muted-foreground/40" : "text-foreground hover:text-primary transition-colors")}>
                  {t.text}
                </span>
                {hasContent && <FileText className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => setOpenTopic(t.id)} className="text-muted-foreground/40 hover:text-primary transition-colors" title="Abrir página">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteTopic(t.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        <div className="flex gap-2 pt-1">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTopic()}
            placeholder="Novo tópico..."
            className="flex-1 bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30" />
          <button onClick={addTopic} className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 hover:bg-primary/20 transition-all">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full-screen overlay for topic detail */}
      {opened && (
        <TopicOverlay
          topic={opened}
          onClose={() => setOpenTopic(null)}
          onUpdate={(u) => updateTopic(opened.id, u)}
          onDelete={() => deleteTopic(opened.id)}
        />
      )}
    </>
  );
};

// ── Topic Overlay (Notion-like full page) ──────────────────────

interface TopicOverlayProps {
  topic: Topic;
  onClose: () => void;
  onUpdate: (updater: (t: Topic) => Topic) => void;
  onDelete: () => void;
}

const TopicOverlay = ({ topic, onClose, onUpdate, onDelete }: TopicOverlayProps) => {
  const [title, setTitle] = useState(topic.text);
  const [newTask, setNewTask] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "tasks" | "notes">("content");
  const [taskFilter, setTaskFilter] = useState<"all" | "todo" | "in_progress" | "done">("all");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  // Content tab state
  const [activeContentFolder, setActiveContentFolder] = useState<string | null>(null);
  const [creatingContentFolder, setCreatingContentFolder] = useState(false);
  const [newContentFolder, setNewContentFolder] = useState("");
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");

  const saveTitle = () => {
    if (title.trim() && title !== topic.text) {
      onUpdate(t => ({ ...t, text: title.trim() }));
    }
  };

  // ── Task operations ──
  const addTask = () => {
    if (!newTask.trim()) return;
    onUpdate(t => ({ ...t, tasks: [...t.tasks, { id: uid(), text: newTask.trim(), done: false, status: "todo" as const, importance: "medium" as const }] }));
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    onUpdate(t => ({
      ...t,
      tasks: t.tasks.map(tk => {
        if (tk.id !== id) return tk;
        const newDone = !tk.done;
        return { ...tk, done: newDone, status: newDone ? "done" as const : "todo" as const };
      })
    }));
  };

  const updateTaskStatus = (id: string, status: TopicTask["status"]) => {
    onUpdate(t => ({
      ...t,
      tasks: t.tasks.map(tk => tk.id === id ? { ...tk, status, done: status === "done" } : tk)
    }));
  };

  const updateTaskImportance = (id: string, importance: TopicTask["importance"]) => {
    onUpdate(t => ({ ...t, tasks: t.tasks.map(tk => tk.id === id ? { ...tk, importance } : tk) }));
  };

  const updateTaskDueDate = (id: string, dueDate: string) => {
    onUpdate(t => ({ ...t, tasks: t.tasks.map(tk => tk.id === id ? { ...tk, dueDate: dueDate || undefined } : tk) }));
  };

  const deleteTask = (id: string) => {
    onUpdate(t => ({ ...t, tasks: t.tasks.filter(tk => tk.id !== id) }));
  };

  // ── Note & folder operations ──
  const addNote = () => {
    if (!newNote.trim()) return;
    onUpdate(t => ({ ...t, notes: [...t.notes, { id: uid(), text: newNote.trim(), folderId: activeFolder || undefined }] }));
    setNewNote("");
  };

  const updateNote = (id: string, text: string) => {
    onUpdate(t => ({ ...t, notes: t.notes.map(n => n.id === id ? { ...n, text } : n) }));
  };

  const deleteNote = (id: string) => {
    onUpdate(t => ({ ...t, notes: t.notes.filter(n => n.id !== id) }));
  };

  const addFolder = () => {
    if (!newFolder.trim()) return;
    onUpdate(t => ({ ...t, folders: [...(t.folders || []), { id: uid(), name: newFolder.trim() }] }));
    setNewFolder("");
    setCreatingFolder(false);
  };

  const deleteFolder = (folderId: string) => {
    onUpdate(t => ({
      ...t,
      folders: (t.folders || []).filter(f => f.id !== folderId),
      notes: t.notes.map(n => n.folderId === folderId ? { ...n, folderId: undefined } : n)
    }));
    if (activeFolder === folderId) setActiveFolder(null);
  };

  // ── Computed ──
  const tasksDone = topic.tasks.filter(t => t.done).length;
  const tasksProgress = topic.tasks.length > 0 ? Math.round((tasksDone / topic.tasks.length) * 100) : 0;

  const filteredTasks = topic.tasks.filter(tk => taskFilter === "all" || tk.status === taskFilter);

  const folders = topic.folders || [];
  const currentNotes = topic.notes.filter(n =>
    activeFolder === null ? !n.folderId : n.folderId === activeFolder
  );

  const importanceColors: Record<string, string> = {
    low: "text-muted-foreground/50 border-muted-foreground/20",
    medium: "text-primary border-primary/30",
    high: "text-destructive border-destructive/30"
  };

  const importanceLabels: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta" };
  const statusLabels: Record<string, string> = { todo: "A fazer", in_progress: "Fazendo", done: "Concluída" };
  const statusColors: Record<string, string> = {
    todo: "bg-muted/20 text-muted-foreground/60",
    in_progress: "bg-primary/10 text-primary",
    done: "bg-success/10 text-success"
  };

  const tabs = [
    { key: "content" as const, label: "Conteúdo", icon: FileText, count: topic.content.length > 0 ? 1 : 0 },
    { key: "tasks" as const, label: "Subtarefas", icon: ListChecks, count: topic.tasks.length },
    { key: "notes" as const, label: "Notas", icon: Layers, count: topic.notes.length },
  ];

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClose}
        />

        {/* Card */}
        <motion.div
          className="relative bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-6rem)] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
        >
          {/* Terminal header */}
          <div className="flex items-center justify-between border-b border-border/30 bg-muted/10 px-5 py-2.5 rounded-t-2xl shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive/60" />
                <div className="w-2 h-2 rounded-full bg-primary/60" />
                <div className="w-2 h-2 rounded-full bg-success/60" />
              </div>
              <span className="text-[9px] font-mono text-muted-foreground/40">topic_page.md</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border",
                topic.done ? "bg-success/10 border-success/20 text-success" : "bg-muted/20 border-border/20 text-muted-foreground/50"
              )}>
                {topic.done ? "✓ concluído" : "pendente"}
              </span>
              <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title + progress */}
          <div className="px-6 md:px-10 pt-6 pb-2 space-y-2 shrink-0">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              className="text-2xl md:text-3xl font-display font-bold text-foreground bg-transparent w-full focus:outline-none placeholder:text-muted-foreground/20 leading-tight"
              placeholder="Título do tópico..."
            />
            {topic.tasks.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary/50 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${tasksProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">
                  {tasksDone}/{topic.tasks.length}
                </span>
              </div>
            )}
          </div>

          {/* Tabs navigation */}
          <div className="px-6 md:px-10 shrink-0">
            <div className="flex gap-1 border-b border-border/20 pb-px">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono uppercase tracking-wider rounded-t-lg transition-all",
                    activeTab === tab.key
                      ? "text-primary"
                      : "text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-muted/10"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full",
                      activeTab === tab.key ? "bg-primary/15 text-primary" : "bg-muted/20 text-muted-foreground/30"
                    )}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="topic-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="max-w-2xl mx-auto px-6 md:px-10 py-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >

                {/* Content tab */}
                {activeTab === "content" && (() => {
                  const contentFolders = topic.contentFolders || [];
                  const contentPages = topic.contentPages || [];
                  const editPage = editingPage ? contentPages.find(p => p.id === editingPage) : null;
                  const currentPages = contentPages.filter(p =>
                    activeContentFolder === null ? !p.folderId : p.folderId === activeContentFolder
                  );

                  const addContentFolder = () => {
                    if (!newContentFolder.trim()) return;
                    onUpdate(t => ({ ...t, contentFolders: [...(t.contentFolders || []), { id: uid(), name: newContentFolder.trim() }] }));
                    setNewContentFolder("");
                    setCreatingContentFolder(false);
                  };

                  const deleteContentFolder = (fid: string) => {
                    onUpdate(t => ({
                      ...t,
                      contentFolders: (t.contentFolders || []).filter(f => f.id !== fid),
                      contentPages: (t.contentPages || []).map(p => p.folderId === fid ? { ...p, folderId: undefined } : p)
                    }));
                    if (activeContentFolder === fid) setActiveContentFolder(null);
                  };

                  const addPage = () => {
                    if (!newPageTitle.trim()) return;
                    const id = uid();
                    onUpdate(t => ({ ...t, contentPages: [...(t.contentPages || []), { id, title: newPageTitle.trim(), content: "", folderId: activeContentFolder || undefined }] }));
                    setNewPageTitle("");
                    setEditingPage(id);
                  };

                  const updatePage = (id: string, updates: Partial<ContentPage>) => {
                    onUpdate(t => ({ ...t, contentPages: (t.contentPages || []).map(p => p.id === id ? { ...p, ...updates } : p) }));
                  };

                  const deletePage = (id: string) => {
                    onUpdate(t => ({ ...t, contentPages: (t.contentPages || []).filter(p => p.id !== id) }));
                    if (editingPage === id) setEditingPage(null);
                  };

                  // If editing a page, show the editor
                  if (editPage) {
                    return (
                      <div className="space-y-4">
                        <button onClick={() => setEditingPage(null)} className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors">
                          <ArrowLeft className="w-3.5 h-3.5" /> Voltar às páginas
                        </button>
                        <input
                          value={editPage.title}
                          onChange={e => updatePage(editPage.id, { title: e.target.value })}
                          className="text-lg font-display font-bold text-foreground bg-transparent w-full focus:outline-none placeholder:text-muted-foreground/20"
                          placeholder="Título da página..."
                        />
                        <textarea
                          value={editPage.content}
                          onChange={e => updatePage(editPage.id, { content: e.target.value })}
                          placeholder="Escreva o conteúdo aqui..."
                          rows={12}
                          className="w-full bg-transparent text-sm font-mono text-foreground/90 placeholder:text-muted-foreground/20 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    );
                  }

                  // Pages list view
                  return (
                    <div className="space-y-4">
                      {/* General content area */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-wider">Notas gerais</span>
                        <textarea
                          value={topic.content}
                          onChange={e => onUpdate(t => ({ ...t, content: e.target.value }))}
                          placeholder="Resumos rápidos, fórmulas, conceitos..."
                          rows={4}
                          className="w-full bg-muted/5 border border-border/10 rounded-xl px-4 py-3 text-sm font-mono text-foreground/90 placeholder:text-muted-foreground/20 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>

                      <div className="h-px bg-border/15" />

                      {/* Folder navigation */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setActiveContentFolder(null)}
                          className={cn("flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all",
                            activeContentFolder === null
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border/20 text-muted-foreground/40 hover:text-muted-foreground/70"
                          )}
                        >
                          <FileText className="w-3 h-3" /> Raiz
                        </button>

                        {contentFolders.map(f => (
                          <div key={f.id} className="flex items-center gap-0.5">
                            <button
                              onClick={() => setActiveContentFolder(f.id)}
                              className={cn("flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-l-full border transition-all",
                                activeContentFolder === f.id
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border/20 text-muted-foreground/40 hover:text-muted-foreground/70"
                              )}
                            >
                              <FolderOpen className="w-3 h-3" /> {f.name}
                            </button>
                            <button
                              onClick={() => deleteContentFolder(f.id)}
                              className="text-[10px] px-1.5 py-1 rounded-r-full border border-l-0 border-border/20 text-muted-foreground/20 hover:text-destructive hover:border-destructive/30 transition-all"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}

                        {creatingContentFolder ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={newContentFolder}
                              onChange={e => setNewContentFolder(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") addContentFolder(); if (e.key === "Escape") setCreatingContentFolder(false); }}
                              autoFocus
                              placeholder="Nome..."
                              className="text-[10px] font-mono bg-transparent border border-primary/30 rounded px-2 py-0.5 w-24 focus:outline-none text-foreground"
                            />
                            <button onClick={addContentFolder} className="text-primary/60 hover:text-primary"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setCreatingContentFolder(false)} className="text-muted-foreground/30 hover:text-foreground"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCreatingContentFolder(true)}
                            className="flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full border border-dashed border-border/30 text-muted-foreground/30 hover:text-primary/60 hover:border-primary/30 transition-all"
                          >
                            <FolderPlus className="w-3 h-3" /> Nova pasta
                          </button>
                        )}
                      </div>

                      {/* Pages grid */}
                      <div className="space-y-1.5">
                        {currentPages.map(p => (
                          <motion.div
                            key={p.id}
                            layout
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group flex items-center gap-3 bg-muted/5 border border-border/10 rounded-xl px-4 py-3 hover:bg-muted/10 cursor-pointer transition-all"
                            onClick={() => setEditingPage(p.id)}
                          >
                            <FileText className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-mono text-foreground/90 block truncate">{p.title}</span>
                              {p.content && (
                                <span className="text-[10px] font-mono text-muted-foreground/30 block truncate">{p.content.slice(0, 60)}...</span>
                              )}
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); deletePage(p.id); }}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground/25 hover:text-destructive transition-all shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </div>

                      {/* Add page */}
                      <div className="flex gap-2">
                        <input
                          value={newPageTitle}
                          onChange={e => setNewPageTitle(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addPage()}
                          placeholder={`+ Nova página${activeContentFolder ? " nesta pasta" : ""}...`}
                          className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/20 focus:outline-none px-2 py-1.5 border-b border-transparent focus:border-primary/20 transition-colors"
                        />
                      </div>

                      {currentPages.length === 0 && (
                        <p className="text-[11px] font-mono text-muted-foreground/25 text-center py-4">
                          {activeContentFolder ? "Nenhuma página nesta pasta." : "Crie páginas para organizar seu conteúdo."}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Tasks tab */}
                {activeTab === "tasks" && (
                  <div className="space-y-3">
                    {/* Filter pills */}
                    <div className="flex gap-1.5 flex-wrap">
                      {(["all", "todo", "in_progress", "done"] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setTaskFilter(f)}
                          className={cn("text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all",
                            taskFilter === f
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border/20 text-muted-foreground/40 hover:text-muted-foreground/70"
                          )}
                        >
                          {f === "all" ? "Todas" : statusLabels[f]}
                        </button>
                      ))}
                    </div>

                    {/* Task list */}
                    <div className="space-y-1.5">
                      {filteredTasks.map(tk => {
                        const statusCycle: TopicTask["status"][] = ["todo", "in_progress", "done"];
                        const importanceCycle: TopicTask["importance"][] = ["low", "medium", "high"];
                        const nextStatus = statusCycle[(statusCycle.indexOf(tk.status) + 1) % statusCycle.length];
                        const nextImportance = importanceCycle[(importanceCycle.indexOf(tk.importance) + 1) % importanceCycle.length];
                        const importanceIcons: Record<string, string> = { low: "🟢", medium: "🟡", high: "🔴" };

                        return (
                          <motion.div
                            key={tk.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="group bg-muted/5 border border-border/10 rounded-xl px-3 py-2.5 hover:bg-muted/10 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <button onClick={() => toggleTask(tk.id)}
                                className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                  tk.done ? "bg-success/80 border-success/80" : "border-muted-foreground/25 hover:border-primary"
                                )}>
                                {tk.done && <Check className="w-2.5 h-2.5 text-success-foreground" />}
                              </button>
                              <span className={cn("text-sm font-mono flex-1", tk.done ? "line-through text-muted-foreground/30" : "text-foreground/90")}>
                                {tk.text}
                              </span>
                              <button onClick={() => deleteTask(tk.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground/25 hover:text-destructive transition-all shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Meta chips — click to cycle */}
                            <div className="flex items-center gap-1.5 mt-2 ml-7">
                              <button
                                onClick={() => updateTaskStatus(tk.id, nextStatus)}
                                className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all hover:brightness-125", statusColors[tk.status])}
                                title={`Clique para mudar para "${statusLabels[nextStatus]}"`}
                              >
                                {statusLabels[tk.status]}
                              </button>

                              <button
                                onClick={() => updateTaskImportance(tk.id, nextImportance)}
                                className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all hover:brightness-125", importanceColors[tk.importance])}
                                title={`Clique para mudar para "${importanceLabels[nextImportance]}"`}
                              >
                                {importanceIcons[tk.importance]} {importanceLabels[tk.importance]}
                              </button>

                              <div className="flex items-center gap-1 ml-1">
                                <Calendar className="w-3 h-3 text-muted-foreground/40" />
                                <input
                                  type="date"
                                  value={tk.dueDate || ""}
                                  onChange={e => updateTaskDueDate(tk.id, e.target.value)}
                                  className="text-[9px] font-mono bg-transparent text-muted-foreground/40 hover:text-muted-foreground/70 focus:outline-none border-none cursor-pointer transition-colors"
                                  style={{ colorScheme: "dark" }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Add task */}
                    <div className="pt-2 flex gap-2">
                      <input value={newTask} onChange={e => setNewTask(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }}
                        placeholder="+ Adicionar subtarefa..."
                        className="flex-1 bg-muted/5 border border-border/10 rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/20 px-4 py-2.5 transition-colors" />
                      {newTask.trim() && (
                        <button onClick={addTask} className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-[11px] font-mono hover:bg-primary/20 transition-all shrink-0">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {filteredTasks.length === 0 && (
                      <p className="text-[11px] font-mono text-muted-foreground/25 text-center py-6">
                        {taskFilter === "all" ? "Nenhuma subtarefa ainda." : `Nenhuma subtarefa "${statusLabels[taskFilter]}".`}
                      </p>
                    )}
                  </div>
                )}

                {/* Notes tab */}
                {activeTab === "notes" && (
                  <div className="space-y-4">
                    {/* Folder navigation */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Root button */}
                        <button
                          onClick={() => setActiveFolder(null)}
                          className={cn("flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all",
                            activeFolder === null
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border/20 text-muted-foreground/40 hover:text-muted-foreground/70"
                          )}
                        >
                          <FileText className="w-3 h-3" /> Raiz
                        </button>

                        {/* Folder pills */}
                        {folders.map(f => (
                          <div key={f.id} className="flex items-center gap-0.5">
                            <button
                              onClick={() => setActiveFolder(f.id)}
                              className={cn("flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-l-full border transition-all",
                                activeFolder === f.id
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border/20 text-muted-foreground/40 hover:text-muted-foreground/70"
                              )}
                            >
                              <FolderOpen className="w-3 h-3" /> {f.name}
                            </button>
                            <button
                              onClick={() => deleteFolder(f.id)}
                              className="text-[10px] px-1.5 py-1 rounded-r-full border border-l-0 border-border/20 text-muted-foreground/20 hover:text-destructive hover:border-destructive/30 transition-all"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}

                        {/* New folder */}
                        {creatingFolder ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={newFolder}
                              onChange={e => setNewFolder(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") addFolder(); if (e.key === "Escape") setCreatingFolder(false); }}
                              autoFocus
                              placeholder="Nome..."
                              className="text-[10px] font-mono bg-transparent border border-primary/30 rounded px-2 py-0.5 w-24 focus:outline-none text-foreground"
                            />
                            <button onClick={addFolder} className="text-primary/60 hover:text-primary"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setCreatingFolder(false)} className="text-muted-foreground/30 hover:text-foreground"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCreatingFolder(true)}
                            className="flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full border border-dashed border-border/30 text-muted-foreground/30 hover:text-primary/60 hover:border-primary/30 transition-all"
                          >
                            <FolderPlus className="w-3 h-3" /> Nova pasta
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notes list */}
                    <div className="space-y-2">
                      {currentNotes.map(n => (
                        <motion.div
                          key={n.id}
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group relative bg-muted/10 border border-border/15 rounded-xl px-4 py-3"
                        >
                          <textarea
                            value={n.text}
                            onChange={e => updateNote(n.id, e.target.value)}
                            rows={2}
                            className="w-full bg-transparent text-sm font-mono text-foreground/80 focus:outline-none resize-none leading-relaxed placeholder:text-muted-foreground/20"
                          />
                          <button onClick={() => deleteNote(n.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}

                      <div className="flex gap-2">
                        <input value={newNote} onChange={e => setNewNote(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addNote()}
                          placeholder={`+ Adicionar nota${activeFolder ? " nesta pasta" : ""}...`}
                          className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/20 focus:outline-none px-2 py-1.5 border-b border-transparent focus:border-primary/20 transition-colors" />
                      </div>

                      {currentNotes.length === 0 && (
                        <p className="text-[11px] font-mono text-muted-foreground/25 text-center py-6">
                          {activeFolder ? "Nenhuma nota nesta pasta." : "Nenhuma nota ainda."}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-border/20 px-5 py-2.5 flex items-center justify-between shrink-0">
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="text-[11px] font-mono text-destructive/40 hover:text-destructive transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" /> excluir tópico
            </button>
            <span className="text-[10px] font-mono text-muted-foreground/25">
              id: {topic.id.slice(0, 8)}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// ── Flashcards View (Enhanced) ─────────────────────────────────

const FlashcardsView = ({ subject, onUpdate }: { subject: Subject; onUpdate: (u: (s: Subject) => Subject) => void }) => {
  const [creating, setCreating] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [flipped, setFlipped] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [shuffled, setShuffled] = useState<Flashcard[]>([]);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [showResult, setShowResult] = useState(false);

  const addCard = () => {
    if (!front.trim() || !back.trim()) return;
    onUpdate(s => ({ ...s, flashcards: [...s.flashcards, { id: uid(), front: front.trim(), back: back.trim(), correct: 0, incorrect: 0 }] }));
    setFront(""); setBack(""); setCreating(false);
  };

  const deleteCard = (id: string) => {
    onUpdate(s => ({ ...s, flashcards: s.flashcards.filter(c => c.id !== id) }));
  };

  const startStudy = (shuffle: boolean) => {
    const cards = shuffle ? [...subject.flashcards].sort(() => Math.random() - 0.5) : [...subject.flashcards];
    setShuffled(cards);
    setCurrentIdx(0);
    setFlipped(null);
    setScore({ correct: 0, incorrect: 0 });
    setShowResult(false);
    setStudyMode(true);
  };

  const markAnswer = (correct: boolean) => {
    const card = shuffled[currentIdx];
    // Update score in subject
    onUpdate(s => ({
      ...s,
      flashcards: s.flashcards.map(c =>
        c.id === card.id
          ? { ...c, correct: c.correct + (correct ? 1 : 0), incorrect: c.incorrect + (correct ? 0 : 1) }
          : c
      )
    }));
    setScore(p => ({ correct: p.correct + (correct ? 1 : 0), incorrect: p.incorrect + (correct ? 0 : 1) }));

    // Next card or show results
    if (currentIdx + 1 >= shuffled.length) {
      setShowResult(true);
    } else {
      setCurrentIdx(p => p + 1);
      setFlipped(null);
    }
  };

  if (studyMode && shuffled.length > 0) {
    if (showResult) {
      const total = score.correct + score.incorrect;
      const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0;
      return (
        <div className="flex flex-col items-center gap-5 py-6 animate-fade-in">
          <span className="text-4xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📖"}</span>
          <h3 className="text-lg font-display font-bold text-foreground">Sessão concluída!</h3>
          <div className="flex items-center gap-6 text-sm font-mono">
            <div className="text-center">
              <span className="text-2xl font-bold text-success">{score.correct}</span>
              <p className="text-[10px] text-muted-foreground/50">acertos</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-destructive/70">{score.incorrect}</span>
              <p className="text-[10px] text-muted-foreground/50">erros</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">{pct}%</span>
              <p className="text-[10px] text-muted-foreground/50">aproveit.</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => startStudy(true)} className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 hover:bg-primary/20 transition-all">
              Estudar novamente
            </button>
            <button onClick={() => setStudyMode(false)} className="text-xs font-mono text-muted-foreground/50 border border-border/20 rounded-lg px-4 py-2 hover:bg-muted/20 transition-all">
              Voltar
            </button>
          </div>
        </div>
      );
    }

    const card = shuffled[currentIdx];
    const isFlipped = flipped === card.id;
    return (
      <div className="flex flex-col items-center gap-4 py-4 animate-fade-in">
        <div className="flex items-center justify-between w-full">
          <button onClick={() => { setStudyMode(false); setFlipped(null); }} className="text-xs font-mono text-muted-foreground/50 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-muted-foreground/50">
            {currentIdx + 1} / {shuffled.length}
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-success">{score.correct}✓</span>
            <span className="text-destructive/60">{score.incorrect}✗</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-muted/20 rounded-full">
          <div className="h-full bg-primary/50 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / shuffled.length) * 100}%` }} />
        </div>

        <button onClick={() => setFlipped(isFlipped ? null : card.id)}
          className={cn(
            "w-full min-h-[180px] border rounded-xl p-6 flex items-center justify-center transition-all",
            isFlipped ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-border/30 hover:border-primary/20"
          )}>
          <div className="text-center">
            <span className="text-[9px] font-mono text-muted-foreground/40 uppercase mb-2 block">
              {isFlipped ? "resposta" : "pergunta"} · clique para virar
            </span>
            <p className="text-base font-mono text-foreground">{isFlipped ? card.back : card.front}</p>
          </div>
        </button>

        {isFlipped ? (
          <div className="flex items-center gap-3 w-full">
            <button onClick={() => markAnswer(false)}
              className="flex-1 flex items-center justify-center gap-2 text-xs font-mono py-2.5 rounded-lg border border-destructive/20 text-destructive/70 bg-destructive/5 hover:bg-destructive/10 transition-all">
              <ThumbsDown className="w-3.5 h-3.5" /> Errei
            </button>
            <button onClick={() => markAnswer(true)}
              className="flex-1 flex items-center justify-center gap-2 text-xs font-mono py-2.5 rounded-lg border border-success/20 text-success bg-success/5 hover:bg-success/10 transition-all">
              <ThumbsUp className="w-3.5 h-3.5" /> Acertei
            </button>
          </div>
        ) : (
          <p className="text-[10px] font-mono text-muted-foreground/30">Toque no card para revelar a resposta</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-mono text-muted-foreground/40 uppercase">{subject.flashcards.length} cards</span>
        <HelpTip text="Crie flashcards com pergunta e resposta. No modo estudo, vire os cards e marque se acertou ou errou. O sistema rastreia seu desempenho." />
      </div>

      {subject.flashcards.length > 0 && (
        <div className="flex gap-2 mb-2">
          <button onClick={() => startStudy(false)}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-mono text-primary bg-primary/5 border border-primary/10 rounded-lg py-2.5 hover:bg-primary/10 transition-all">
            <Layers className="w-3.5 h-3.5" /> Estudar
          </button>
          <button onClick={() => startStudy(true)}
            className="flex items-center justify-center gap-2 text-xs font-mono text-accent bg-accent/5 border border-accent/10 rounded-lg py-2.5 px-4 hover:bg-accent/10 transition-all">
            <Shuffle className="w-3.5 h-3.5" /> Aleatório
          </button>
        </div>
      )}

      {subject.flashcards.map(c => {
        const total = c.correct + c.incorrect;
        const pct = total > 0 ? Math.round((c.correct / total) * 100) : null;
        return (
          <div key={c.id} className="bg-muted/10 border border-border/20 rounded-lg px-3 py-2.5 group">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-foreground truncate">{c.front}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] font-mono text-muted-foreground/50 truncate">{c.back}</p>
                  {pct !== null && (
                    <span className={cn("text-[9px] font-mono shrink-0", pct >= 80 ? "text-success/60" : pct >= 50 ? "text-accent/60" : "text-destructive/50")}>
                      {pct}% ({total}x)
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => deleteCard(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all shrink-0 mt-0.5">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      {creating ? (
        <div className="bg-muted/20 border border-border/30 rounded-xl p-3 space-y-2 animate-fade-in">
          <input value={front} onChange={e => setFront(e.target.value)} placeholder="Pergunta..." autoFocus
            className="w-full bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none border-b border-border/20 pb-2" />
          <input value={back} onChange={e => setBack(e.target.value)} placeholder="Resposta..."
            onKeyDown={e => e.key === "Enter" && addCard()}
            className="w-full bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setCreating(false)} className="text-xs font-mono text-muted-foreground/50 px-2">cancelar</button>
            <button onClick={addCard} disabled={!front.trim() || !back.trim()}
              className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 disabled:opacity-30">salvar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-mono text-muted-foreground/40 border border-dashed border-border/30 rounded-lg py-2.5 hover:text-primary hover:border-primary/20 transition-all">
          <Plus className="w-3.5 h-3.5" /> novo flashcard
        </button>
      )}
    </div>
  );
};

// ── Links View ─────────────────────────────────────────────────

const LinksView = ({ subject, onUpdate }: { subject: Subject; onUpdate: (u: (s: Subject) => Subject) => void }) => {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const addLink = () => {
    if (!url.trim()) return;
    onUpdate(s => ({ ...s, links: [...s.links, { id: uid(), title: title.trim() || url.trim(), url: url.trim() }] }));
    setTitle(""); setUrl(""); setAdding(false);
  };

  const deleteLink = (id: string) => {
    onUpdate(s => ({ ...s, links: s.links.filter(l => l.id !== id) }));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-mono text-muted-foreground/40 uppercase">{subject.links.length} links</span>
        <HelpTip text="Salve links de materiais de estudo, vídeos, artigos e documentações para consulta rápida." />
      </div>

      {subject.links.map(l => (
        <div key={l.id} className="flex items-center gap-2.5 bg-muted/10 border border-border/20 rounded-lg px-3 py-2.5 group">
          <Link2 className="w-3.5 h-3.5 text-primary/50 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono text-foreground truncate">{l.title}</p>
            <p className="text-[10px] font-mono text-muted-foreground/40 truncate">{l.url}</p>
          </div>
          <a href={l.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="text-primary/50 hover:text-primary transition-colors shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button onClick={() => deleteLink(l.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all shrink-0">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="bg-muted/20 border border-border/30 rounded-xl p-3 space-y-2 animate-fade-in">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título (opcional)..." autoFocus
            className="w-full bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none border-b border-border/20 pb-2" />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
            onKeyDown={e => e.key === "Enter" && addLink()}
            className="w-full bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setAdding(false)} className="text-xs font-mono text-muted-foreground/50 px-2">cancelar</button>
            <button onClick={addLink} disabled={!url.trim()}
              className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 disabled:opacity-30">salvar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-mono text-muted-foreground/40 border border-dashed border-border/30 rounded-lg py-2.5 hover:text-primary hover:border-primary/20 transition-all">
          <Plus className="w-3.5 h-3.5" /> adicionar link
        </button>
      )}
    </div>
  );
};

// ── Study Timer View ───────────────────────────────────────────

const StudyTimerView = ({ subject, onUpdate }: { subject: Subject; onUpdate: (u: (s: Subject) => Subject) => void }) => {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStop = () => {
    setRunning(false);
    if (elapsed > 0) {
      const today = new Date().toISOString().slice(0, 10);
      onUpdate(s => ({
        ...s,
        totalSeconds: s.totalSeconds + elapsed,
        sessions: [...s.sessions, { date: today, seconds: elapsed }],
      }));
      setElapsed(0);
    }
  };

  const handleReset = () => { setRunning(false); setElapsed(0); };

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex items-center gap-1.5 self-end">
        <HelpTip text="Cronômetro dedicado para esta matéria. O tempo é salvo automaticamente ao parar. Veja seu histórico de sessões abaixo." />
      </div>

      <div className="relative">
        <div className="w-40 h-40 rounded-full border-2 border-border/30 flex items-center justify-center relative">
          {running && <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-pulse" />}
          <span className="text-3xl font-mono font-bold text-foreground tracking-wider">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleReset} className="w-10 h-10 rounded-full border border-border/30 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-all">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={() => running ? handleStop() : setRunning(true)}
          className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
            running ? "bg-destructive/80 hover:bg-destructive text-destructive-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}>
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <div className="w-10 h-10" />
      </div>

      <div className="w-full space-y-2 pt-4 border-t border-border/20">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-muted-foreground/50">Total estudado</span>
          <span className="text-primary">{formatTotal(subject.totalSeconds)}</span>
        </div>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-muted-foreground/50">Sessões</span>
          <span className="text-foreground/70">{subject.sessions.length}</span>
        </div>
        {subject.sessions.length > 0 && (
          <div className="pt-2 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground/40 uppercase">últimas sessões</span>
            {subject.sessions.slice(-5).reverse().map((s, i) => (
              <div key={i} className="flex justify-between text-[11px] font-mono text-muted-foreground/50">
                <span>{s.date}</span>
                <span>{formatTotal(s.seconds)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
