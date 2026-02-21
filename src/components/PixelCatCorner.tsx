import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Settings2, Heart, Zap, X, Utensils, Hand, Moon, Gamepad2, Sparkles, Star, Cookie, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useCloudSetting } from "@/hooks/useCloudSetting";

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

type CatMood = "idle" | "happy" | "purring" | "sleeping" | "coding" | "excited" | "belly" | "scratching" | "stretching"
  | "listening" | "thirsty" | "hydrated" | "caffeinated" | "focused" | "alert"
  | "eating" | "playing" | "lonely" | "tired"
  | "grooming" | "curious" | "zoomies" | "dreaming" | "scared" | "love" | "begging" | "hunting";

export interface CatEvent {
  type: "task_complete" | "music_play" | "music_stop" | "water_low" | "water_full" | "water_add" | "coffee_add" | "coffee_excess"
    | "pomodoro_end" | "pomodoro_start" | "urgent_overdue";
  timestamp: number;
}

interface CatProps {
  onTaskComplete?: boolean;
  lastEvent?: CatEvent | null;
}

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════

const CAT_COLORS = [
  { name: "Laranja", fur1: "#e8a050", fur2: "#d08838", fur3: "#f0c080", stripe: "#c07028", belly: "#f8e0c0", eye: "#2a6040" },
  { name: "Cinza", fur1: "#8a8a9a", fur2: "#6a6a7a", fur3: "#a8a8b8", stripe: "#5a5a6a", belly: "#c8c8d8", eye: "#c89020" },
  { name: "Preto", fur1: "#3a3a4a", fur2: "#2a2a3a", fur3: "#5a5a6a", stripe: "#1a1a2a", belly: "#6a6a7a", eye: "#e0c040" },
  { name: "Branco", fur1: "#e8e8f0", fur2: "#d0d0d8", fur3: "#f5f5ff", stripe: "#c0c0c8", belly: "#ffffff", eye: "#4080c0" },
  { name: "Malhado", fur1: "#c88040", fur2: "#a06828", fur3: "#e8b880", stripe: "#303030", belly: "#f0d8b8", eye: "#308050" },
  { name: "Siamês", fur1: "#f0e0d0", fur2: "#d8c8b8", fur3: "#f8f0e8", stripe: "#8a6a50", belly: "#faf0e8", eye: "#4070b0" },
];

const DREAM_ITEMS = ["🐟", "🧶", "🦋", "🐁", "☀️", "🍣", "🥛", "💤", "🌙", "✨"];

// Cooldown durations in ms
const COOLDOWNS = {
  pet: 2000,      // 2s between pets
  feed: 30000,    // 30s between feeds
  play: 20000,    // 20s between plays  
  treat: 45000,   // 45s between treats
  nap: 60000,     // 60s between forced naps
};

// Overfeeding/overpetting thresholds
const OVERFEED_THRESHOLD = 95;
const OVERPET_THRESHOLD = 90; // affection cap before cat gets annoyed

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

// Legacy localStorage helpers (kept for migration reference)
const loadStat = (key: string, def: number) => {
  const saved = localStorage.getItem(`cat-${key}`);
  return saved ? parseFloat(saved) : def;
};

interface CatPersistentData {
  name: string;
  color: number;
  happiness: number;
  energy: number;
  hunger: number;
  affection: number;
  xp: number;
  level: number;
  lastInteraction: number;
}

const CAT_DEFAULTS: CatPersistentData = {
  name: "Miau",
  color: 0,
  happiness: 70,
  energy: 80,
  hunger: 60,
  affection: 50,
  xp: 0,
  level: 1,
  lastInteraction: Date.now(),
};

// Build initial from localStorage for migration
const buildCatFromLocalStorage = (): CatPersistentData => ({
  name: localStorage.getItem("cat-name") || CAT_DEFAULTS.name,
  color: loadStat("color", CAT_DEFAULTS.color),
  happiness: loadStat("happiness", CAT_DEFAULTS.happiness),
  energy: loadStat("energy", CAT_DEFAULTS.energy),
  hunger: loadStat("hunger", CAT_DEFAULTS.hunger),
  affection: loadStat("affection", CAT_DEFAULTS.affection),
  xp: loadStat("xp", CAT_DEFAULTS.xp),
  level: loadStat("level", CAT_DEFAULTS.level),
  lastInteraction: (() => { const s = localStorage.getItem("cat-last-interaction"); return s ? parseInt(s) : Date.now(); })(),
});

const CAT_LS_KEYS = ["cat-name", "cat-color", "cat-happiness", "cat-energy", "cat-hunger", "cat-affection", "cat-xp", "cat-level", "cat-last-interaction"];

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 22) return "evening";
  return "night";
};

// XP required per level
const xpForLevel = (lvl: number) => Math.floor(50 * Math.pow(1.4, lvl - 1));

// ═══════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════

const buildMessages = (catName: string): Record<string, string[]> => ({
  idle: ["miau~", "...", "*estica*", "*boceja*", "meow?", "*olha pela janela*", "hmm...", "*rola no chão*", "*limpa a patinha*", "preguiça...", "tô de boa", "*derruba o copo*", "cadê o laser?"],
  happy: ["nyaa~", "purrrr!", "*ronrona*", "mrrp!", "mais carinho!", "isso mesmo!", "*fecha os olhos*", "tão bom...", "*esfrega no braço*", "continua!", "adoro!", "*faz biscuit*"],
  purring: ["purrrrrr...", "*amassa pãozinho*", "tão quentinho...", "*ronrona alto*", "não para...", "vida boa...", "*derrete*"],
  sleeping: ["zzz...", "*sonha com peixe*", "mrrrm...", "*mexe a patinha*", "...atum...", "zzZzz...", "*ronca*"],
  dreaming: ["*sonha com peixe*", "...atumm...", "*cauda treme*", "mrrrm... yarn...", "*patinha treme*"],
  coding: [
    "git push", "npm run dev", "// TODO: dormir", "console.log('miau')", "bug?", "LGTM!", "refactor time",
    "café + código", "deploy friday?", "tá compilando...", "testes passando!", "clean code", "feature pronta!",
    "funciona na minha máquina", "TypeScript!", "ship it! 🚀", "200 OK ✓", "dark mode > light mode",
    `${catName} approved ✓`, `sudo ${catName}`, "zero warnings!", "bora pra produção?",
  ],
  excited: ["MIAU!!", "WOOO!", "*pula*", "incrível!!", "mandou bem!", "boa!!", "*faz dancinha*", "isso aí!!", "perfeito!", "que orgulho!!", "SHIP IT!! 🚀"],
  belly: ["*mostra a barriga*", "coça aqui!", "confia...", "*rola pro lado*", "barriguinha!", "*ronrona de barriga*"],
  scratching: ["*coça o nariz*", "*coça atrás da orelha*", "*esfrega o focinho*", "tava coçando!"],
  stretching: ["*esticaaaa*", "*alongamento máximo*", "*estica as patinhas*", "ahhhh que bom"],
  listening: ["♪ boa música!", "♫ *balança a cabeça*", "♪ gosto disso!", "~vibing~", "♫ nice beat", "*mexe a orelha*", "lofi mood ♪"],
  thirsty: ["tô com sede!", "beba água, humano!", "💧 cadê a água?", "*olha pro copo vazio*", "hidratação é vida!", "miau... sede..."],
  hydrated: ["boa! hidratado! 💧", "meta da água! 🎉", "*aprovação*", "isso aí! água é vida!"],
  caffeinated: ["café! ☕", "*cheira o café*", "hmm café...", "mais café!", "☕ bom demais"],
  focused: ["foco total! 🍅", "*concentrado*", "bora produzir!", "modo foco ON", "shh... focando"],
  alert: ["⚠️ tarefa urgente!", "ei! tarefa atrasada!", "não esquece!", "humano, olha isso!", "URGENTE!! 🚨", "*pula preocupado*"],
  eating: ["nom nom nom!", "*mastiga*", "delícia!", "atum!! 🐟", "*lambe os bigodes*", "que saboroso!", "mais!"],
  playing: ["*persegue o laser*", "peguei!! ...não 😿", "*salta*", "mais rápido!", "*ataca o brinquedo*", "wheee!", "*rola com a bolinha*"],
  lonely: ["cadê você?", "tô sozinho...", "*olha triste*", "volta logo...", "saudades...", "*deita no teclado*"],
  tired: ["*boceja grande*", "tô cansado...", "soneca?", "*fecha os olhos devagar*", "5 min...", "*quase dormindo*"],
  grooming: ["*lambe a patinha*", "*limpa o pelo*", "*faz a higiene*", "*limpa atrás da orelha*", "preciso ficar bonito", "*banho de gato*", "pronto, limpinho!"],
  curious: ["o que é isso?? 👀", "*orelhas em pé*", "hmm interessante...", "*cheira tudo*", "o que tá acontecendo?", "*olha fixamente*", "hmmm... 🤔", "*investiga*"],
  zoomies: ["MIAU MIAU MIAU!!", "*corre loucamente*", "ZUUUUUM!!", "NÃO ME PEGA!", "*salta no teto*", "ENERGIA!!!", "*derruba tudo*", "WHEEEEE!!"],
  scared: ["!! 😱", "*pula assustado*", "o que foi isso?!", "*pelo arrepiado*", "*esconde debaixo*", "glp!"],
  love: ["te amo, humano 💕", "*ronrona intenso*", "você é o melhor!", "nunca me abandona", "*esfrega a cabeça*", "meu humano favorito!", "❤️ mrrrrp"],
  begging: ["fomeeee! 🥺", "*olha pro pote vazio*", "cadê a comida?", "*mia alto*", "por favor...", "*esfrega na perna*", "alimenta eu!!", "miau miau miau!"],
  hunting: ["*agacha devagar*", "*olhar de predador*", "*cauda balança*", "*patinha pronta*", "...", "*ATAQUE!*", "*modo caça ativado*"],
});

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════

