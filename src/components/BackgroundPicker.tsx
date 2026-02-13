import { useRef } from "react";
import { Upload, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_GRADIENTS = [
  { id: "warm", label: "Warm Sunset", class: "from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20" },
  { id: "ocean", label: "Deep Ocean", class: "from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950/20 dark:via-blue-950/20 dark:to-cyan-950/20" },
  { id: "forest", label: "Forest Dawn", class: "from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20" },
  { id: "lavender", label: "Lavender Night", class: "from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-950/20 dark:via-violet-950/20 dark:to-indigo-950/20" },
  { id: "sakura", label: "Sakura", class: "from-pink-50 via-rose-50 to-fuchsia-50 dark:from-pink-950/20 dark:via-rose-950/20 dark:to-fuchsia-950/20" },
  { id: "midnight", label: "Midnight", class: "from-gray-100 via-slate-100 to-zinc-100 dark:from-gray-950/30 dark:via-slate-950/30 dark:to-zinc-950/30" },
  { id: "coffee", label: "Coffee Shop", class: "from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20" },
  { id: "aurora", label: "Aurora", class: "from-teal-50 via-cyan-50 to-blue-50 dark:from-teal-950/20 dark:via-cyan-950/20 dark:to-blue-950/20" },
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
    <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" />
          Personalizar fundo
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload */}
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-xl p-4 mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
      >
        <Upload className="w-4 h-4" />
        Upload sua imagem
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {/* Custom bg preview + remove */}
      {customBg && (
        <div className="mb-4 relative rounded-xl overflow-hidden h-16">
          <img src={customBg} alt="Custom background" className="w-full h-full object-cover" />
          <button
            onClick={() => onCustomBg(null)}
            className="absolute top-1 right-1 bg-card/80 rounded-lg p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Presets */}
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Gradientes</p>
      <div className="grid grid-cols-4 gap-2">
        {PRESET_GRADIENTS.map((g) => (
          <button
            key={g.id}
            onClick={() => { onGradientChange(g.class); onCustomBg(null); onClose(); }}
            className={cn(
              "rounded-xl h-10 bg-gradient-to-br transition-all border-2",
              g.class,
              currentGradient === g.class ? "border-primary shadow-md" : "border-transparent hover:border-border"
            )}
            title={g.label}
          />
        ))}
      </div>
    </div>
  );
};

export { PRESET_GRADIENTS };
