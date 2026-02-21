import { useState, useRef } from "react";
import { Download, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEYS = [
  "pixel-planner-study",
  "annotations-data",
  "cat-name",
  "cat-color",
  "cat-level",
  "cat-hunger",
  "cat-happiness",
  "cat-energy",
  "cat-last-interaction",
  "water-goal-ml",
  "coffee-limit",
  "webhook_profile",
];

type Status = "idle" | "loading" | "success" | "error";

export const BackupManager = () => {
  const [exportStatus, setExportStatus] = useState<Status>("idle");
  const [importStatus, setImportStatus] = useState<Status>("idle");
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setExportStatus("loading");
    try {
      const backup: Record<string, string | null> = {};
      LOCAL_STORAGE_KEYS.forEach((key) => {
        const val = localStorage.getItem(key);
        if (val !== null) backup[key] = val;
      });

      const blob = new Blob(
        [JSON.stringify({ _version: 1, _date: new Date().toISOString(), data: backup }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pixel-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 2000);
    } catch {
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 2000);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus("loading");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const data = json.data;
        if (!data || typeof data !== "object") throw new Error("Formato inválido");

        let count = 0;
        Object.entries(data).forEach(([key, val]) => {
          if (LOCAL_STORAGE_KEYS.includes(key) && typeof val === "string") {
            localStorage.setItem(key, val);
            count++;
          }
        });

        setImportMsg(`${count} itens restaurados`);
        setImportStatus("success");
        setTimeout(() => {
          setImportStatus("idle");
          setImportMsg("");
          window.location.reload();
        }, 1500);
      } catch {
        setImportMsg("Arquivo inválido");
        setImportStatus("error");
        setTimeout(() => {
          setImportStatus("idle");
          setImportMsg("");
        }, 2500);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="px-1 py-1.5 border-t border-border/30 mt-1 pt-2">
      <p className="text-[10px] font-mono text-muted-foreground/60 mb-2 flex items-center gap-1.5">
        <Download className="w-3 h-3" /> Backup de dados locais
      </p>
      <div className="flex gap-1.5">
        <button
          onClick={handleExport}
          disabled={exportStatus === "loading"}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-mono transition-all",
            exportStatus === "success"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              : "bg-muted/40 hover:bg-muted/60 text-foreground/70 border border-border/30"
          )}
        >
          {exportStatus === "loading" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : exportStatus === "success" ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          {exportStatus === "success" ? "Baixado!" : "Exportar"}
        </button>

        <label
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-mono transition-all cursor-pointer",
            importStatus === "success"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              : importStatus === "error"
                ? "bg-destructive/10 text-destructive/70 border border-destructive/20"
                : "bg-muted/40 hover:bg-muted/60 text-foreground/70 border border-border/30"
          )}
        >
          {importStatus === "loading" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : importStatus === "success" ? (
            <CheckCircle className="w-3 h-3" />
          ) : importStatus === "error" ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <Upload className="w-3 h-3" />
          )}
          {importMsg || "Importar"}
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
      </div>
    </div>
  );
};
