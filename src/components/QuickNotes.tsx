import { useState } from "react";
import { Trash2, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  text: string;
  color: string;
  pinned: boolean;
}

const COLORS = [
  "bg-primary/10 border-primary/20",
  "bg-accent/15 border-accent/20",
  "bg-success/10 border-success/20",
  "bg-destructive/10 border-destructive/20",
  "bg-secondary border-secondary",
];

export const QuickNotes = () => {
  const [notes, setNotes] = useState<Note[]>([
    { id: "1", text: "Lembrar de fazer deploy sexta 🚀", color: COLORS[0], pinned: true },
    { id: "2", text: "Ideia: micro-interações no onboarding", color: COLORS[1], pinned: false },
    { id: "3", text: "Pesquisar framer-motion spring configs", color: COLORS[2], pinned: false },
  ]);
  const [newNote, setNewNote] = useState("");

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes((n) => [
      ...n,
      { id: Date.now().toString(), text: newNote.trim(), color: COLORS[n.length % COLORS.length], pinned: false },
    ]);
    setNewNote("");
  };

  const togglePin = (id: string) =>
    setNotes((n) => n.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)));

  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        📝 Notas rápidas
      </h3>
      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
        {sorted.map((note) => (
          <div
            key={note.id}
            className={cn("rounded-xl px-3 py-2.5 flex items-start gap-2 group border transition-all", note.color)}
          >
            <p className="text-xs text-foreground flex-1 leading-relaxed">{note.text}</p>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => togglePin(note.id)}
                className={cn(
                  "transition-all",
                  note.pinned ? "text-primary" : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                )}
              >
                <Pin className="w-3 h-3" />
              </button>
              <button
                onClick={() => setNotes((n) => n.filter((x) => x.id !== note.id))}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <input
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addNote()}
        placeholder="Adicionar nota..."
        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );
};
