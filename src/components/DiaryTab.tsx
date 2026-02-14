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

// Pixel art tree - same style as the pixel cat
const TRUNK = "#6b4c2a";
const TRUNK_DARK = "#5a3d1e";
const TRUNK_LIGHT = "#7d5c38";
const BRANCH = "#6b4c2a";
const BRANCH_DARK = "#5a3d1e";

const LEAF_SHADES = ["#2d8a4e", "#34a853", "#3cc25f", "#4ade80", "#22c55e", "#16a34a", "#28a745", "#45c76b"];
const LEAF_HIGHLIGHT = "#6ee7b7";
const LEAF_DARK_COLOR = "#1a7a3a";

// Each leaf cluster is a small 3x3 pixel group placed at branch ends
const leafCluster = (x: number, y: number, shade: number) => {
  const c1 = LEAF_SHADES[shade % LEAF_SHADES.length];
  const c2 = LEAF_SHADES[(shade + 1) % LEAF_SHADES.length];
  const c3 = LEAF_SHADES[(shade + 2) % LEAF_SHADES.length];
  return [
    { x: x, y: y, c: LEAF_DARK_COLOR },
    { x: x + 1, y: y, c: c1 },
    { x: x + 2, y: y, c: c2 },
    { x: x, y: y + 1, c: c2 },
    { x: x + 1, y: y + 1, c: LEAF_HIGHLIGHT },
    { x: x + 2, y: y + 1, c: c1 },
    { x: x, y: y + 2, c: c3 },
    { x: x + 1, y: y + 2, c: c1 },
    { x: x + 2, y: y + 2, c: LEAF_DARK_COLOR },
  ];
};

// Pre-defined positions for leaf clusters at branch tips
const CLUSTER_POSITIONS = [
  // Top crown
  { x: 14, y: 3 },
  // Upper branches (near x=8..9 left, x=22..23 right at y=8..9)
  { x: 7, y: 7 }, { x: 10, y: 5 },
  { x: 21, y: 7 }, { x: 18, y: 5 },
  // Fill canopy center
  { x: 13, y: 6 }, { x: 16, y: 6 },
  { x: 11, y: 9 }, { x: 17, y: 9 },
  // Middle branches (near x=8..9 left, x=22..23 right at y=14..15)
  { x: 7, y: 13 }, { x: 10, y: 11 },
  { x: 21, y: 13 }, { x: 18, y: 11 },
  // Lower branches (near x=10..11 left, x=20..21 right at y=21..22)
  { x: 9, y: 19 }, { x: 11, y: 17 },
  { x: 19, y: 19 }, { x: 17, y: 17 },
  // Extra canopy fill
  { x: 14, y: 10 }, { x: 13, y: 14 },
];

const TreeSVG = ({ leafCount }: { leafCount: number }) => {
  const count = Math.min(leafCount, CLUSTER_POSITIONS.length);
  const leafPixels = CLUSTER_POSITIONS.slice(0, count).flatMap((pos, i) =>
    leafCluster(pos.x, pos.y, i)
  );

  return (
    <div className="w-full h-full flex items-end justify-center pb-2">
      <svg viewBox="0 0 32 44" className="w-full h-full max-h-[220px]" preserveAspectRatio="xMidYMax meet" style={{ imageRendering: "pixelated" }}>
        {/* Trunk */}
        <rect x="15" y="14" width="1" height="26" fill={TRUNK} />
        <rect x="16" y="14" width="1" height="26" fill={TRUNK_DARK} />
        <rect x="15" y="16" width="1" height="1" fill={TRUNK_LIGHT} />
        <rect x="15" y="22" width="1" height="1" fill={TRUNK_LIGHT} />
        <rect x="15" y="28" width="1" height="1" fill={TRUNK_LIGHT} />

        {/* Upper left branch */}
        {[[14,14],[13,13],[12,12],[11,11],[10,10],[9,9],[8,8]].map(([bx,by],i) => (
          <rect key={`ul${i}`} x={bx} y={by} width="1" height="1" fill={i%2===0 ? BRANCH : BRANCH_DARK} />
        ))}
        {/* Upper right branch */}
        {[[17,14],[18,13],[19,12],[20,11],[21,10],[22,9],[23,8]].map(([bx,by],i) => (
          <rect key={`ur${i}`} x={bx} y={by} width="1" height="1" fill={i%2===0 ? BRANCH : BRANCH_DARK} />
        ))}
        {/* Middle left branch */}
        {[[14,20],[13,19],[12,18],[11,17],[10,16],[9,15],[8,14]].map(([bx,by],i) => (
          <rect key={`ml${i}`} x={bx} y={by} width="1" height="1" fill={i%2===0 ? BRANCH : BRANCH_DARK} />
        ))}
        {/* Middle right branch */}
        {[[17,20],[18,19],[19,18],[20,17],[21,16],[22,15],[23,14]].map(([bx,by],i) => (
          <rect key={`mr${i}`} x={bx} y={by} width="1" height="1" fill={i%2===0 ? BRANCH : BRANCH_DARK} />
        ))}
        {/* Lower left branch */}
        {[[14,25],[13,24],[12,23],[11,22],[10,21]].map(([bx,by],i) => (
          <rect key={`ll${i}`} x={bx} y={by} width="1" height="1" fill={i%2===0 ? BRANCH : BRANCH_DARK} />
        ))}
        {/* Lower right branch */}
        {[[17,25],[18,24],[19,23],[20,22],[21,21]].map(([bx,by],i) => (
          <rect key={`lr${i}`} x={bx} y={by} width="1" height="1" fill={i%2===0 ? BRANCH : BRANCH_DARK} />
        ))}

        {/* Roots */}
        <rect x="13" y="40" width="1" height="1" fill={TRUNK_DARK} />
        <rect x="14" y="40" width="1" height="1" fill={TRUNK} />
        <rect x="17" y="40" width="1" height="1" fill={TRUNK} />
        <rect x="18" y="40" width="1" height="1" fill={TRUNK_DARK} />
        <rect x="12" y="41" width="1" height="1" fill={TRUNK_DARK} />
        <rect x="19" y="41" width="1" height="1" fill={TRUNK_DARK} />

        {/* Ground shadow */}
        <rect x="10" y="42" width="12" height="1" fill="hsl(30, 20%, 20%)" opacity="0.2" />

        {/* Leaves (pixel clusters) */}
        {leafPixels.map((px, i) => (
          <rect key={i} x={px.x} y={px.y} width="1" height="1" fill={px.c} />
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
