import { useState, useEffect, useMemo, useRef } from "react";
import { useCloudSetting } from "@/hooks/useCloudSetting";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Search, Pin, Trash2, FolderOpen, FolderPlus,
  Code, Tag, ChevronRight, ChevronDown, X, Copy, Check,
  Star, Clock, SortAsc, Hash, Bookmark, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────

interface Annotation {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  starred: boolean;
  type: "note" | "snippet";
  language?: string;
  createdAt: string;
  updatedAt: string;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const LS_KEY = "pixel-planner-annotations";

const FOLDER_COLORS = [
  "text-primary", "text-accent", "text-success",
  "text-destructive", "text-[hsl(var(--chart-4))]", "text-[hsl(var(--chart-5))]",
];

const LANGUAGES = [
  "javascript", "typescript", "python", "html", "css", "sql",
  "json", "bash", "rust", "go", "java", "c++",
];

type SortMode = "recent" | "alpha" | "starred";

// ── Main Component ─────────────────────────────────────

export const AnnotationsTab = () => {
  const [annotationsData, setAnnotationsData] = useCloudSetting<{ notes: Annotation[]; folders: Folder[] }>(
    "annotations_data", { notes: [], folders: [] }, LS_KEY
  );
  const notes = annotationsData.notes;
  const folders = annotationsData.folders;
  const setNotes = (updater: Annotation[] | ((prev: Annotation[]) => Annotation[])) => {
    setAnnotationsData(prev => ({
      ...prev,
      notes: typeof updater === "function" ? updater(prev.notes) : updater,
    }));
  };
  const setFolders = (updater: Folder[] | ((prev: Folder[]) => Folder[])) => {
    setAnnotationsData(prev => ({
      ...prev,
      folders: typeof updater === "function" ? updater(prev.folders) : updater,
    }));
  };
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterFolder, setFilterFolder] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => set.add(t)));
    return [...set].sort();
  }, [notes]);

  const filtered = useMemo(() => {
    let list = [...notes];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filterTag) list = list.filter(n => n.tags.includes(filterTag));
    if (filterFolder !== null) list = list.filter(n => n.folderId === filterFolder);

    // Pinned always first
    const pinned = list.filter(n => n.pinned);
    const rest = list.filter(n => !n.pinned);

    const sortFn = (a: Annotation, b: Annotation) => {
      if (sortMode === "alpha") return a.title.localeCompare(b.title);
      if (sortMode === "starred") return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    };

    return [...pinned.sort(sortFn), ...rest.sort(sortFn)];
  }, [notes, search, sortMode, filterTag, filterFolder]);

  const addNote = (type: "note" | "snippet") => {
    const now = new Date().toISOString();
    const note: Annotation = {
      id: uid(), title: type === "snippet" ? "Novo snippet" : "Nova anotação",
      content: "", folderId: filterFolder, tags: [], pinned: false, starred: false,
      type, language: type === "snippet" ? "javascript" : undefined,
      createdAt: now, updatedAt: now,
    };
    setNotes(prev => [note, ...prev]);
    setActiveNote(note.id);
  };

  const updateNote = (id: string, updates: Partial<Annotation>) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNote === id) setActiveNote(null);
  };

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders(prev => [...prev, {
      id: uid(), name: newFolderName.trim(),
      color: FOLDER_COLORS[prev.length % FOLDER_COLORS.length],
      collapsed: false,
    }]);
    setNewFolderName("");
    setCreatingFolder(false);
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n));
    if (filterFolder === id) setFilterFolder(null);
  };

  const toggleFolderCollapse = (id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, collapsed: !f.collapsed } : f));
  };

  const current = activeNote ? notes.find(n => n.id === activeNote) : null;

  if (current) {
    return (
      <NoteEditor
        note={current}
        folders={folders}
        allTags={allTags}
        onUpdate={(u) => updateNote(current.id, u)}
        onBack={() => setActiveNote(null)}
        onDelete={() => deleteNote(current.id)}
      />
    );
  }

  const noteCountInFolder = (fid: string | null) => notes.filter(n => n.folderId === fid).length;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-mono text-muted-foreground/60">
            {notes.length} anotaç{notes.length !== 1 ? "ões" : "ão"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => addNote("note")}
            className="flex items-center gap-1.5 text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1.5 hover:bg-primary/20 transition-all">
            <Plus className="w-3 h-3" /> nota
          </button>
          <button onClick={() => addNote("snippet")}
            className="flex items-center gap-1.5 text-[10px] font-mono text-accent bg-accent/10 border border-accent/20 rounded-lg px-2.5 py-1.5 hover:bg-accent/20 transition-all">
            <Code className="w-3 h-3" /> snippet
          </button>
        </div>
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-2 shrink-0">
        <div className={cn(
          "flex-1 flex items-center gap-2 bg-muted/20 border rounded-xl px-3 py-2 transition-all",
          searchFocused ? "border-primary/30 ring-1 ring-primary/10" : "border-border/20"
        )}>
          <Search className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            placeholder="Buscar notas, tags, conteúdo..."
            className="flex-1 bg-transparent text-xs font-mono placeholder:text-muted-foreground/30 focus:outline-none" />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground/40 hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {(["recent", "alpha", "starred"] as SortMode[]).map(m => (
            <button key={m} onClick={() => setSortMode(m)}
              className={cn("p-1.5 rounded-lg transition-all",
                sortMode === m ? "bg-primary/10 text-primary" : "text-muted-foreground/30 hover:text-muted-foreground"
              )}>
              {m === "recent" ? <Clock className="w-3.5 h-3.5" /> :
               m === "alpha" ? <SortAsc className="w-3.5 h-3.5" /> :
               <Star className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tags bar */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden shrink-0 pb-1">
          <button onClick={() => setFilterTag(null)}
            className={cn("shrink-0 text-[9px] font-mono px-2 py-1 rounded-md border transition-all",
              !filterTag ? "bg-primary/10 border-primary/20 text-primary" : "border-border/20 text-muted-foreground/40 hover:text-muted-foreground"
            )}>todas</button>
          {allTags.map(t => (
            <button key={t} onClick={() => setFilterTag(filterTag === t ? null : t)}
              className={cn("shrink-0 text-[9px] font-mono px-2 py-1 rounded-md border transition-all flex items-center gap-1",
                filterTag === t ? "bg-primary/10 border-primary/20 text-primary" : "border-border/20 text-muted-foreground/40 hover:text-muted-foreground"
              )}>
              <Hash className="w-2.5 h-2.5" />{t}
            </button>
          ))}
        </div>
      )}

      {/* Folders + Notes list */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden space-y-2">
        {/* Folder sidebar inline */}
        <div className="space-y-1">
          {/* All notes button */}
          <button onClick={() => setFilterFolder(null)}
            className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all",
              filterFolder === null ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:bg-muted/20"
            )}>
            <FileText className="w-3 h-3" /> Todas ({notes.length})
          </button>

          {folders.map(f => (
            <div key={f.id} className="group">
              <div className="flex items-center gap-1">
                <button onClick={() => toggleFolderCollapse(f.id)} className="p-0.5">
                  {f.collapsed
                    ? <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                    : <ChevronDown className="w-3 h-3 text-muted-foreground/30" />
                  }
                </button>
                <button onClick={() => setFilterFolder(filterFolder === f.id ? null : f.id)}
                  className={cn("flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all text-left",
                    filterFolder === f.id ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:bg-muted/20"
                  )}>
                  <FolderOpen className={cn("w-3 h-3", f.color)} />
                  {f.name}
                  <span className="text-muted-foreground/30 ml-auto">{noteCountInFolder(f.id)}</span>
                </button>
                <button onClick={() => deleteFolder(f.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/30 hover:text-destructive transition-all">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}

          {creatingFolder ? (
            <div className="flex items-center gap-1.5 px-2.5">
              <FolderPlus className="w-3 h-3 text-primary/50 shrink-0" />
              <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addFolder(); if (e.key === "Escape") setCreatingFolder(false); }}
                placeholder="Nome da pasta..." autoFocus
                className="flex-1 bg-transparent text-[10px] font-mono placeholder:text-muted-foreground/30 focus:outline-none border-b border-border/20 py-1" />
              <button onClick={addFolder} className="text-primary"><Check className="w-3 h-3" /></button>
              <button onClick={() => setCreatingFolder(false)} className="text-muted-foreground/40"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button onClick={() => setCreatingFolder(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground transition-all">
              <FolderPlus className="w-3 h-3" /> nova pasta
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="h-px bg-border/20" />

        {/* Notes grid */}
        <div className="space-y-1.5">
          <AnimatePresence>
            {filtered.map((note, i) => (
              <NoteCard key={note.id} note={note} index={i}
                folder={folders.find(f => f.id === note.folderId)}
                onClick={() => setActiveNote(note.id)}
                onTogglePin={() => updateNote(note.id, { pinned: !note.pinned })}
                onToggleStar={() => updateNote(note.id, { starred: !note.starred })}
                onDelete={() => deleteNote(note.id)}
              />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <FileText className="w-8 h-8 text-primary/15" />
              <p className="text-[11px] font-mono text-muted-foreground/30 text-center">
                {search ? "Nenhum resultado encontrado" : "Crie sua primeira anotação"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Note Card ──────────────────────────────────────────

interface NoteCardProps {
  note: Annotation;
  index: number;
  folder?: Folder;
  onClick: () => void;
  onTogglePin: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
}

const NoteCard = ({ note, index, folder, onClick, onTogglePin, onToggleStar, onDelete }: NoteCardProps) => {
  const preview = note.content.slice(0, 120).replace(/\n/g, " ");
  const timeAgo = getTimeAgo(note.updatedAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      onClick={onClick}
      className={cn(
        "group relative p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm",
        note.pinned
          ? "bg-primary/[0.04] border-primary/15 hover:border-primary/25"
          : "bg-muted/10 border-border/15 hover:border-border/30"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn("mt-0.5 shrink-0",
          note.type === "snippet" ? "text-accent/60" : "text-primary/40"
        )}>
          {note.type === "snippet" ? <Code className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-mono font-semibold text-foreground truncate">{note.title}</h4>
            {note.pinned && <Pin className="w-2.5 h-2.5 text-primary/50 shrink-0" />}
            {note.starred && <Star className="w-2.5 h-2.5 text-accent/60 fill-accent/60 shrink-0" />}
          </div>
          {preview && (
            <p className="text-[10px] font-mono text-muted-foreground/40 truncate mt-0.5 leading-relaxed">
              {preview}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            {note.type === "snippet" && note.language && (
              <span className="text-[8px] font-mono bg-accent/10 text-accent/70 px-1.5 py-0.5 rounded-md">
                {note.language}
              </span>
            )}
            {folder && (
              <span className={cn("text-[8px] font-mono flex items-center gap-0.5", folder.color)}>
                <FolderOpen className="w-2 h-2" /> {folder.name}
              </span>
            )}
            {note.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[8px] font-mono text-muted-foreground/30 flex items-center gap-0.5">
                <Hash className="w-2 h-2" />{t}
              </span>
            ))}
            <span className="text-[8px] font-mono text-muted-foreground/20 ml-auto shrink-0">{timeAgo}</span>
          </div>
        </div>
        {/* Actions */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          <button onClick={e => { e.stopPropagation(); onTogglePin(); }}
            className={cn("p-1 rounded-md transition-all", note.pinned ? "text-primary" : "text-muted-foreground/30 hover:text-primary")}>
            <Pin className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onToggleStar(); }}
            className={cn("p-1 rounded-md transition-all", note.starred ? "text-accent" : "text-muted-foreground/30 hover:text-accent")}>
            <Star className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded-md text-muted-foreground/30 hover:text-destructive transition-all">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Note Editor ────────────────────────────────────────

interface NoteEditorProps {
  note: Annotation;
  folders: Folder[];
  allTags: string[];
  onUpdate: (u: Partial<Annotation>) => void;
  onBack: () => void;
  onDelete: () => void;
}

const NoteEditor = ({ note, folders, allTags, onUpdate, onBack, onDelete }: NoteEditorProps) => {
  const [newTag, setNewTag] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || note.tags.includes(tag)) return;
    onUpdate({ tags: [...note.tags, tag] });
    setNewTag("");
  };

  const removeTag = (t: string) => onUpdate({ tags: note.tags.filter(x => x !== t) });

  const copyContent = () => {
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 hover:text-foreground bg-muted/20 rounded-lg px-2.5 py-1.5 transition-all">
          ← voltar
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button onClick={() => onUpdate({ pinned: !note.pinned })}
            className={cn("p-1.5 rounded-lg transition-all", note.pinned ? "text-primary bg-primary/10" : "text-muted-foreground/30 hover:text-primary")}>
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onUpdate({ starred: !note.starred })}
            className={cn("p-1.5 rounded-lg transition-all", note.starred ? "text-accent bg-accent/10" : "text-muted-foreground/30 hover:text-accent")}>
            <Star className="w-3.5 h-3.5" />
          </button>
          {note.type === "snippet" && (
            <button onClick={copyContent}
              className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground transition-all">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <input value={note.title}
        onChange={e => onUpdate({ title: e.target.value })}
        className="text-sm font-mono font-bold text-foreground bg-transparent focus:outline-none border-b border-border/10 pb-2 shrink-0"
        placeholder="Título da anotação..." />

      {/* Meta row: folder + language */}
      <div className="flex items-center gap-2 shrink-0">
        <select value={note.folderId || ""}
          onChange={e => onUpdate({ folderId: e.target.value || null })}
          className="bg-muted/20 border border-border/20 rounded-lg text-[10px] font-mono px-2 py-1.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20">
          <option value="">Sem pasta</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {note.type === "snippet" && (
          <select value={note.language || "javascript"}
            onChange={e => onUpdate({ language: e.target.value })}
            className="bg-accent/5 border border-accent/15 rounded-lg text-[10px] font-mono px-2 py-1.5 text-accent/70 focus:outline-none focus:ring-1 focus:ring-accent/20">
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
        <span className="text-[8px] font-mono text-muted-foreground/20 ml-auto">
          {getTimeAgo(note.updatedAt)}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {note.tags.map(t => (
          <span key={t} className="flex items-center gap-1 text-[9px] font-mono bg-primary/5 border border-primary/10 text-primary/70 px-2 py-0.5 rounded-md">
            <Hash className="w-2 h-2" />{t}
            <button onClick={() => removeTag(t)} className="hover:text-destructive ml-0.5"><X className="w-2 h-2" /></button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input value={newTag} onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addTag(); }}
            placeholder="+ tag"
            className="bg-transparent text-[9px] font-mono text-muted-foreground/40 placeholder:text-muted-foreground/20 focus:outline-none w-16" />
        </div>
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-h-0 rounded-xl border overflow-hidden flex flex-col",
        note.type === "snippet" ? "bg-[hsl(var(--muted))]/30 border-accent/10" : "border-border/15"
      )}>
        {note.type === "snippet" && (
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/10 bg-muted/10 shrink-0">
            <Code className="w-3 h-3 text-accent/50" />
            <span className="text-[9px] font-mono text-accent/50">{note.language}</span>
            <div className="ml-auto flex gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive/30" />
              <div className="w-2 h-2 rounded-full bg-accent/30" />
              <div className="w-2 h-2 rounded-full bg-success/30" />
            </div>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={note.content}
          onChange={e => onUpdate({ content: e.target.value })}
          placeholder={note.type === "snippet" ? "// cole ou escreva seu código aqui..." : "Escreva sua anotação..."}
          className={cn(
            "flex-1 w-full bg-transparent resize-none focus:outline-none p-3 leading-relaxed",
            note.type === "snippet"
              ? "text-[11px] font-mono text-foreground/80 placeholder:text-muted-foreground/20"
              : "text-xs font-mono text-foreground/80 placeholder:text-muted-foreground/20"
          )}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[8px] font-mono text-muted-foreground/20 shrink-0">
        <span>{note.content.length} caracteres</span>
        <span>{note.content.split(/\s+/).filter(Boolean).length} palavras</span>
        {note.type === "snippet" && <span>{note.content.split("\n").length} linhas</span>}
      </div>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────

function getTimeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
