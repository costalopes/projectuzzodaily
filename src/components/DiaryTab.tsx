import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, subDays, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DiaryEntry {
  id: string;
  content: string;
  mood: string;
  created_at: string;
  entry_date: string;
}

const MOODS = [
  { id: "happy", emoji: "😊", label: "Feliz" },
  { id: "neutral", emoji: "😐", label: "Neutro" },
  { id: "tired", emoji: "😴", label: "Cansado" },
  { id: "focused", emoji: "🎯", label: "Focado" },
  { id: "sad", emoji: "😔", label: "Triste" },
  { id: "excited", emoji: "🔥", label: "Animado" },
];

const TreeSVG = ({ leafCount }: { leafCount: number }) => {
  // Max 20 leaves displayed
  const count = Math.min(leafCount, 20);
  
  // Pre-defined leaf spots on/near branches (x, y relative to viewBox 0 0 120 180)
  const spots = [
    // Top of trunk
    { x: 60, y: 42 },
    { x: 55, y: 48 },
    { x: 65, y: 48 },
    // Upper left branch
    { x: 38, y: 52 },
    { x: 32, y: 48 },
    { x: 28, y: 55 },
    // Upper right branch  
    { x: 82, y: 52 },
    { x: 88, y: 48 },
    { x: 92, y: 55 },
    // Middle left branch
    { x: 25, y: 72 },
    { x: 20, y: 68 },
    { x: 18, y: 76 },
    // Middle right branch
    { x: 95, y: 72 },
    { x: 100, y: 68 },
    { x: 102, y: 76 },
    // Lower left branch
    { x: 35, y: 88 },
    { x: 30, y: 92 },
    // Lower right branch
    { x: 85, y: 88 },
    { x: 90, y: 92 },
    // Extra center
    { x: 60, y: 55 },
  ];

  const colors = [
    "#4ade80", "#22c55e", "#16a34a", "#86efac", 
    "#34d399", "#10b981", "#a7f3d0", "#6ee7b7",
  ];

  return (
    <div className="w-full h-full flex items-end justify-center pb-2">
      <svg viewBox="0 0 120 180" className="w-full h-full max-h-[220px]" preserveAspectRatio="xMidYMax meet">
        {/* Trunk */}
        <line x1="60" y1="165" x2="60" y2="60" stroke="hsl(30, 30%, 35%)" strokeWidth="5" strokeLinecap="round" />
        
        {/* Main branches */}
        {/* Upper V */}
        <line x1="60" y1="60" x2="35" y2="45" stroke="hsl(30, 30%, 38%)" strokeWidth="3" strokeLinecap="round" />
        <line x1="60" y1="60" x2="85" y2="45" stroke="hsl(30, 30%, 38%)" strokeWidth="3" strokeLinecap="round" />
        
        {/* Middle branches */}
        <line x1="60" y1="80" x2="25" y2="65" stroke="hsl(30, 30%, 36%)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="60" y1="80" x2="95" y2="65" stroke="hsl(30, 30%, 36%)" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Lower branches */}
        <line x1="60" y1="100" x2="35" y2="85" stroke="hsl(30, 30%, 34%)" strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="100" x2="85" y2="85" stroke="hsl(30, 30%, 34%)" strokeWidth="2" strokeLinecap="round" />

        {/* Small sub-branches */}
        <line x1="35" y1="45" x2="28" y2="50" stroke="hsl(30, 30%, 40%)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="85" y1="45" x2="92" y2="50" stroke="hsl(30, 30%, 40%)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="25" y1="65" x2="18" y2="70" stroke="hsl(30, 30%, 40%)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="95" y1="65" x2="102" y2="70" stroke="hsl(30, 30%, 40%)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Ground line */}
        <ellipse cx="60" cy="168" rx="30" ry="3" fill="hsl(30, 20%, 25%)" opacity="0.3" />

        {/* Leaves - simple circles at branch tips */}
        {spots.slice(0, count).map((spot, i) => (
          <circle
            key={i}
            cx={spot.x}
            cy={spot.y}
            r="5"
            fill={colors[i % colors.length]}
            opacity="0.85"
          >
            <animate attributeName="opacity" from="0" to="0.85" dur="0.4s" begin={`${i * 0.08}s`} fill="freeze" />
          </circle>
        ))}
      </svg>
    </div>
  );
};

