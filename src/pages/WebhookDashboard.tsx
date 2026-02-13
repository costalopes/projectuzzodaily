import { useState, useCallback } from "react";
import { ArrowLeft, Send, CheckCircle, XCircle, Loader2, Zap, Bell, Timer, AlertTriangle, Flame, Settings, X, Power, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WebhookConfig {
  id: string;
  label: string;
  description: string;
  icon: typeof Timer;
  color: string;
  payload: Record<string, unknown>;
  enabled: boolean;
}

const DEFAULT_WEBHOOKS: WebhookConfig[] = [
  {
    id: "pomodoro_start_focus",
    label: "Timer Iniciado (Foco)",
    description: "Notifica início de sessão de foco de 25min",
    icon: Timer,
    color: "text-primary",
    enabled: true,
    payload: { type: "pomodoro", event: "start", mode: "focus", sessions: 2, userName: "App User" },
  },
  {
    id: "pomodoro_end_focus",
    label: "Pomodoro Finalizado (Foco)",
    description: "Notifica conclusão de sessão de foco",
    icon: CheckCircle,
    color: "text-success",
    enabled: true,
    payload: { type: "pomodoro", event: "end", mode: "focus", sessions: 3, userName: "App User" },
  },
  {
    id: "pomodoro_transition_short",
    label: "Transição → Pausa Curta",
    description: "Notifica início automático de pausa curta",
    icon: Zap,
    color: "text-accent",
    enabled: true,
    payload: { type: "pomodoro", event: "transition", mode: "short", sessions: 3, userName: "App User" },
  },
  {
    id: "pomodoro_transition_long",
    label: "Transição → Descanso Longo",
    description: "Notifica início automático de descanso longo",
    icon: Zap,
    color: "text-blue-400",
    enabled: true,
    payload: { type: "pomodoro", event: "transition", mode: "long", sessions: 4, userName: "App User" },
  },
  {
    id: "pomodoro_start_short",
    label: "Timer Iniciado (Pausa)",
    description: "Notifica início de pausa curta de 5min",
    icon: Timer,
    color: "text-success",
    enabled: true,
    payload: { type: "pomodoro", event: "start", mode: "short", sessions: 3, userName: "App User" },
  },
  {
    id: "task_before_deadline",
    label: "Atividades Vencendo (30min)",
    description: "Lembrete de tarefas prestes a vencer",
    icon: Bell,
    color: "text-primary",
    enabled: true,
    payload: {
      type: "task_reminder",
      reminderType: "before_deadline",
      tasks: [
        { title: "Estudar React", deadline: new Date(Date.now() + 1800000).toISOString() },
        { title: "Entregar relatório", deadline: new Date(Date.now() + 3600000).toISOString() },
      ],
      userName: "App User",
    },
  },
  {
    id: "task_overdue_1",
    label: "Atividades Atrasadas (1º Aviso)",
    description: "Primeiro aviso de tarefas atrasadas",
    icon: AlertTriangle,
    color: "text-accent",
    enabled: true,
    payload: {
      type: "task_reminder",
      reminderType: "overdue_1",
      tasks: [{ title: "Finalizar projeto", deadline: new Date(Date.now() - 3600000).toISOString() }],
      userName: "App User",
    },
  },
  {
    id: "task_overdue_3",
    label: "ÚLTIMO AVISO!",
    description: "Terceiro e último aviso de tarefas atrasadas",
    icon: Flame,
    color: "text-destructive",
    enabled: true,
    payload: {
      type: "task_reminder",
      reminderType: "overdue_3",
      tasks: [{ title: "Deploy urgente!", deadline: new Date(Date.now() - 7200000).toISOString() }],
      userName: "App User",
    },
  },
];

type TestStatus = "idle" | "loading" | "success" | "error";

const WebhookDashboard = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(DEFAULT_WEBHOOKS);
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [lastResults, setLastResults] = useState<Record<string, string>>({});
  const [sendingAll, setSendingAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateWebhook = useCallback((id: string, updates: Partial<WebhookConfig>) => {
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  const updatePayloadField = useCallback((id: string, field: string, value: unknown) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, payload: { ...w.payload, [field]: value } } : w
      )
    );
  }, []);

  const sendWebhook = async (wh: WebhookConfig) => {
    if (!wh.enabled) {
      toast.info(`${wh.label} está desativado`);
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      toast.error("Backend não configurado");
      return;
    }

    setStatuses((p) => ({ ...p, [wh.id]: "loading" }));

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/discord-notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(wh.payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatuses((p) => ({ ...p, [wh.id]: "success" }));
        setLastResults((p) => ({ ...p, [wh.id]: "✓ Enviado" }));
        toast.success(`${wh.label} enviado!`);
      } else {
        setStatuses((p) => ({ ...p, [wh.id]: "error" }));
        setLastResults((p) => ({ ...p, [wh.id]: data.error || "Erro" }));
        toast.error(`Falha: ${data.error || "Erro"}`);
      }
    } catch (err) {
      setStatuses((p) => ({ ...p, [wh.id]: "error" }));
      setLastResults((p) => ({ ...p, [wh.id]: String(err) }));
      toast.error("Erro de rede");
    }

    setTimeout(() => setStatuses((p) => ({ ...p, [wh.id]: "idle" })), 3000);
  };

  const sendAll = async () => {
    setSendingAll(true);
    for (const wh of webhooks.filter((w) => w.enabled)) {
      await sendWebhook(wh);
      await new Promise((r) => setTimeout(r, 800));
    }
    setSendingAll(false);
  };

  const enabledCount = webhooks.filter((w) => w.enabled).length;
  const successCount = Object.values(statuses).filter((s) => s === "success").length;
  const errorCount = Object.values(statuses).filter((s) => s === "error").length;

  return (
    <div className="h-screen overflow-hidden relative flex flex-col bg-background">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="shrink-0 border-b border-border/30 bg-card/60 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="bg-muted/30 hover:bg-muted/50 rounded-xl p-2.5 transition-colors">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-lg font-bold font-mono tracking-tight text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-primary">webhook</span>
                  <span className="text-muted-foreground/40">/</span>
                  <span>dashboard</span>
                </h1>
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">
                  // {enabledCount}/{webhooks.length} ativos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono">
                {successCount > 0 && (
                  <span className="flex items-center gap-1 text-success bg-success/10 border border-success/20 rounded-lg px-2.5 py-1">
                    <CheckCircle className="w-3 h-3" /> {successCount}
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-2.5 py-1">
                    <XCircle className="w-3 h-3" /> {errorCount}
                  </span>
                )}
              </div>

              <button onClick={sendAll} disabled={sendingAll}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all bg-primary text-primary-foreground hover:opacity-90 shadow-lg", sendingAll && "opacity-50 cursor-not-allowed")}>
                {sendingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sendingAll ? "Enviando..." : "Enviar Todos"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden">
          <div className="max-w-5xl mx-auto px-6 py-6">
            {/* Pomodoro */}
            <div className="mb-6">
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-mono mb-3 flex items-center gap-2">
                <Timer className="w-3 h-3" /> Pomodoro Notifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {webhooks.filter((w) => (w.payload.type as string) === "pomodoro").map((wh) => (
                  <WebhookCard key={wh.id} webhook={wh} status={statuses[wh.id] || "idle"} result={lastResults[wh.id]}
                    isEditing={editingId === wh.id}
                    onToggleEdit={() => setEditingId(editingId === wh.id ? null : wh.id)}
                    onSend={() => sendWebhook(wh)}
                    onUpdate={updateWebhook}
                    onUpdatePayload={updatePayloadField}
                  />
                ))}
              </div>
            </div>

            {/* Task Reminders */}
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-mono mb-3 flex items-center gap-2">
                <Bell className="w-3 h-3" /> Task Reminders
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {webhooks.filter((w) => (w.payload.type as string) === "task_reminder").map((wh) => (
                  <WebhookCard key={wh.id} webhook={wh} status={statuses[wh.id] || "idle"} result={lastResults[wh.id]}
                    isEditing={editingId === wh.id}
                    onToggleEdit={() => setEditingId(editingId === wh.id ? null : wh.id)}
                    onSend={() => sendWebhook(wh)}
                    onUpdate={updateWebhook}
                    onUpdatePayload={updatePayloadField}
                  />
                ))}
              </div>
            </div>

            {/* Endpoint */}
            <div className="mt-8 mb-4">
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-mono mb-3">// endpoint</h2>
              <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl p-4 font-mono text-xs">
                <span className="text-success">POST</span>{" "}
                <span className="text-muted-foreground/60">{SUPABASE_URL}/functions/v1/</span>
                <span className="text-primary">discord-notify</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WebhookCard = ({
  webhook,
  status,
  result,
  isEditing,
  onToggleEdit,
  onSend,
  onUpdate,
  onUpdatePayload,
}: {
  webhook: WebhookConfig;
  status: TestStatus;
  result?: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSend: () => void;
  onUpdate: (id: string, updates: Partial<WebhookConfig>) => void;
  onUpdatePayload: (id: string, field: string, value: unknown) => void;
}) => {
  const Icon = webhook.icon;
  const [jsonMode, setJsonMode] = useState(false);
  const [rawJson, setRawJson] = useState("");

  const openJsonMode = () => {
    setRawJson(JSON.stringify(webhook.payload, null, 2));
    setJsonMode(true);
  };

  const saveJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      onUpdate(webhook.id, { payload: parsed });
      setJsonMode(false);
      toast.success("Payload atualizado!");
    } catch {
      toast.error("JSON inválido");
    }
  };

  return (
    <div className={cn(
      "bg-card/60 backdrop-blur-xl border rounded-xl transition-all",
      webhook.enabled ? "border-border/30" : "border-border/15 opacity-50",
      isEditing && "border-primary/30"
    )}>
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn("mt-0.5 shrink-0", webhook.color)}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-mono font-semibold text-foreground">{webhook.label}</h3>
          <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">{webhook.description}</p>
          {result && (
            <p className={cn("text-[10px] font-mono mt-1.5", status === "success" ? "text-success" : "text-destructive")}>{result}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Settings button */}
          <button onClick={onToggleEdit}
            className={cn(
              "rounded-lg w-8 h-8 flex items-center justify-center transition-all border",
              isEditing
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40"
            )}>
            {isEditing ? <ChevronUp className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
          </button>

          {/* Send button */}
          <button onClick={onSend} disabled={status === "loading" || !webhook.enabled}
            className={cn(
              "shrink-0 rounded-lg w-8 h-8 flex items-center justify-center transition-all border",
              !webhook.enabled ? "bg-muted/10 border-border/15 text-muted-foreground/30 cursor-not-allowed" :
              status === "loading" ? "bg-muted/30 border-border/30 cursor-not-allowed" :
              status === "success" ? "bg-success/10 border-success/30 text-success" :
              status === "error" ? "bg-destructive/10 border-destructive/30 text-destructive" :
              "bg-muted/20 border-border/30 text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
            )}>
            {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
             status === "success" ? <CheckCircle className="w-3.5 h-3.5" /> :
             status === "error" ? <XCircle className="w-3.5 h-3.5" /> :
             <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {isEditing && (
        <div className="border-t border-border/20 px-4 py-3 space-y-3 animate-fade-in">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Status</span>
            <button
              onClick={() => onUpdate(webhook.id, { enabled: !webhook.enabled })}
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-mono font-semibold px-3 py-1.5 rounded-lg border transition-all",
                webhook.enabled
                  ? "bg-success/10 border-success/20 text-success"
                  : "bg-muted/20 border-border/30 text-muted-foreground"
              )}>
              <Power className="w-3 h-3" />
              {webhook.enabled ? "Ativo" : "Desativado"}
            </button>
          </div>

          {/* Label */}
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider block mb-1">Label</label>
            <input
              type="text"
              value={webhook.label}
              onChange={(e) => onUpdate(webhook.id, { label: e.target.value })}
              className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider block mb-1">Descrição</label>
            <input
              type="text"
              value={webhook.description}
              onChange={(e) => onUpdate(webhook.id, { description: e.target.value })}
              className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* userName */}
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider block mb-1">userName (exibido no Discord)</label>
            <input
              type="text"
              value={(webhook.payload.userName as string) || ""}
              onChange={(e) => onUpdatePayload(webhook.id, "userName", e.target.value)}
              className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Payload JSON editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Payload JSON</label>
              {!jsonMode ? (
                <button onClick={openJsonMode} className="text-[10px] font-mono text-primary hover:underline">Editar JSON</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveJson} className="text-[10px] font-mono text-success hover:underline">Salvar</button>
                  <button onClick={() => setJsonMode(false)} className="text-[10px] font-mono text-muted-foreground hover:underline">Cancelar</button>
                </div>
              )}
            </div>
            {jsonMode ? (
              <textarea
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                rows={8}
                className="w-full bg-background/80 border border-border/30 rounded-lg px-3 py-2 text-[11px] font-mono text-foreground focus:outline-none focus:border-primary/50 resize-none"
              />
            ) : (
              <pre className="bg-background/40 border border-border/20 rounded-lg px-3 py-2 text-[10px] font-mono text-muted-foreground/70 overflow-x-auto max-h-24 scrollbar-hidden">
                {JSON.stringify(webhook.payload, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookDashboard;
