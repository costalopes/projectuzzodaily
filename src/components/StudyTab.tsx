import { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen, Plus, ArrowLeft, Link2, Trash2, Check, X,
  Timer, Layers, ListChecks, ExternalLink, Play, Pause,
  RotateCcw, ChevronRight, ImageIcon, GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface StudyLink {
  id: string;
  title: string;
  url: string;
}

interface Topic {
  id: string;
  text: string;
  done: boolean;
}

interface StudySession {
  date: string;
  seconds: number;
}

interface Subject {
  id: string;
  name: string;
  cover: string; // gradient class or emoji
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

const loadSubjects = (): Subject[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch { return []; }
};

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
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-mono text-muted-foreground/60">
            {subjects.length} matéria{subjects.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> nova matéria
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <CreateSubjectForm
          onSubmit={(s) => { setSubjects(prev => [s, ...prev]); setCreating(false); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {/* Grid */}
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
            <button
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
              className="group relative rounded-xl border border-border/30 overflow-hidden hover:border-primary/30 transition-all text-left"
            >
              {/* Cover */}
              <div className={cn("h-20 bg-gradient-to-br flex items-center justify-center", s.cover)}>
                <span className="text-3xl drop-shadow-lg">{s.emoji}</span>
              </div>
              {/* Info */}
              <div className="p-3 bg-card/80 space-y-1">
                <h4 className="text-sm font-display font-semibold text-foreground truncate">{s.name}</h4>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/50">
                  <span>{s.topics.length} tópicos</span>
                  <span>·</span>
                  <span>{s.flashcards.length} cards</span>
                  {s.totalSeconds > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-primary/60">{formatTotal(s.totalSeconds)}</span>
                    </>
                  )}
                </div>
                {/* Progress bar */}
                {s.topics.length > 0 && (
                  <div className="w-full h-1 bg-muted/30 rounded-full mt-1.5">
                    <div
                      className="h-full bg-primary/50 rounded-full transition-all"
                      style={{ width: `${(s.topics.filter(t => t.done).length / s.topics.length) * 100}%` }}
                    />
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
      id: uid(),
      name: name.trim(),
      cover,
      emoji,
      flashcards: [],
      links: [],
      topics: [],
      sessions: [],
      totalSeconds: 0,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-muted/20 border border-border/30 rounded-xl p-4 mb-3 space-y-3 animate-fade-in">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
        placeholder="Nome da matéria..."
        autoFocus
        className="w-full bg-transparent text-sm font-display font-semibold text-foreground placeholder:text-muted-foreground/30 focus:outline-none border-b border-border/20 pb-2"
      />
      {/* Emoji picker */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-muted-foreground/50 uppercase">ícone</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_PRESETS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={cn("w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all border",
                emoji === e ? "bg-primary/10 border-primary/30 scale-110" : "border-border/20 hover:bg-muted/30"
              )}
            >{e}</button>
          ))}
        </div>
      </div>
      {/* Cover picker */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-muted-foreground/50 uppercase">capa</label>
        <div className="flex gap-1.5">
          {COVER_PRESETS.map(c => (
            <button
              key={c}
              onClick={() => setCover(c)}
              className={cn("w-8 h-8 rounded-lg bg-gradient-to-br transition-all border-2",
                c,
                cover === c ? "border-primary scale-110" : "border-transparent"
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="text-xs font-mono text-muted-foreground/50 hover:text-foreground transition-colors px-3 py-1.5">
          cancelar
        </button>
        <button onClick={handleSubmit} disabled={!name.trim()}
          className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-4 py-1.5 hover:bg-primary/20 transition-all disabled:opacity-30">
          criar
        </button>
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
      {/* Cover + back */}
      <div className={cn("relative h-16 bg-gradient-to-br rounded-xl mb-3 flex items-center px-4 shrink-0", subject.cover)}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-mono text-foreground/80 hover:text-foreground bg-card/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> voltar
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-2xl">{subject.emoji}</span>
          <div className="text-right">
            <h3 className="text-sm font-display font-bold text-foreground">{subject.name}</h3>
            <span className="text-[10px] font-mono text-foreground/60">
              {progress}% · {formatTotal(subject.totalSeconds)} estudados
            </span>
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 mb-3 shrink-0">
        {VIEW_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => onViewChange(t.id)}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-all",
              view === t.id
                ? "bg-primary/10 border-primary/20 text-primary"
                : "border-border/20 text-muted-foreground/50 hover:bg-muted/20"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
        <button
          onClick={onDelete}
          className="ml-auto text-[11px] font-mono text-destructive/50 hover:text-destructive transition-colors px-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden">
        {view === "topics" && <TopicsView subject={subject} onUpdate={onUpdate} />}
        {view === "flashcards" && <FlashcardsView subject={subject} onUpdate={onUpdate} />}
        {view === "links" && <LinksView subject={subject} onUpdate={onUpdate} />}
        {view === "timer" && <StudyTimerView subject={subject} onUpdate={onUpdate} />}
      </div>
    </div>
  );
};

// ── Topics View ────────────────────────────────────────────────

const TopicsView = ({ subject, onUpdate }: { subject: Subject; onUpdate: (u: (s: Subject) => Subject) => void }) => {
  const [input, setInput] = useState("");

  const addTopic = () => {
    if (!input.trim()) return;
    onUpdate(s => ({ ...s, topics: [...s.topics, { id: uid(), text: input.trim(), done: false }] }));
    setInput("");
  };

  const toggleTopic = (id: string) => {
    onUpdate(s => ({ ...s, topics: s.topics.map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  };

  const deleteTopic = (id: string) => {
    onUpdate(s => ({ ...s, topics: s.topics.filter(t => t.id !== id) }));
  };

  return (
    <div className="space-y-2">
      {subject.topics.map(t => (
        <div key={t.id} className="flex items-center gap-2.5 group px-1 py-1.5">
          <button onClick={() => toggleTopic(t.id)}
            className={cn("w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
              t.done ? "bg-success/80 border-success/80" : "border-muted-foreground/20 hover:border-primary"
            )}>
            {t.done && <Check className="w-2.5 h-2.5 text-success-foreground" />}
          </button>
          <span className={cn("text-sm font-mono flex-1", t.done ? "line-through text-muted-foreground/40" : "text-foreground")}>
            {t.text}
          </span>
          <button onClick={() => deleteTopic(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTopic()}
          placeholder="Novo tópico..."
          className="flex-1 bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button onClick={addTopic} className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 hover:bg-primary/20 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── Flashcards View ────────────────────────────────────────────

const FlashcardsView = ({ subject, onUpdate }: { subject: Subject; onUpdate: (u: (s: Subject) => Subject) => void }) => {
  const [creating, setCreating] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [flipped, setFlipped] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const addCard = () => {
    if (!front.trim() || !back.trim()) return;
    onUpdate(s => ({ ...s, flashcards: [...s.flashcards, { id: uid(), front: front.trim(), back: back.trim() }] }));
    setFront(""); setBack(""); setCreating(false);
  };

  const deleteCard = (id: string) => {
    onUpdate(s => ({ ...s, flashcards: s.flashcards.filter(c => c.id !== id) }));
  };

  if (studyMode && subject.flashcards.length > 0) {
    const card = subject.flashcards[currentIdx % subject.flashcards.length];
    const isFlipped = flipped === card.id;
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex items-center gap-3 w-full">
          <button onClick={() => { setStudyMode(false); setFlipped(null); }} className="text-xs font-mono text-muted-foreground/50 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-muted-foreground/50">
            {(currentIdx % subject.flashcards.length) + 1} / {subject.flashcards.length}
          </span>
        </div>
        <button
          onClick={() => setFlipped(isFlipped ? null : card.id)}
          className="w-full min-h-[180px] bg-muted/20 border border-border/30 rounded-xl p-6 flex items-center justify-center transition-all hover:border-primary/20"
        >
          <div className="text-center">
            <span className="text-[9px] font-mono text-muted-foreground/40 uppercase mb-2 block">
              {isFlipped ? "resposta" : "pergunta"}
            </span>
            <p className="text-base font-mono text-foreground">{isFlipped ? card.back : card.front}</p>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCurrentIdx(p => p - 1 < 0 ? subject.flashcards.length - 1 : p - 1); setFlipped(null); }}
            className="text-xs font-mono text-muted-foreground/50 hover:text-foreground bg-muted/20 border border-border/20 rounded-lg px-4 py-2 transition-all"
          >
            ← anterior
          </button>
          <button
            onClick={() => { setCurrentIdx(p => p + 1); setFlipped(null); }}
            className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 hover:bg-primary/20 transition-all"
          >
            próximo →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {subject.flashcards.length > 0 && (
        <button
          onClick={() => { setStudyMode(true); setCurrentIdx(0); setFlipped(null); }}
          className="w-full flex items-center justify-center gap-2 text-xs font-mono text-primary bg-primary/5 border border-primary/10 rounded-lg py-2.5 hover:bg-primary/10 transition-all mb-2"
        >
          <Layers className="w-3.5 h-3.5" /> Estudar ({subject.flashcards.length} cards)
        </button>
      )}

      {subject.flashcards.map(c => (
        <div key={c.id} className="bg-muted/10 border border-border/20 rounded-lg px-3 py-2.5 group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono text-foreground truncate">{c.front}</p>
              <p className="text-[11px] font-mono text-muted-foreground/50 truncate mt-0.5">{c.back}</p>
            </div>
            <button onClick={() => deleteCard(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all shrink-0 mt-0.5">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}

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
              className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 disabled:opacity-30">
              salvar
            </button>
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
    onUpdate(s => ({
      ...s,
      links: [...s.links, { id: uid(), title: title.trim() || url.trim(), url: url.trim() }]
    }));
    setTitle(""); setUrl(""); setAdding(false);
  };

  const deleteLink = (id: string) => {
    onUpdate(s => ({ ...s, links: s.links.filter(l => l.id !== id) }));
  };

  return (
    <div className="space-y-2">
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
              className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 disabled:opacity-30">
              salvar
            </button>
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

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Timer display */}
      <div className="relative">
        <div className="w-40 h-40 rounded-full border-2 border-border/30 flex items-center justify-center relative">
          {running && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-pulse" />
          )}
          <span className="text-3xl font-mono font-bold text-foreground tracking-wider">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button onClick={handleReset} className="w-10 h-10 rounded-full border border-border/30 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-all">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => running ? handleStop() : setRunning(true)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
            running
              ? "bg-destructive/80 hover:bg-destructive text-destructive-foreground"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <div className="w-10 h-10" /> {/* spacer */}
      </div>

      {/* Stats */}
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
