import { useRef } from "react";
import { Upload, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_GRADIENTS = [
  { id: "warm", label: "Warm Sunset", class: "from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20", preview: "from-amber-400/60 via-orange-400/50 to-rose-400/40" },
  { id: "ocean", label: "Deep Ocean", class: "from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950/20 dark:via-blue-950/20 dark:to-cyan-950/20", preview: "from-blue-400/60 via-cyan-400/50 to-teal-400/40" },
  { id: "forest", label: "Forest Dawn", class: "from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20", preview: "from-emerald-400/60 via-green-400/50 to-teal-400/40" },
  { id: "lavender", label: "Lavender Night", class: "from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-950/20 dark:via-violet-950/20 dark:to-indigo-950/20", preview: "from-purple-400/60 via-violet-400/50 to-indigo-400/40" },
  { id: "sakura", label: "Sakura", class: "from-pink-50 via-rose-50 to-fuchsia-50 dark:from-pink-950/20 dark:via-rose-950/20 dark:to-fuchsia-950/20", preview: "from-pink-400/60 via-rose-400/50 to-fuchsia-400/40" },
  { id: "midnight", label: "Midnight", class: "from-gray-100 via-slate-100 to-zinc-100 dark:from-gray-950/30 dark:via-slate-950/30 dark:to-zinc-950/30", preview: "from-gray-500/50 via-slate-500/40 to-zinc-500/30" },
  { id: "coffee", label: "Coffee Shop", class: "from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20", preview: "from-orange-400/60 via-amber-400/50 to-yellow-400/40" },
  { id: "aurora", label: "Aurora", class: "from-teal-50 via-cyan-50 to-blue-50 dark:from-teal-950/20 dark:via-cyan-950/20 dark:to-blue-950/20", preview: "from-teal-400/60 via-cyan-400/50 to-blue-400/40" },
];

interface BgPickerProps {
  currentGradient: string;
  customBg: string | null;
  onGradientChange: (gradient: string) => void;
  onCustomBg: (url: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const BackgroundPicker = ({
  currentGradient,
  customBg,
  onGradientChange,
  onCustomBg,
  isOpen,
  onClose,
}: BgPickerProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Imagem muito grande! Máximo 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onCustomBg(reader.result as string);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-2xl w-[280px]"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-2 font-mono">
          <Image className="w-3.5 h-3.5 text-primary" />
          Personalizar fundo
        </h3>
        <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Upload */}
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full border border-dashed border-border/50 rounded-xl p-3 mb-3 flex items-center justify-center gap-2 text-[11px] font-mono text-muted-foreground/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload sua imagem
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {/* Custom bg preview + remove */}
      {customBg && (
        <div className="mb-3 relative rounded-xl overflow-hidden h-14">
          <img src={customBg} alt="Custom background" className="w-full h-full object-cover" />
          <button
            onClick={() => onCustomBg(null)}
            className="absolute top-1 right-1 bg-card/80 backdrop-blur-sm rounded-lg p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Presets */}
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-mono font-medium mb-2">Gradientes</p>
      <div className="grid grid-cols-4 gap-2">
        {PRESET_GRADIENTS.map((g) => (
          <button
            key={g.id}
            onClick={() => { onGradientChange(g.class); onCustomBg(null); onClose(); }}
            className={cn(
              "rounded-xl h-9 w-full bg-gradient-to-br transition-all border-2",
              g.preview,
              currentGradient === g.class ? "border-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)] scale-105" : "border-border/20 hover:border-border/50 hover:scale-105"
            )}
            title={g.label}
          />
        ))}
      </div>
    </motion.div>
  );
};

export { PRESET_GRADIENTS };