export const DiaryTab = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [newContent, setNewContent] = useState("");
  const [newMood, setNewMood] = useState("neutral");
  const [showTimeline, setShowTimeline] = useState(false);
  const [loading, setLoading] = useState(true);

  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const isSelectedToday = isToday(selectedDate);

  // Load all distinct dates for timeline
  useEffect(() => {
    const loadDates = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("diary_entries")
        .select("entry_date")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });
      if (data) {
        const unique = [...new Set(data.map((d: any) => d.entry_date))];
        setAllDates(unique);
      }
    };
    loadDates();
  }, [entries.length]);

  // Load entries for selected date
  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", dateKey)
        .order("created_at", { ascending: true });
      if (data) setEntries(data);
      setLoading(false);
    };
    loadEntries();
  }, [dateKey]);

  const addEntry = async () => {
    if (!newContent.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("diary_entries").insert({
      user_id: user.id,
      content: newContent.trim(),
      mood: newMood,
      entry_date: dateKey,
    }).select().single();
    if (data && !error) {
      setEntries(prev => [...prev, data]);
      setNewContent("");
      setNewMood("neutral");
    }
  };

  const deleteEntry = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    await supabase.from("diary_entries").delete().eq("id", id);
  };

  const currentMoodEmoji = MOODS.find(m => m.id === newMood)?.emoji || "😐";

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
            🌳 Diário {isSelectedToday ? "Hoje" : format(selectedDate, "dd/MM", { locale: ptBR })}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDate(d => subDays(d, 1))}
              className="p-1 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {!isSelectedToday && (
              <button
                onClick={() => setSelectedDate(startOfDay(new Date()))}
                className="text-[9px] font-mono text-primary hover:underline px-1"
              >
                hoje
              </button>
            )}
            <button
              onClick={() => setSelectedDate(d => addDays(d, 1))}
              className="p-1 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className={cn(
            "text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all",
            showTimeline
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border/30 text-muted-foreground/60 hover:text-muted-foreground hover:border-border/50"
          )}
        >
          {showTimeline ? "✕ fechar" : "📅 ver datas"}
        </button>
      </div>

      {/* Timeline */}
      <AnimatePresence>
        {showTimeline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden pb-2 pt-1">
              {allDates.length === 0 && (
                <p className="text-[10px] text-muted-foreground/40 font-mono">nenhuma entrada ainda</p>
              )}
              {allDates.map((d) => {
                const dt = parseISO(d);
                const active = d === dateKey;
                return (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(startOfDay(dt)); setShowTimeline(false); }}
                    className={cn(
                      "shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-mono border transition-all",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/30 text-muted-foreground/60 hover:border-border/50 hover:text-muted-foreground"
                    )}
                  >
                    {isToday(dt) ? "Hoje" : format(dt, "dd/MM")}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content: notes left, tree right */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Notes column */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* New entry input */}
          <div className="bg-muted/20 border border-border/20 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">nova nota</span>
              <div className="flex gap-1 ml-auto">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setNewMood(m.id)}
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all",
                      newMood === m.id ? "bg-primary/20 ring-1 ring-primary/40 scale-110" : "hover:bg-muted/40"
                    )}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) addEntry(); }}
              placeholder="Como foi seu dia? O que aprendeu? O que sentiu?"
              className="w-full bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none min-h-[60px]"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground/30 font-mono">ctrl+enter para salvar</span>
              <button
                onClick={addEntry}
                disabled={!newContent.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-mono hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" /> plantar nota 🌱
              </button>
            </div>
          </div>

          {/* Entries list */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <span className="text-3xl">🍂</span>
                <p className="text-[11px] font-mono text-muted-foreground/40 text-center">
                  Nenhuma nota neste dia.<br/>Plante uma e veja a árvore florescer!
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {entries.map((entry, i) => {
                  const mood = MOODS.find(m => m.id === entry.mood);
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="group bg-muted/10 border border-border/15 rounded-xl px-3 py-2.5 hover:border-border/30 transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm mt-0.5 shrink-0">{mood?.emoji || "😐"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {entry.content}
                          </p>
                          <span className="text-[9px] font-mono text-muted-foreground/30 mt-1 block">
                            {format(new Date(entry.created_at), "HH:mm")}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Tree column - fixed height, doesn't grow */}
        <div className="hidden md:flex w-[180px] shrink-0 flex-col items-center self-start sticky top-0">
          <div className="w-full h-[250px]">
            <TreeSVG leafCount={entries.length} />
          </div>
          <p className="text-[9px] font-mono text-muted-foreground/30 text-center mt-1">
            {entries.length === 0 ? "árvore seca... plante notas!" : `${entries.length} folha${entries.length > 1 ? "s" : ""} 🌿`}
          </p>
        </div>
      </div>
    </div>
  );
};