export const PixelCatCorner = ({ onTaskComplete, lastEvent }: CatProps) => {
  // Cloud-persisted cat data (migrates from localStorage on first load)
  const [catData, setCatData] = useCloudSetting<CatPersistentData>("cat_data", CAT_DEFAULTS, "cat-data-migration");

  // On first mount, migrate individual localStorage keys if cloud has defaults
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    const hasLocalData = localStorage.getItem("cat-name") !== null || localStorage.getItem("cat-happiness") !== null;
    if (hasLocalData) {
      const migrated = buildCatFromLocalStorage();
      setCatData(migrated);
      CAT_LS_KEYS.forEach(k => localStorage.removeItem(k));
    }
    migratedRef.current = true;
  }, []);

  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState<CatMood>("coding");
  const [pets, setPets] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const catRef = useRef<HTMLDivElement>(null);
  const [isKneading, setIsKneading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Derived state from cloud data
  const catName = catData.name;
  const colorIdx = catData.color;
  const happiness = catData.happiness;
  const energy = catData.energy;
  const hunger = catData.hunger;
  const affection = catData.affection;
  const xp = catData.xp;
  const level = catData.level;
  const lastInteraction = catData.lastInteraction;

  // Setters that update cloud data
  const setCatName = (n: string) => setCatData(prev => ({ ...prev, name: n }));
  const setColorIdx = (i: number) => setCatData(prev => ({ ...prev, color: i }));
  const setHappiness = (v: number | ((p: number) => number)) => setCatData(prev => ({ ...prev, happiness: typeof v === "function" ? v(prev.happiness) : v }));
  const setEnergy = (v: number | ((p: number) => number)) => setCatData(prev => ({ ...prev, energy: typeof v === "function" ? v(prev.energy) : v }));
  const setHunger = (v: number | ((p: number) => number)) => setCatData(prev => ({ ...prev, hunger: typeof v === "function" ? v(prev.hunger) : v }));
  const setAffection = (v: number | ((p: number) => number)) => setCatData(prev => ({ ...prev, affection: typeof v === "function" ? v(prev.affection) : v }));
  const setXp = (v: number | ((p: number) => number)) => setCatData(prev => ({ ...prev, xp: typeof v === "function" ? v(prev.xp) : v }));
  const setLevel = (v: number | ((p: number) => number)) => setCatData(prev => ({ ...prev, level: typeof v === "function" ? v(prev.level) : v }));
  const setLastInteraction = (v: number) => setCatData(prev => ({ ...prev, lastInteraction: v }));

  const lastEventRef = useRef<number>(0);
  const lastClickTime = useRef<number>(0);
  const [sparkles, setSparkles] = useState<number[]>([]);

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [dreamItem, setDreamItem] = useState("🐟");
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay);
  const [showActionsPanel, setShowActionsPanel] = useState(false);

  // === ADVANCED SYSTEMS ===
  const [petCombo, setPetCombo] = useState(0);
  const petComboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // === COOLDOWN SYSTEM ===
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [typedMessage, setTypedMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feedCount, setFeedCount] = useState(0); // tracks consecutive feeds
  const [petCount, setPetCount] = useState(0); // tracks rapid pets
  const petCountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnCooldown = useCallback((action: string) => {
    const cd = cooldowns[action];
    if (!cd) return false;
    return Date.now() < cd;
  }, [cooldowns]);

  const setCooldown = useCallback((action: string) => {
    const duration = COOLDOWNS[action as keyof typeof COOLDOWNS] || 5000;
    setCooldowns(prev => ({ ...prev, [action]: Date.now() + duration }));
  }, []);

  const getCooldownRemaining = useCallback((action: string) => {
    const cd = cooldowns[action];
    if (!cd) return 0;
    return Math.max(0, Math.ceil((cd - Date.now()) / 1000));
  }, [cooldowns]);

  // Update cooldown display
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const hasActive = Object.values(cooldowns).some(cd => Date.now() < cd);
    if (!hasActive) return;
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, [cooldowns]);

  // Feed count decay (resets after 60s of no feeding)
  useEffect(() => {
    if (feedCount === 0) return;
    const t = setTimeout(() => setFeedCount(0), 60000);
    return () => clearTimeout(t);
  }, [feedCount]);

  // Persistence is handled by useCloudSetting via setCatData
  const saveName = (n: string) => setCatName(n);
  const saveColor = (i: number) => setColorIdx(i);

  const showMsg = useCallback((msg: string, duration = 3500) => {
    // Typing effect for speech bubble
    if (typingRef.current) clearTimeout(typingRef.current);
    setMessage(msg);
    setIsTyping(true);
    setTypedMessage("");
    
    let i = 0;
    const typeChar = () => {
      if (i < msg.length) {
        setTypedMessage(msg.slice(0, i + 1));
        i++;
        typingRef.current = setTimeout(typeChar, 65 + Math.random() * 75);
      } else {
        setIsTyping(false);
        typingRef.current = setTimeout(() => {
          setMessage("");
          setTypedMessage("");
        }, duration);
      }
    };
    typeChar();
  }, []);

  const addSparkle = useCallback(() => {
    const id = Date.now() + Math.random();
    setSparkles(s => [...s, id]);
    setTimeout(() => setSparkles(s => s.filter(x => x !== id)), 1500);
  }, []);

  const gainXp = useCallback((amount: number) => {
    setXp(prev => {
      const next = prev + amount;
      const needed = xpForLevel(level);
      if (next >= needed) {
        setLevel(l => l + 1);
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
        return next - needed;
      }
      return next;
    });
  }, [level]);

  const recordInteraction = useCallback(() => {
    const now = Date.now();
    setLastInteraction(now);
  }, []);

  const allMessages = buildMessages(catName);
  const pickMsg = useCallback((category: string) => {
    const msgs = allMessages[category] || allMessages.coding;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, [catName]);

  // === TIME OF DAY ===
  useEffect(() => {
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60000);
    return () => clearInterval(interval);
  }, []);

  // === STAT DECAY ===
  useEffect(() => {
    const interval = setInterval(() => {
      setHappiness(h => clamp(h - 0.25));
      setEnergy(e => clamp(e - 0.15));
      setHunger(h => clamp(h - 0.4));
      setAffection(a => clamp(a - 0.2));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // === INACTIVITY DETECTION ===
  useEffect(() => {
    const interval = setInterval(() => {
      const minutesInactive = (Date.now() - lastInteraction) / 60000;
      if (minutesInactive > 10 && mood === "coding") {
        if (Math.random() < 0.3) {
          setMood("lonely");
          showMsg(pickMsg("lonely"));
          setHappiness(h => clamp(h - 3));
        }
      }
      if (minutesInactive > 20 && mood !== "sleeping") {
        if (Math.random() < 0.2) {
          setMood("idle");
          showMsg("*olha entediado*");
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [lastInteraction, mood, showMsg, pickMsg]);

  // === HUNGER-BASED BEHAVIOR ===
  useEffect(() => {
    if (hunger < 15 && mood === "coding" && Math.random() < 0.5) {
      setMood("begging");
      showMsg(pickMsg("begging"), 4000);
    }
  }, [hunger]);

  // === MOOD FROM STATS ===
  useEffect(() => {
    const locked = ["sleeping", "focused", "alert", "excited", "eating", "playing", "listening",
      "grooming", "curious", "zoomies", "dreaming", "scared", "love", "begging", "hunting"];
    if (locked.includes(mood)) return;
    if (energy < 15) { setMood("tired"); showMsg(pickMsg("tired")); }
    else if (happiness < 20) { setMood("lonely"); showMsg(pickMsg("lonely")); }
  }, [happiness, energy]);

  // === EVENTS FROM OTHER COMPONENTS ===
  useEffect(() => {
    if (!lastEvent || lastEvent.timestamp === lastEventRef.current) return;
    lastEventRef.current = lastEvent.timestamp;
    switch (lastEvent.type) {
      case "music_play":
        setMood("listening"); setHappiness(h => clamp(h + 8)); showMsg(pickMsg("listening"));
        gainXp(3); setTimeout(() => setMood("coding"), 5000); break;
      case "music_stop":
        showMsg("♪ acabou a música..."); break;
      case "water_low":
        setMood("thirsty"); showMsg(pickMsg("thirsty"), 4000);
        setTimeout(() => setMood("coding"), 5000); break;
      case "water_full":
        setMood("excited"); setHappiness(h => clamp(h + 10)); showMsg(pickMsg("hydrated"));
        gainXp(5); setTimeout(() => setMood("coding"), 4000); break;
      case "water_add":
        showMsg("💧 +250ml!"); setHappiness(h => clamp(h + 3)); gainXp(2); break;
      case "coffee_add":
        setMood("happy"); setEnergy(e => clamp(e + 15)); setHappiness(h => clamp(h + 5));
        showMsg(pickMsg("caffeinated")); gainXp(3); setTimeout(() => setMood("coding"), 3000); break;
      case "coffee_excess":
        setEnergy(e => clamp(e + 5)); showMsg("calma no café! 😰"); break;
      case "pomodoro_start":
        setMood("focused"); setEnergy(e => clamp(e - 5)); showMsg(pickMsg("focused"));
        setTimeout(() => setMood("coding"), 4000); break;
      case "pomodoro_end":
        setMood("excited"); setHappiness(h => clamp(h + 12)); setEnergy(e => clamp(e + 10));
        showMsg("🍅 timer acabou!"); addSparkle(); gainXp(10);
        setTimeout(() => setMood("coding"), 4000); break;
      case "task_complete":
        setMood("excited"); setHappiness(h => clamp(h + 15)); setEnergy(e => clamp(e + 5));
        showMsg(pickMsg("excited")); addSparkle(); gainXp(8);
        setTimeout(() => setMood("coding"), 4000); break;
      case "urgent_overdue":
        setMood("alert"); setHappiness(h => clamp(h - 5)); showMsg(pickMsg("alert"), 5000);
        setTimeout(() => setMood("coding"), 6000); break;
    }
  }, [lastEvent, pickMsg, showMsg, addSparkle, gainXp]);

  // Legacy
  useEffect(() => {
    if (onTaskComplete) {
      setMood("excited"); setHappiness(h => clamp(h + 15)); showMsg(pickMsg("excited"));
      addSparkle(); gainXp(8); setTimeout(() => setMood("coding"), 4000);
    }
  }, [onTaskComplete, pickMsg, showMsg, addSparkle, gainXp]);

  // === EYE TRACKING ===
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!catRef.current) return;
      const rect = catRef.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 1.5;
      setEyeOffset({
        x: Math.round(Math.max(-maxOffset, Math.min(maxOffset, (dx / Math.max(dist, 1)) * maxOffset))),
        y: Math.round(Math.max(-1, Math.min(1, (dy / Math.max(dist, 1)) * maxOffset * 0.5))),
      });

      // Cursor proximity reaction — cat gets curious when cursor is near
      if (dist < 200 && dist > 80 && mood === "coding" && Math.random() < 0.002) {
        setMood("curious");
        showMsg(pickMsg("curious"));
        setTimeout(() => setMood("coding"), 3000);
      }
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mood, showMsg, pickMsg]);

  // === BLINK ===
  useEffect(() => {
    if (mood === "sleeping" || mood === "dreaming") return;
    const interval = setInterval(() => {
      setBlink(true); setTimeout(() => setBlink(false), 150);
    }, 2000 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, [mood]);

  // === IDLE → SLEEPING ===
  useEffect(() => {
    if (mood === "idle" || mood === "tired") {
      const timeout = setTimeout(() => {
        setMood("sleeping"); setEnergy(e => clamp(e + 20));
      }, mood === "tired" ? 10000 : 25000);
      return () => clearTimeout(timeout);
    }
  }, [mood]);

  // === SLEEPING → DREAMING ===
  useEffect(() => {
    if (mood !== "sleeping") return;
    const dreamInterval = setInterval(() => {
      if (Math.random() < 0.4) {
        setDreamItem(DREAM_ITEMS[Math.floor(Math.random() * DREAM_ITEMS.length)]);
        setMood("dreaming");
        showMsg(pickMsg("dreaming"));
        setTimeout(() => setMood("sleeping"), 4000);
      }
    }, 8000);
    const recoveryInterval = setInterval(() => {
      setEnergy(e => {
        const next = clamp(e + 2);
        if (next >= 90) { setMood("coding"); showMsg("*acorda descansado!* 😸"); }
        return next;
      });
    }, 3000);
    return () => { clearInterval(dreamInterval); clearInterval(recoveryInterval); };
  }, [mood, showMsg, pickMsg]);

  // === MOOD TIMEOUTS ===
  useEffect(() => {
    if (mood === "purring") {
      setIsKneading(true);
      const t = setTimeout(() => { setMood("coding"); setIsKneading(false); }, 6000);
      return () => { clearTimeout(t); setIsKneading(false); };
    }
    if (mood === "happy" || mood === "love") {
      const t = setTimeout(() => setMood("coding"), 4000);
      return () => clearTimeout(t);
    }
    if (mood === "eating" || mood === "playing" || mood === "hunting") {
      const t = setTimeout(() => setMood("coding"), 5000);
      return () => clearTimeout(t);
    }
    if (mood === "grooming") {
      const t = setTimeout(() => { setMood("coding"); showMsg("pronto, limpinho! ✨"); }, 6000);
      return () => clearTimeout(t);
    }
    if (mood === "curious") {
      const t = setTimeout(() => setMood("coding"), 4000);
      return () => clearTimeout(t);
    }
    if (mood === "zoomies") {
      const t = setTimeout(() => {
        setMood("tired"); setEnergy(e => clamp(e - 20));
        showMsg("*ofegante* ufa...");
      }, 4000);
      return () => clearTimeout(t);
    }
    if (mood === "scared") {
      const t = setTimeout(() => { setMood("coding"); showMsg("ah... era nada 😮‍💨"); }, 3000);
      return () => clearTimeout(t);
    }
    if (mood === "begging") {
      const t = setTimeout(() => setMood("coding"), 5000);
      return () => clearTimeout(t);
    }
  }, [mood, showMsg]);

  const handleAnimationEnd = useCallback(() => {
    if (mood === "belly" || mood === "scratching" || mood === "stretching") setMood("coding");
  }, [mood]);

  // === SPONTANEOUS ACTIONS (enriched) ===
  useEffect(() => {
    if (mood !== "coding") return;
    const doRandomAction = () => {
      const rand = Math.random();
      const isNight = timeOfDay === "night";
      const isMorning = timeOfDay === "morning";

      // Night = sleepier
      if (isNight && rand < 0.15 && energy < 60) {
        setMood("tired"); showMsg("*boceja*... tá tarde"); return;
      }
      // Morning = more energetic
      if (isMorning && rand < 0.08) {
        setMood("stretching"); showMsg("bom dia! *estica*"); return;
      }

      if (rand < 0.06) { setMood("belly"); showMsg(pickMsg("belly")); }
      else if (rand < 0.10) { setMood("scratching"); showMsg(pickMsg("scratching")); }
      else if (rand < 0.14) { setMood("stretching"); showMsg(pickMsg("stretching")); }
      else if (rand < 0.18) { setMood("grooming"); showMsg(pickMsg("grooming")); gainXp(1); }
      else if (rand < 0.22) { setMood("curious"); showMsg(pickMsg("curious")); }
      else if (rand < 0.24 && energy > 70) {
        setMood("zoomies"); showMsg(pickMsg("zoomies")); setHappiness(h => clamp(h + 8)); gainXp(2);
      }
      else if (rand < 0.26 && energy > 50) {
        setMood("hunting"); showMsg(pickMsg("hunting")); setHappiness(h => clamp(h + 3)); gainXp(2);
      }
      else if (rand < 0.28) {
        // Random scare
        setMood("scared"); showMsg(pickMsg("scared"));
      }
      else if (rand < 0.30 && affection > 70) {
        setMood("love"); showMsg(pickMsg("love")); gainXp(2);
      }
      else if (rand < 0.33) {
        setMood("playing"); setHappiness(h => clamp(h + 5)); setEnergy(e => clamp(e - 3));
        showMsg(pickMsg("playing")); gainXp(2);
      }
      else { showMsg(pickMsg("coding"), 4000); }
    };
    const interval = setInterval(doRandomAction, 7000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [mood, catName, pickMsg, showMsg, timeOfDay, energy, affection, gainXp]);

  // === PET COMBO SYSTEM (with cooldown + overpet) ===
  const handlePet = useCallback(() => {
    if (showSettings) return;
    recordInteraction();

    // Track rapid pets for overpetting
    const newPetCount = petCount + 1;
    setPetCount(newPetCount);
    if (petCountTimer.current) clearTimeout(petCountTimer.current);
    petCountTimer.current = setTimeout(() => setPetCount(0), 5000);

    // Overpetting: cat gets annoyed after too many rapid pets
    if (newPetCount > 12) {
      setMood("scratching");
      showMsg("para! tá demais! 😾");
      setAffection(a => clamp(a - 5));
      setHappiness(h => clamp(h - 3));
      setPetCount(0);
      setCooldown("pet");
      return;
    }

    // Cat is saturated with affection
    if (affection >= OVERPET_THRESHOLD && Math.random() < 0.4) {
      showMsg("tá bom já... 😒");
      setMood("idle");
      setCooldown("pet");
      return;
    }

    const now = Date.now();
    const isDoubleClick = now - lastClickTime.current < 350;
    lastClickTime.current = now;

    if (isDoubleClick) {
      const action = Math.random() > 0.5 ? "playing" : "belly";
      setMood(action as CatMood); setHappiness(h => clamp(h + 12)); setEnergy(e => clamp(e - 5));
      showMsg(pickMsg(action)); addSparkle(); gainXp(5); return;
    }

    setTimeout(() => {
      if (Date.now() - lastClickTime.current < 350) return;

      // Combo system
      const newCombo = petCombo + 1;
      setPetCombo(newCombo);
      if (petComboTimer.current) clearTimeout(petComboTimer.current);
      petComboTimer.current = setTimeout(() => setPetCombo(0), 3000);

      const newPets = pets + 1; setPets(newPets);
      setHappiness(h => clamp(h + 3 + newCombo));
      setAffection(a => clamp(a + 2 + newCombo));
      gainXp(1 + Math.floor(newCombo / 3));

      if (newCombo >= 10) {
        setMood("love"); showMsg(`COMBO x${newCombo}! 💕💕💕`);
        addSparkle(); addSparkle();
        setHappiness(h => clamp(h + 20));
      } else if (newCombo >= 5) {
        setMood("purring"); showMsg(`combo x${newCombo}! purrrr~`);
        setIsKneading(true);
        addSparkle();
      } else if (newPets % 5 === 0) {
        setMood("purring"); showMsg(pickMsg("purring"));
      } else {
        setMood("happy"); showMsg(pickMsg("happy"));
      }

      const heartId = Date.now();
      setHearts(h => [...h, heartId]);
      setTimeout(() => setHearts(h => h.filter(id => id !== heartId)), 2000);
    }, 360);
  }, [pets, petCombo, petCount, affection, showSettings, pickMsg, showMsg, addSparkle, gainXp, recordInteraction, setCooldown]);

  // === FEED (with cooldown + overfeeding) ===
  const handleFeed = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    if (showSettings) return;
    if (isOnCooldown("feed")) {
      showMsg(`espera ${getCooldownRemaining("feed")}s... 🍽️`);
      return;
    }
    recordInteraction();
    setCooldown("feed");

    const newFeedCount = feedCount + 1;
    setFeedCount(newFeedCount);

    // Overfeeding consequences
    if (hunger >= OVERFEED_THRESHOLD) {
      setMood("idle");
      showMsg("barriga cheia... 🤢 não quero mais");
      setHappiness(h => clamp(h - 3));
      setEnergy(e => clamp(e - 5));
      return;
    }

    if (newFeedCount > 4) {
      showMsg("calma, vou explodir! 😵");
      setHunger(h => clamp(h + 10));
      setHappiness(h => clamp(h - 2));
      return;
    }

    setMood("eating");
    setHappiness(h => clamp(h + 8));
    setEnergy(e => clamp(e + 5));
    setHunger(h => clamp(h + 25));
    showMsg(pickMsg("eating"));
    addSparkle(); gainXp(4);
  }, [showSettings, pickMsg, showMsg, addSparkle, gainXp, recordInteraction, isOnCooldown, setCooldown, getCooldownRemaining, hunger, feedCount]);

  // === PLAY (with cooldown + energy check) ===
  const handlePlay = useCallback(() => {
    if (isOnCooldown("play")) {
      showMsg(`ainda descansando... ${getCooldownRemaining("play")}s ⏳`);
      return;
    }
    recordInteraction();
    if (energy < 10) { showMsg("tô cansado demais... preciso dormir 😩"); return; }
    if (hunger < 15) { showMsg("com fome demais pra brincar... 🥺"); return; }
    setCooldown("play");
    setMood("playing"); setHappiness(h => clamp(h + 10)); setEnergy(e => clamp(e - 12));
    setHunger(h => clamp(h - 5)); // playing makes hungry
    showMsg(pickMsg("playing")); addSparkle(); gainXp(5);
  }, [showMsg, pickMsg, addSparkle, gainXp, recordInteraction, energy, hunger, isOnCooldown, setCooldown, getCooldownRemaining]);

  // === NAP (with cooldown) ===
  const handleNap = useCallback(() => {
    if (isOnCooldown("nap")) {
      showMsg(`não tô com sono ainda... ${getCooldownRemaining("nap")}s`);
      return;
    }
    if (energy > 85) {
      showMsg("não tô com sono! tô cheio de energia! ⚡");
      return;
    }
    recordInteraction();
    setCooldown("nap");
    setMood("sleeping"); showMsg("boa noite... 😴");
  }, [showMsg, recordInteraction, energy, isOnCooldown, setCooldown, getCooldownRemaining]);

  // === TREAT (with cooldown + limits) ===
  const handleTreat = useCallback(() => {
    if (isOnCooldown("treat")) {
      showMsg(`petisco em cooldown... ${getCooldownRemaining("treat")}s 🍪`);
      return;
    }
    if (hunger >= OVERFEED_THRESHOLD) {
      showMsg("não quero petisco... barriga cheia 😖");
      return;
    }
    recordInteraction();
    setCooldown("treat");
    setMood("excited"); setHappiness(h => clamp(h + 15)); setHunger(h => clamp(h + 15));
    setAffection(a => clamp(a + 5));
    showMsg("PETISCO!! 🎉"); addSparkle(); gainXp(6);
    setTimeout(() => setMood("coding"), 4000);
  }, [showMsg, addSparkle, gainXp, recordInteraction, hunger, isOnCooldown, setCooldown, getCooldownRemaining]);

  // === RENDER HELPERS ===
  const c = CAT_COLORS[colorIdx];
  const earInner = "#f0a0a0";
  const nose = "#e07080";
  const pawPad = "#e89098";
  const collar = "hsl(var(--primary))";
  const bell = "hsl(var(--accent))";
  const eyeColor = c.eye;

  const showEyes = mood !== "sleeping" && mood !== "dreaming" && !blink;
  const isHappy = ["happy", "purring", "excited", "belly", "listening", "hydrated", "eating", "playing", "love"].includes(mood);
  const isBelly = mood === "belly";
  const isScratching = mood === "scratching";
  const isStretching = mood === "stretching";
  const isAlert = mood === "alert" || mood === "thirsty";
  const isTired = mood === "tired" || mood === "lonely";
  const isCurious = mood === "curious" || mood === "hunting";

  const statColor = (val: number) => val > 60 ? "bg-success" : val > 30 ? "bg-warning" : "bg-destructive";

  const moodEmoji: Record<string, string> = {
    coding: "⌨️", sleeping: "💤", happy: "♡", purring: "~", idle: "·",
    excited: "✨", belly: "🐾", scratching: "👃", stretching: "🧘",
    listening: "♪", thirsty: "💧", hydrated: "✓", caffeinated: "☕",
    focused: "🍅", alert: "⚠️", eating: "🐟", playing: "🧶",
    lonely: "😿", tired: "😴", grooming: "🧼", curious: "👀",
    zoomies: "⚡", dreaming: "💭", scared: "😱", love: "💕",
    begging: "🥺", hunting: "🎯",
  };

  const moodLabel: Record<string, string> = {
    coding: "codando", sleeping: "dormindo", happy: "feliz", purring: "ronronando",
    idle: "à toa", excited: "animado!", belly: "barriguinha", scratching: "coçando",
    stretching: "esticando", listening: "ouvindo ♪", thirsty: "com sede",
    hydrated: "hidratado", caffeinated: "cafeinado", focused: "focado",
    alert: "alerta!", eating: "comendo", playing: "brincando",
    lonely: "solitário", tired: "cansado", grooming: "se limpando",
    curious: "curioso!", zoomies: "ZOOMIES!", dreaming: "sonhando",
    scared: "assustado!", love: "apaixonado", begging: "faminto!",
    hunting: "caçando",
  };

  const xpNeeded = xpForLevel(level);
  const xpPercent = Math.min((xp / xpNeeded) * 100, 100);

  return (
    <div ref={catRef} className="fixed bottom-4 right-4 z-50 select-none">
      {/* Speech bubble - improved with typing effect */}
      <AnimatePresence>
        {message && !showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={cn(
              "absolute -top-20 right-0 backdrop-blur-xl border rounded-2xl px-4 py-3 shadow-2xl max-w-[300px] z-20",
              isAlert ? "bg-destructive/10 border-destructive/30 shadow-destructive/10" :
              mood === "love" ? "bg-destructive/5 border-destructive/20 shadow-destructive/10" :
              mood === "excited" ? "bg-accent/5 border-accent/20 shadow-accent/10" :
              "bg-card/95 border-border/40"
            )}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0 mt-0.5">{moodEmoji[mood] || "💬"}</span>
              <div className="min-w-0">
                <p className={cn("text-xs font-mono leading-relaxed break-words", isAlert ? "text-destructive" : "text-foreground/90")}>
                  {typedMessage}
                  {isTyping && <span className="animate-pulse text-primary ml-0.5">▍</span>}
                </p>
              </div>
            </div>
            {/* Tail pointer with 3 dots leading to cat */}
            <div className="absolute -bottom-1 right-10 w-2.5 h-2.5 border-r border-b rotate-45"
              style={{ background: isAlert ? "hsl(var(--destructive) / 0.1)" : "hsl(var(--card) / 0.95)",
                borderColor: isAlert ? "hsl(var(--destructive) / 0.3)" : "hsl(var(--border) / 0.4)" }} />
            <div className="absolute -bottom-3 right-8 flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-border/30" />
              <div className="w-0.5 h-0.5 rounded-full bg-border/20 mt-0.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level up celebration */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.5 }}
            className="absolute -top-24 right-0 bg-primary/20 border border-primary/40 rounded-xl px-4 py-2 shadow-xl z-30"
          >
            <p className="text-xs font-mono font-bold text-primary flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" /> Level {level}!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet combo indicator */}
      <AnimatePresence>
        {petCombo >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -top-5 left-0 bg-primary/20 border border-primary/30 rounded-full px-2 py-0.5 z-20"
          >
            <span className="text-[9px] font-mono font-bold text-primary">x{petCombo}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-2xl w-64 z-30"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">// cat.config</h4>
              <button onClick={() => setShowSettings(false)} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-mono text-muted-foreground/60 block mb-1.5">nome</label>
                <input value={catName} onChange={(e) => saveName(e.target.value)}
                  className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" maxLength={12}
                  placeholder="Nome do gato" />
              </div>
              <div>
                <label className="text-[9px] font-mono text-muted-foreground/60 block mb-2">pelagem</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CAT_COLORS.map((color, i) => (
                    <button key={i} onClick={() => saveColor(i)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[9px] font-mono transition-all border",
                        colorIdx === i ? "border-primary/60 bg-primary/10 text-primary shadow-sm" : "border-border/30 text-muted-foreground/60 hover:bg-muted/30 hover:border-border/50"
                      )}>
                      <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: color.fur1, border: `1px solid ${color.fur2}` }} />
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level display */}
              <div className="border-t border-border/20 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-muted-foreground/60 flex items-center gap-1">
                    <Star className="w-3 h-3 text-primary/60" /> nível {level}
                  </span>
                  <span className="text-[8px] font-mono text-muted-foreground/40">{Math.round(xp)}/{xpNeeded} xp</span>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-primary" initial={false}
                    animate={{ width: `${xpPercent}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                </div>
              </div>

              <p className="text-[7px] font-mono text-muted-foreground/25 leading-relaxed text-center">
                clique = carinho · 2x clique = brincar · combos = bônus
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main cat card */}
      <div className="bg-card/80 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl overflow-hidden w-[260px]">
        {/* Cat viewport */}
        <div className="relative px-2 pt-2">
          {hearts.map((id, i) => (
            <span key={id} className="absolute text-sm animate-heart-float pointer-events-none z-10"
              style={{ left: `${20 + (i % 5) * 16}px`, top: "0px" }}>
              {["♡", "✦", "♡", "⋆", "♡"][i % 5]}
            </span>
          ))}
          {sparkles.map((id, i) => (
            <span key={id} className="absolute animate-heart-float pointer-events-none text-primary z-10"
              style={{ left: `${30 + (i % 3) * 25}px`, top: "-4px", fontSize: "14px" }}>✦</span>
          ))}

          {/* Sleeping Zs */}
          {(mood === "sleeping" || mood === "dreaming") && (
            <div className="absolute -top-1 right-3 flex gap-1 z-10">
              {[0, 0.4, 0.8].map((d, i) => (
                <span key={i} className="animate-float font-mono text-muted-foreground/40"
                  style={{ animationDelay: `${d}s`, fontSize: `${8 + i * 2}px` }}>z</span>
              ))}
            </div>
          )}

          {/* Dream bubble */}
          {mood === "dreaming" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-3 left-2 z-10 bg-card/80 border border-border/30 rounded-full w-7 h-7 flex items-center justify-center"
            >
              <span className="text-sm">{dreamItem}</span>
            </motion.div>
          )}

          {/* Alert */}
          {isAlert && (
            <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-destructive/80 animate-pulse flex items-center justify-center z-10">
              <span className="text-[8px] text-white font-bold">!</span>
            </div>
          )}
          {/* Hunger warning */}
          {hunger < 20 && !isAlert && mood !== "sleeping" && mood !== "dreaming" && (
            <div className="absolute top-1 left-1 animate-pulse z-10"><Cookie className="w-3 h-3 text-accent/60" /></div>
          )}
          {happiness < 30 && !isAlert && hunger >= 20 && mood !== "sleeping" && mood !== "dreaming" && (
            <div className="absolute top-1 left-1 animate-pulse z-10"><Heart className="w-3 h-3 text-destructive/60" /></div>
          )}
          {energy < 25 && mood !== "sleeping" && mood !== "dreaming" && (
            <div className="absolute top-1 left-5 animate-pulse z-10"><Zap className="w-3 h-3 text-warning/60" /></div>
          )}

          {mood === "eating" && (
            <div className="absolute top-4 left-10 z-10">
              {[0, 1, 2].map(i => (
                <span key={i} className="absolute animate-heart-float text-[10px]"
                  style={{ left: `${i * 8}px`, animationDelay: `${i * 0.2}s` }}>🐟</span>
              ))}
            </div>
          )}
          {mood === "playing" && (
            <div className="absolute top-2 left-6 animate-bounce z-10"><span className="text-sm">🧶</span></div>
          )}
          {mood === "hunting" && (
            <div className="absolute top-3 left-4 z-10">
              <motion.span animate={{ x: [0, 30, 15, 40, 10], y: [0, -5, 5, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }} className="text-[10px] absolute">🐁</motion.span>
            </div>
          )}
          {mood === "zoomies" && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              {[0, 1, 2, 3].map(i => (
                <motion.span key={i} className="absolute text-[8px] text-primary/40"
                  animate={{ opacity: [0, 0.6, 0], x: [0, (i % 2 ? 1 : -1) * 20], y: [0, -10] }}
                  transition={{ duration: 0.4, delay: i * 0.1, repeat: Infinity }}
                  style={{ left: `${30 + i * 20}px`, top: `${50 + i * 5}px` }}>💨</motion.span>
              ))}
            </div>
          )}

          <div
            className={cn(
              "flex justify-center transition-transform duration-500 ease-in-out py-1",
              mood === "sleeping" || mood === "dreaming" ? "" : "animate-breathe",
              isBelly && "animate-belly-roll",
              isStretching && "animate-cat-stretch",
              isScratching && "animate-cat-scratch",
              isAlert && "animate-[shake_0.5s_ease-in-out_infinite]",
              mood === "listening" && "animate-[bounce_1s_ease-in-out_infinite]",
              mood === "playing" && "animate-[bounce_0.6s_ease-in-out_infinite]",
              mood === "zoomies" && "animate-[shake_0.15s_ease-in-out_infinite]",
              mood === "scared" && "animate-[shake_0.3s_ease-in-out_infinite]",
              mood === "grooming" && "animate-cat-scratch",
              mood === "hunting" && "animate-breathe",
              isTired && "opacity-80",
              mood === "love" && "animate-[bounce_0.8s_ease-in-out_infinite]",
            )}
            onAnimationEnd={(e) => { if (e.currentTarget === e.target) handleAnimationEnd(); }}
          >
            <svg width="160" height="145" viewBox="0 0 44 40"
              className="image-rendering-pixelated cursor-pointer drop-shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
              onClick={handlePet} onContextMenu={(e) => handleFeed(e)}
              role="button" aria-label={`Acariciar ${catName}`}>

              <ellipse cx="20" cy="38" rx="15" ry="2" fill="hsl(var(--foreground) / 0.04)" />

              {/* Tail */}
              <g className={isHappy || mood === "zoomies" ? "animate-tail-fast" : "animate-tail"}>
                <rect x="30" y="24" width="1" height="1" fill={c.fur2} />
                <rect x="31" y="23" width="1" height="1" fill={c.fur1} />
                <rect x="32" y="22" width="1" height="1" fill={c.fur1} />
                <rect x="33" y="21" width="2" height="1" fill={c.fur1} />
                <rect x="34" y="20" width="2" height="1" fill={c.stripe} />
                <rect x="35" y="19" width="2" height="1" fill={c.fur2} />
                <rect x="36" y="18" width="1" height="1" fill={c.stripe} />
                <rect x="37" y="17" width="1" height="1" fill={c.fur1} />
              </g>

              {/* Body */}
              <rect x="7" y="21" width="25" height="11" fill={c.fur1} />
              <rect x="8" y="20" width="23" height="1" fill={c.fur2} />
              <rect x="9" y="23" width="3" height="1" fill={c.stripe} />
              <rect x="10" y="25" width="2" height="1" fill={c.stripe} />
              <rect x="26" y="23" width="3" height="1" fill={c.stripe} />
              <rect x="27" y="25" width="2" height="1" fill={c.stripe} />
              <rect x="13" y="22" width="13" height="9" fill={c.belly} />

              {/* Collar */}
              <rect x="9" y="19" width="21" height="2" fill={collar} />
              <rect x="18" y="20" width="3" height="2" fill={bell} />
              <rect x="19" y="20" width="1" height="1" fill="white" opacity="0.4" />

              {/* Ears */}
              <g className="animate-ear-twitch">
                <rect x="6" y="1" width="1" height="1" fill={c.fur2} />
                <rect x="7" y="0" width="4" height="1" fill={c.fur2} />
                <rect x="5" y="2" width="1" height="4" fill={c.fur2} />
                <rect x="6" y="2" width="1" height="3" fill={c.fur1} />
                <rect x="7" y="1" width="3" height="2" fill={c.fur1} />
                <rect x="7" y="2" width="2" height="2" fill={earInner} />
              </g>
              <rect x="27" y="1" width="1" height="1" fill={c.fur2} />
              <rect x="28" y="0" width="4" height="1" fill={c.fur2} />
              <rect x="32" y="2" width="1" height="4" fill={c.fur2} />
              <rect x="31" y="2" width="1" height="3" fill={c.fur1} />
              <rect x="28" y="1" width="3" height="2" fill={c.fur1} />
              <rect x="29" y="2" width="2" height="2" fill={earInner} />

              {/* Head */}
              <rect x="6" y="6" width="27" height="2" fill={c.fur2} />
              <rect x="5" y="8" width="29" height="11" fill={c.fur1} />
              <rect x="6" y="7" width="25" height="1" fill={c.fur1} />
              <rect x="15" y="7" width="1" height="1" fill={c.stripe} />
              <rect x="16" y="6" width="1" height="2" fill={c.stripe} />
              <rect x="17" y="7" width="3" height="1" fill={c.stripe} />
              <rect x="20" y="6" width="1" height="2" fill={c.stripe} />
              <rect x="21" y="7" width="1" height="1" fill={c.stripe} />
              <rect x="6" y="14" width="6" height="4" fill={c.fur3} />
              <rect x="27" y="14" width="6" height="4" fill={c.fur3} />

              {/* Eyes */}
              {!showEyes ? (
                <>
                  <rect x="10" y="12" width="6" height="1" fill={eyeColor} />
                  <rect x="22" y="12" width="6" height="1" fill={eyeColor} />
                </>
              ) : isCurious ? (
                /* Big dilated pupils for curious/hunting */
                <>
                  <rect x="9" y="9" width="8" height="6" fill={eyeColor} />
                  <rect x="10" y="9" width="4" height="2" fill="white" />
                  <rect x="16" y="10" width="1" height="1" fill="white" opacity="0.5" />
                  <rect x="21" y="9" width="8" height="6" fill={eyeColor} />
                  <rect x="22" y="9" width="4" height="2" fill="white" />
                  <rect x="28" y="10" width="1" height="1" fill="white" opacity="0.5" />
                </>
              ) : mood === "scared" ? (
                /* Wide scared eyes */
                <>
                  <rect x="9" y="9" width="7" height="6" fill="white" />
                  <rect x="11" y="10" width="4" height="4" fill={eyeColor} />
                  <rect x="21" y="9" width="7" height="6" fill="white" />
                  <rect x="23" y="10" width="4" height="4" fill={eyeColor} />
                </>
              ) : isTired ? (
                <>
                  <rect x="10" y="12" width="6" height="3" fill={eyeColor} opacity="0.6" />
                  <rect x="10" y="11" width="6" height="2" fill={c.fur1} />
                  <rect x="22" y="12" width="6" height="3" fill={eyeColor} opacity="0.6" />
                  <rect x="22" y="11" width="6" height="2" fill={c.fur1} />
                </>
              ) : isHappy ? (
                <>
                  <rect x="10" y="11" width="6" height="1" fill={eyeColor} />
                  <rect x="10" y="12" width="1" height="2" fill={eyeColor} />
                  <rect x="15" y="12" width="1" height="2" fill={eyeColor} />
                  <rect x="22" y="11" width="6" height="1" fill={eyeColor} />
                  <rect x="22" y="12" width="1" height="2" fill={eyeColor} />
                  <rect x="27" y="12" width="1" height="2" fill={eyeColor} />
                </>
              ) : (
                <>
                  <rect x={10 + eyeOffset.x} y={10 + eyeOffset.y} width="6" height="5" fill={eyeColor} />
                  <rect x={11 + eyeOffset.x} y={10 + eyeOffset.y} width="3" height="2" fill="white" />
                  <rect x={14 + eyeOffset.x} y={13 + eyeOffset.y} width="1" height="1" fill="white" opacity="0.4" />
                  <rect x={22 + eyeOffset.x} y={10 + eyeOffset.y} width="6" height="5" fill={eyeColor} />
                  <rect x={23 + eyeOffset.x} y={10 + eyeOffset.y} width="3" height="2" fill="white" />
                  <rect x={26 + eyeOffset.x} y={13 + eyeOffset.y} width="1" height="1" fill="white" opacity="0.4" />
                </>
              )}

              {/* Nose & mouth */}
              <rect x="17" y="15" width="4" height="2" fill={nose} />
              <rect x="18" y="15" width="2" height="1" fill="#f0909a" />
              <rect x="16" y="17" width="1" height="1" fill={c.fur2} />
              <rect x="21" y="17" width="1" height="1" fill={c.fur2} />
              {isHappy && <rect x="17" y="17" width="4" height="1" fill={nose} opacity="0.5" />}
              {isTired && (
                <>
                  <rect x="17" y="18" width="1" height="1" fill={c.fur2} opacity="0.4" />
                  <rect x="20" y="18" width="1" height="1" fill={c.fur2} opacity="0.4" />
                </>
              )}
              {/* Begging mouth */}
              {mood === "begging" && <rect x="17" y="17" width="4" height="2" fill={nose} opacity="0.6" />}

              {/* Whiskers */}
              <rect x="1" y="13" width="8" height="1" fill={c.fur3} opacity="0.5" />
              <rect x="0" y="15" width="8" height="1" fill={c.fur3} opacity="0.5" />
              <rect x="2" y="17" width="7" height="1" fill={c.fur3} opacity="0.4" />
              <rect x="30" y="13" width="8" height="1" fill={c.fur3} opacity="0.5" />
              <rect x="31" y="15" width="8" height="1" fill={c.fur3} opacity="0.5" />
              <rect x="30" y="17" width="7" height="1" fill={c.fur3} opacity="0.4" />

              {/* Paws */}
              {isScratching || mood === "grooming" ? (
                <>
                  <g className="animate-scratch-paw">
                    <rect x="12" y="18" width="3" height="3" fill={c.fur1} />
                    <rect x="13" y="17" width="2" height="1" fill={c.fur3} />
                    <rect x="13" y="21" width="1" height="1" fill={pawPad} />
                  </g>
                  <rect x="25" y="32" width="7" height="4" fill={c.fur1} />
                  <rect x="26" y="35" width="5" height="1" fill={c.fur3} />
                  <rect x="27" y="34" width="1" height="1" fill={pawPad} />
                  <rect x="29" y="34" width="1" height="1" fill={pawPad} />
                </>
              ) : isBelly ? (
                <>
                  <g className="animate-belly-paws">
                    <rect x="9" y="26" width="5" height="3" fill={c.fur1} />
                    <rect x="10" y="25" width="3" height="1" fill={c.fur3} />
                    <rect x="10" y="29" width="1" height="1" fill={pawPad} />
                    <rect x="12" y="29" width="1" height="1" fill={pawPad} />
                  </g>
                  <g className="animate-belly-paws" style={{ animationDelay: "0.3s" }}>
                    <rect x="25" y="26" width="5" height="3" fill={c.fur1} />
                    <rect x="26" y="25" width="3" height="1" fill={c.fur3} />
                    <rect x="26" y="29" width="1" height="1" fill={pawPad} />
                    <rect x="28" y="29" width="1" height="1" fill={pawPad} />
                  </g>
                </>
              ) : (
                <>
                  <g className={isKneading ? "animate-knead-l" : ""}>
                    <rect x="7" y="32" width="7" height="4" fill={c.fur1} />
                    <rect x="8" y="35" width="5" height="1" fill={c.fur3} />
                    <rect x="9" y="34" width="1" height="1" fill={pawPad} />
                    <rect x="11" y="34" width="1" height="1" fill={pawPad} />
                  </g>
                  <g className={isKneading ? "animate-knead-r" : ""}>
                    <rect x="25" y="32" width="7" height="4" fill={c.fur1} />
                    <rect x="26" y="35" width="5" height="1" fill={c.fur3} />
                    <rect x="27" y="34" width="1" height="1" fill={pawPad} />
                    <rect x="29" y="34" width="1" height="1" fill={pawPad} />
                  </g>
                </>
              )}

              {/* Laptop */}
              {(mood === "coding" || mood === "focused") && (
                <>
                  <rect x="14" y="30" width="11" height="2" fill="#444" />
                  <rect x="13" y="32" width="13" height="1" fill="#555" />
                  <rect x="15" y="27" width="9" height="3" fill="#222" />
                  <rect x="16" y="27" width="1" height="1" fill="#6f6" opacity="0.9" />
                  <rect x="18" y="27" width="3" height="1" fill="#ff9" opacity="0.7" />
                  <rect x="16" y="28" width="4" height="1" fill="#9cf" opacity="0.7" />
                  <rect x="21" y="28" width="2" height="1" fill="#f9c" opacity="0.6" />
                  <rect x="17" y="29" width="5" height="1" fill="#6f6" opacity="0.5" />
                </>
              )}

              {mood === "listening" && (
                <>
                  <rect x="2" y="3" width="2" height="2" fill="hsl(var(--primary))" opacity="0.6" className="animate-float" />
                  <rect x="36" y="5" width="2" height="2" fill="hsl(var(--accent))" opacity="0.5" className="animate-float" style={{ animationDelay: "0.3s" }} />
                </>
              )}
              {mood === "excited" && (
                <>
                  <rect x="2" y="5" width="2" height="2" fill="hsl(var(--accent))" opacity="0.8" />
                  <rect x="36" y="3" width="2" height="2" fill="hsl(var(--accent))" opacity="0.6" />
                </>
              )}
              {mood === "love" && (
                <>
                  <rect x="3" y="4" width="2" height="2" fill="#f06080" opacity="0.7" className="animate-float" />
                  <rect x="35" y="2" width="2" height="2" fill="#f06080" opacity="0.5" className="animate-float" style={{ animationDelay: "0.4s" }} />
                  <rect x="8" y="1" width="1" height="1" fill="#f06080" opacity="0.4" className="animate-float" style={{ animationDelay: "0.8s" }} />
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Info bar */}
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-mono font-semibold text-foreground/90 truncate">{catName}</span>
              <span className="text-sm">{moodEmoji[mood] || "·"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-primary/60 bg-primary/10 rounded-md px-1.5 py-0.5">Lv.{level}</span>
              <span className="text-[11px] font-mono text-muted-foreground/50 shrink-0">{moodLabel[mood] || mood}</span>
            </div>
          </div>

          {/* XP bar */}
          <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden mb-2.5">
            <motion.div className="h-full rounded-full bg-primary/60" initial={false}
              animate={{ width: `${xpPercent}%` }} transition={{ duration: 0.5 }} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { icon: "♡", val: happiness, color: statColor(happiness), label: "Humor" },
              { icon: "⚡", val: energy, color: statColor(energy), label: "Energia" },
              { icon: "🍖", val: hunger, color: statColor(hunger), label: "Fome" },
              { icon: "💕", val: affection, color: statColor(affection), label: "Afeto" },
            ].map(({ icon, val, color, label }, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-sm">{icon}</span>
                <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div className={cn("h-full rounded-full", color)} initial={false}
                    animate={{ width: `${val}%` }} transition={{ duration: 0.6 }} />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/40">{Math.round(val)}%</span>
              </div>
            ))}
          </div>

          {/* Action buttons with cooldown indicators */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {[
              { action: "pet", icon: Hand, handler: handlePet, label: "Carinho", hoverBg: "hover:bg-primary/10", hoverText: "hover:text-primary", hoverBorder: "hover:border-primary/30" },
              { action: "feed", icon: Utensils, handler: () => handleFeed(), label: "Alimentar", hoverBg: "hover:bg-accent/10", hoverText: "hover:text-accent", hoverBorder: "hover:border-accent/30" },
              { action: "play", icon: Gamepad2, handler: handlePlay, label: "Brincar", hoverBg: "hover:bg-success/10", hoverText: "hover:text-success", hoverBorder: "hover:border-success/30" },
              { action: "treat", icon: Cookie, handler: handleTreat, label: "Petisco", hoverBg: "hover:bg-warning/10", hoverText: "hover:text-warning", hoverBorder: "hover:border-warning/30" },
            ].map(({ action, icon: Icon, handler, label, hoverBg, hoverText, hoverBorder }) => {
              const cd = isOnCooldown(action);
              const remaining = getCooldownRemaining(action);
              return (
                <button key={action} onClick={handler} title={cd ? `${label} (${remaining}s)` : label}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 h-10 rounded-xl border transition-all",
                    cd
                      ? "border-border/10 text-muted-foreground/20 cursor-not-allowed"
                      : `border-border/20 text-muted-foreground/50 ${hoverBg} ${hoverText} ${hoverBorder}`
                  )}>
                  <Icon className="w-4 h-4" />
                  {cd ? (
                    <span className="text-[10px] font-mono font-bold">{remaining}s</span>
                  ) : (
                    <span className="text-[9px] font-mono">{label}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom row: nap + settings */}
          <div className="flex items-center justify-between pt-1 border-t border-border/10">
            <button onClick={handleNap} title="Dormir"
              className="flex items-center gap-1.5 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors p-1">
              <Moon className="w-4 h-4" />
              <span className="text-[10px] font-mono">Dormir</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className="flex items-center gap-1.5 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors p-1">
              <span className="text-[10px] font-mono">Config</span>
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
