import { useState } from "react";
import { Trash2 } from "lucide-react";

export const QuickNotes = () => {
  const [notes, setNotes] = useState([
    { id: "1", text: "Lembrar de fazer deploy sexta", color: "bg-primary/10" },
    { id: "2", text: "Ideia: micro-interações no onboarding", color: "bg-warning/10" },
  ]);
  const [newNote, setNewNote] = useState("");

  const colors = ["bg-primary/10", "bg-warning/10", "bg-success/10", "bg-destructive/10"];

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes((n) => [
      ...n,
      { id: Date.now().toString(), text: newNote.trim(), color: colors[n.length % colors.length] },
    ]);
    setNewNote("");
  };

  return (
    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        📝 Notas rápidas
      </h3>
      <div className="space-y-2 mb-3">
        {notes.map((note) => (
          <div key={note.id} className={`${note.color} rounded-xl px-3 py-2 flex items-start gap-2 group`}>
            <p className="text-xs text-foreground flex-1">{note.text}</p>
            <button
              onClick={() => setNotes((n) => n.filter((x) => x.id !== note.id))}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all mt-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <input
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addNote()}
        placeholder="Adicionar nota..."
        className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );
};
