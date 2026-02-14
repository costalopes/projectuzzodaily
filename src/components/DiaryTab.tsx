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

// Leaf positions as percentages relative to tree SVG viewBox (200x300)
const LEAF_POSITIONS = [
  { cx: 95, cy: 100, rotate: -20 },
  { cx: 130, cy: 90, rotate: 15 },
  { cx: 85, cy: 75, rotate: -5 },
  { cx: 55, cy: 130, rotate: -30 },
  { cx: 150, cy: 120, rotate: 25 },
  { cx: 105, cy: 60, rotate: 10 },
  { cx: 65, cy: 160, rotate: -15 },
  { cx: 145, cy: 155, rotate: 20 },
  { cx: 40, cy: 185, rotate: -25 },
  { cx: 160, cy: 180, rotate: 30 },
  { cx: 80, cy: 110, rotate: 5 },
  { cx: 120, cy: 80, rotate: -10 },
  { cx: 48, cy: 140, rotate: -35 },
  { cx: 155, cy: 145, rotate: 28 },
  { cx: 100, cy: 50, rotate: 0 },
];

const LEAF_COLORS = [
  "hsl(140, 50%, 45%)",
  "hsl(120, 40%, 50%)",
  "hsl(155, 45%, 40%)",
  "hsl(100, 35%, 55%)",
  "hsl(130, 55%, 35%)",
  "hsl(145, 40%, 48%)",
];

const TreeSVG = ({ leafCount }: { leafCount: number }) => {
  const visibleLeaves = LEAF_POSITIONS.slice(0, Math.min(leafCount, LEAF_POSITIONS.length));

  return (
    <div className="w-full h-full flex items-end justify-center">
      <svg viewBox="0 0 200 310" className="w-full h-full" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))" }}>
        {/* Main trunk */}
        <path d="M95 300 Q93 250 90 220 Q88 200 92 180 Q95 165 98 150 Q100 140 100 130" 
          stroke="hsl(30, 25%, 30%)" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M105 300 Q107 250 110 220 Q112 200 108 180 Q105 165 102 150 Q100 140 100 130" 
          stroke="hsl(30, 25%, 28%)" strokeWidth="7" fill="none" strokeLinecap="round" />
        
        {/* Branches */}
        <path d="M92 180 Q75 165 55 145 Q45 135 40 125" stroke="hsl(30, 25%, 32%)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M108 175 Q125 160 145 140 Q155 130 160 120" stroke="hsl(30, 25%, 30%)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M90 210 Q70 200 55 195 Q45 192 35 188" stroke="hsl(30, 25%, 33%)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M110 205 Q130 195 150 188 Q158 185 165 183" stroke="hsl(30, 25%, 31%)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M98 145 Q85 125 70 110" stroke="hsl(30, 25%, 34%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M102 140 Q115 118 130 105" stroke="hsl(30, 25%, 32%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M100 130 Q98 115 95 100" stroke="hsl(30, 25%, 35%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M55 145 Q48 138 42 132" stroke="hsl(30, 25%, 36%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M145 140 Q152 133 158 127" stroke="hsl(30, 25%, 36%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M70 110 Q62 104 58 98" stroke="hsl(30, 25%, 37%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M130 105 Q138 99 142 93" stroke="hsl(30, 25%, 37%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Ground */}
        <ellipse cx="100" cy="305" rx="80" ry="5" fill="hsl(30, 20%, 22%)" opacity="0.3" />

        {/* Leaves rendered inside SVG */}
        {visibleLeaves.map((pos, i) => (
          <g key={`leaf-${i}`} transform={`translate(${pos.cx}, ${pos.cy}) rotate(${pos.rotate})`}>
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${pos.cx} ${pos.cy}; ${pos.cx} ${pos.cy - 2}; ${pos.cx} ${pos.cy}`}
              dur={`${3 + (i % 3)}s`}
              repeatCount="indefinite"
              additive="sum"
            />
            <ellipse cx="0" cy="0" rx="7" ry="4.5"
              fill={LEAF_COLORS[i % LEAF_COLORS.length]}
              opacity="0.9"
            >
              <animate attributeName="opacity" values="0;0.9" dur="0.5s" begin={`${i * 0.1}s`} fill="freeze" />
            </ellipse>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="hsl(120, 30%, 30%)" strokeWidth="0.5" opacity="0.5" />
          </g>
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
