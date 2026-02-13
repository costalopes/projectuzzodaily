import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Send, CheckCircle, XCircle, Loader2, Zap, Bell, Timer, AlertTriangle, Flame, Settings, Power, ChevronUp, Palette, Image as ImageIcon, Type, User, MessageSquare, Code, FileText, Info, AtSign, ChevronDown, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface EmbedConfig {
  botName: string;
  avatarUrl: string;
  embedTitle: string;
  embedDescription: string;
  embedColor: string; // hex
  thumbnailUrl: string;
  footerText: string;
  quoteText: string;
}

interface WebhookConfig {
  id: string;
  label: string;
  description: string;
  icon: typeof Timer;
  color: string;
  payload: Record<string, unknown>;
  enabled: boolean;
  embed: EmbedConfig;
}

const DEFAULT_AVATAR = "https://shziwwccvpxtdjvbmrab.supabase.co/storage/v1/object/public/webhook-assets/avatar.png?v=2";
const DEFAULT_THUMB = "https://shziwwccvpxtdjvbmrab.supabase.co/storage/v1/object/public/webhook-assets/iconpomodoro.png";

const defaultEmbed = (title: string, description: string): EmbedConfig => ({
  botName: "Layla | Pixel Planner",
  avatarUrl: DEFAULT_AVATAR,
  embedTitle: title,
  embedDescription: description,
  embedColor: "#FFD700",
  thumbnailUrl: DEFAULT_THUMB,
  footerText: "Pixel Planner",
  quoteText: "{random_quote}",
});

const DEFAULT_WEBHOOKS: WebhookConfig[] = [
  {
    id: "pomodoro_start_focus", label: "Timer Iniciado (Foco)", description: "Notifica início de sessão de foco de 25min",
    icon: Timer, color: "text-primary", enabled: true,
    payload: { type: "pomodoro", event: "start", mode: "focus", sessions: 2, userName: "App User" },
    embed: defaultEmbed("🔔 | Timer Iniciado!", "**{mode_label}** iniciado! ({duration})\n**{user}** | 🔥 **{number_session} sessões**"),
  },
  {
    id: "pomodoro_end_focus", label: "Pomodoro Finalizado (Foco)", description: "Notifica conclusão de sessão de foco",
    icon: CheckCircle, color: "text-success", enabled: true,
    payload: { type: "pomodoro", event: "end", mode: "focus", sessions: 3, userName: "App User" },
    embed: defaultEmbed("🔔 | Pomodoro Finalizado!", "**{mode_label}** concluído! ⭐\n**{user}** | 🔥 **{number_session} sessões**"),
  },
  {
    id: "pomodoro_transition_short", label: "Transição → Pausa Curta", description: "Notifica início automático de pausa curta",
    icon: Zap, color: "text-accent", enabled: true,
    payload: { type: "pomodoro", event: "transition", mode: "short", sessions: 3, userName: "App User" },
    embed: defaultEmbed("🔔 | Próxima Sessão!", "**{user}** | 🔥 **{number_session} sessões**\n\n**{mode_label}** — Pausa merecida! 😌"),
  },
  {
    id: "pomodoro_transition_long", label: "Transição → Descanso Longo", description: "Notifica início automático de descanso longo",
    icon: Zap, color: "text-blue-400", enabled: true,
    payload: { type: "pomodoro", event: "transition", mode: "long", sessions: 4, userName: "App User" },
    embed: defaultEmbed("🔔 | Próxima Sessão!", "**{user}** | 🔥 **{number_session} sessões**\n\n**{mode_label}** — Recarregue as energias! ⚡"),
  },
  {
    id: "pomodoro_start_short", label: "Timer Iniciado (Pausa)", description: "Notifica início de pausa curta de 5min",
    icon: Timer, color: "text-success", enabled: true,
    payload: { type: "pomodoro", event: "start", mode: "short", sessions: 3, userName: "App User" },
    embed: defaultEmbed("🔔 | Timer Iniciado!", "**{mode_label}** iniciado! ({duration})\n**{user}** | 🔥 **{number_session} sessões**"),
  },
  {
    id: "task_before_deadline", label: "Atividades Vencendo (30min)", description: "Lembrete de tarefas prestes a vencer",
    icon: Bell, color: "text-primary", enabled: true,
    payload: { type: "task_reminder", reminderType: "before_deadline", tasks: [{ title: "Estudar React", deadline: new Date(Date.now() + 1800000).toISOString() }, { title: "Entregar relatório", deadline: new Date(Date.now() + 3600000).toISOString() }], userName: "App User" },
    embed: defaultEmbed("🔔 | Atividades Vencendo em 30min!", "**{user}**\n\n{task_list}"),
  },
  {
    id: "task_overdue_1", label: "Atividades Atrasadas (1º Aviso)", description: "Primeiro aviso de tarefas atrasadas",
    icon: AlertTriangle, color: "text-accent", enabled: true,
    payload: { type: "task_reminder", reminderType: "overdue_1", tasks: [{ title: "Finalizar projeto", deadline: new Date(Date.now() - 3600000).toISOString() }], userName: "App User" },
    embed: defaultEmbed("🔔 | Atividades Atrasadas! (1º Aviso)", "**{user}**\n\n{task_list}"),
  },
  {
    id: "task_overdue_3", label: "ÚLTIMO AVISO!", description: "Terceiro e último aviso de tarefas atrasadas",
    icon: Flame, color: "text-destructive", enabled: true,
    payload: { type: "task_reminder", reminderType: "overdue_3", tasks: [{ title: "Deploy urgente!", deadline: new Date(Date.now() - 7200000).toISOString() }], userName: "App User" },
    embed: defaultEmbed("🔔 | ÚLTIMO AVISO!", "**{user}**\n\n{task_list}"),
  },
];

const TEMPLATE_VARS = [
  { var: "{user}", desc: "Nome do usuário" },
  { var: "{number_session}", desc: "Nº de sessões (pomodoro)" },
  { var: "{mode_label}", desc: "Foco / Pausa Curta / Descanso Longo" },
  { var: "{duration}", desc: "Duração (25min, 5min, 15min)" },
  { var: "{random_quote}", desc: "Frase motivacional aleatória" },
  { var: "{task_list}", desc: "Lista de tarefas (task_reminder)" },
];

type TestStatus = "idle" | "loading" | "success" | "error";

const hexToDecimal = (hex: string): number => {
  const clean = hex.replace("#", "");
  return parseInt(clean, 16);
};

interface UserProfile {
  displayName: string;
  discordUserId: string;
}

const loadProfile = (): UserProfile => {
  try {
    const saved = localStorage.getItem("webhook_profile");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { displayName: "App User", discordUserId: "" };
};

const WebhookDashboard = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(DEFAULT_WEBHOOKS);
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [lastResults, setLastResults] = useState<Record<string, string>>({});
  const [sendingAll, setSendingAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("webhook_profile", JSON.stringify(profile));
    // Sync userName across all webhooks
    setWebhooks((prev) => prev.map((w) => ({ ...w, payload: { ...w.payload, userName: profile.displayName } })));
  }, [profile]);

  const updateWebhook = useCallback((id: string, updates: Partial<WebhookConfig>) => {
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  const updatePayloadField = useCallback((id: string, field: string, value: unknown) => {
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, payload: { ...w.payload, [field]: value } } : w));
  }, []);

  const updateEmbedField = useCallback((id: string, field: keyof EmbedConfig, value: string) => {
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, embed: { ...w.embed, [field]: value } } : w));
  }, []);

  const sendWebhook = async (wh: WebhookConfig) => {
    if (!wh.enabled) { toast.info(`${wh.label} está desativado`); return; }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { toast.error("Backend não configurado"); return; }

    setStatuses((p) => ({ ...p, [wh.id]: "loading" }));
    try {
      const payloadWithOverrides = {
        ...wh.payload,
        userName: profile.displayName,
        overrides: {
          botName: wh.embed.botName,
          avatarUrl: wh.embed.avatarUrl,
          embedTitle: wh.embed.embedTitle,
          embedDescription: wh.embed.embedDescription,
          embedColor: hexToDecimal(wh.embed.embedColor),
          thumbnailUrl: wh.embed.thumbnailUrl,
          footerText: wh.embed.footerText,
          quoteText: wh.embed.quoteText,
          discordUserId: profile.discordUserId || undefined,
        },
      };

      const res = await fetch(`${SUPABASE_URL}/functions/v1/discord-notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify(payloadWithOverrides),
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
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">// {enabledCount}/{webhooks.length} ativos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono">
                {successCount > 0 && <span className="flex items-center gap-1 text-success bg-success/10 border border-success/20 rounded-lg px-2.5 py-1"><CheckCircle className="w-3 h-3" /> {successCount}</span>}
                {errorCount > 0 && <span className="flex items-center gap-1 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-2.5 py-1"><XCircle className="w-3 h-3" /> {errorCount}</span>}
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
            {/* Mini Profile */}
            <div className="mb-6">
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="w-full bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl p-4 flex items-center justify-between hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-mono font-semibold text-foreground">{profile.displayName}</h3>
                    <p className="text-[10px] font-mono text-muted-foreground/50">
                      {profile.discordUserId ? `Discord ID: ${profile.discordUserId}` : "Discord ID não configurado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {profile.discordUserId && (
                    <span className="text-[10px] font-mono bg-success/10 text-success border border-success/20 rounded-lg px-2 py-0.5 flex items-center gap-1">
                      <AtSign className="w-3 h-3" /> Menção ativa
                    </span>
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", profileOpen && "rotate-180")} />
                </div>
              </button>
              {profileOpen && (
                <div className="mt-2 bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl p-4 space-y-3 animate-fade-in">
                  <p className="text-[10px] font-mono text-muted-foreground/50">// Seu perfil é usado em todos os webhooks. O Discord ID faz a menção (@) antes do embed.</p>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <User className="w-3 h-3" /> Nome de Exibição
                    </label>
                    <input type="text" value={profile.displayName} onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                      placeholder="Seu nome"
                      className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <AtSign className="w-3 h-3" /> Discord User ID
                    </label>
                    <input type="text" value={profile.discordUserId} onChange={(e) => setProfile((p) => ({ ...p, discordUserId: e.target.value.replace(/\D/g, "") }))}
                      placeholder="Ex: 123456789012345678"
                      className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50" />
                    <p className="text-[9px] font-mono text-muted-foreground/40 mt-1">
                      Ative o Modo Desenvolvedor no Discord → clique direito no seu perfil → Copiar ID
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-mono mb-3 flex items-center gap-2"><Timer className="w-3 h-3" /> Pomodoro Notifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {webhooks.filter((w) => (w.payload.type as string) === "pomodoro").map((wh) => (
                  <WebhookCard key={wh.id} webhook={wh} status={statuses[wh.id] || "idle"} result={lastResults[wh.id]}
                    isEditing={editingId === wh.id} onToggleEdit={() => setEditingId(editingId === wh.id ? null : wh.id)}
                    onSend={() => sendWebhook(wh)} onUpdate={updateWebhook} onUpdatePayload={updatePayloadField} onUpdateEmbed={updateEmbedField} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-mono mb-3 flex items-center gap-2"><Bell className="w-3 h-3" /> Task Reminders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {webhooks.filter((w) => (w.payload.type as string) === "task_reminder").map((wh) => (
                  <WebhookCard key={wh.id} webhook={wh} status={statuses[wh.id] || "idle"} result={lastResults[wh.id]}
                    isEditing={editingId === wh.id} onToggleEdit={() => setEditingId(editingId === wh.id ? null : wh.id)}
                    onSend={() => sendWebhook(wh)} onUpdate={updateWebhook} onUpdatePayload={updatePayloadField} onUpdateEmbed={updateEmbedField} />
                ))}
              </div>
            </div>
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

/* ── Reusable field row ── */
const FieldRow = ({ icon: Icon, label, value, onChange, type = "text", placeholder, multiline }: {
  icon: typeof Type; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean;
}) => (
  <div>
    <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5 mb-1">
      <Icon className="w-3 h-3" /> {label}
    </label>
    {multiline ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50 resize-none" />
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50" />
    )}
  </div>
);

/* ── Template Variables Badge ── */
const TemplateVarsHelp = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors">
        <Info className="w-3 h-3" /> Variáveis disponíveis
      </button>
      {open && (
        <div className="absolute z-20 top-6 left-0 bg-card border border-border/40 rounded-lg p-3 shadow-xl min-w-[260px] animate-fade-in">
          <p className="text-[10px] font-mono text-muted-foreground/60 mb-2">Use no título, descrição, footer ou quote:</p>
          <div className="space-y-1">
            {TEMPLATE_VARS.map((v) => (
              <div key={v.var} className="flex items-center gap-2 text-[10px] font-mono">
                <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">{v.var}</code>
                <span className="text-muted-foreground/50">{v.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Webhook Card ── */
const WebhookCard = ({ webhook, status, result, isEditing, onToggleEdit, onSend, onUpdate, onUpdatePayload, onUpdateEmbed }: {
  webhook: WebhookConfig; status: TestStatus; result?: string; isEditing: boolean;
  onToggleEdit: () => void; onSend: () => void;
  onUpdate: (id: string, u: Partial<WebhookConfig>) => void;
  onUpdatePayload: (id: string, f: string, v: unknown) => void;
  onUpdateEmbed: (id: string, f: keyof EmbedConfig, v: string) => void;
}) => {
  const Icon = webhook.icon;
  const [tab, setTab] = useState<"embed" | "payload" | "json">("embed");
  const [rawJson, setRawJson] = useState("");

  const openJsonTab = () => {
    const fullConfig = {
      embed: webhook.embed,
      payload: webhook.payload,
    };
    setRawJson(JSON.stringify(fullConfig, null, 2));
    setTab("json");
  };

  const saveJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed.embed) {
        onUpdate(webhook.id, { embed: { ...webhook.embed, ...parsed.embed } });
      }
      if (parsed.payload) {
        onUpdate(webhook.id, { payload: { ...webhook.payload, ...parsed.payload } });
      }
      setTab("embed");
      toast.success("Configuração atualizada!");
    } catch {
      toast.error("JSON inválido");
    }
  };

  return (
    <div className={cn("bg-card/60 backdrop-blur-xl border rounded-xl transition-all",
      webhook.enabled ? "border-border/30" : "border-border/15 opacity-50", isEditing && "border-primary/30")}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn("mt-0.5 shrink-0", webhook.color)}><Icon className="w-4 h-4" /></div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-mono font-semibold text-foreground">{webhook.label}</h3>
          <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">{webhook.description}</p>
          {result && <p className={cn("text-[10px] font-mono mt-1.5", status === "success" ? "text-success" : "text-destructive")}>{result}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onToggleEdit} className={cn("rounded-lg w-8 h-8 flex items-center justify-center transition-all border",
            isEditing ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40")}>
            {isEditing ? <ChevronUp className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onSend} disabled={status === "loading" || !webhook.enabled}
            className={cn("shrink-0 rounded-lg w-8 h-8 flex items-center justify-center transition-all border",
              !webhook.enabled ? "bg-muted/10 border-border/15 text-muted-foreground/30 cursor-not-allowed" :
              status === "loading" ? "bg-muted/30 border-border/30 cursor-not-allowed" :
              status === "success" ? "bg-success/10 border-success/30 text-success" :
              status === "error" ? "bg-destructive/10 border-destructive/30 text-destructive" :
              "bg-muted/20 border-border/30 text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary")}>
            {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
             status === "success" ? <CheckCircle className="w-3.5 h-3.5" /> :
             status === "error" ? <XCircle className="w-3.5 h-3.5" /> :
             <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {isEditing && (
        <div className="border-t border-border/20 animate-fade-in">
          {/* Tabs + toggle */}
          <div className="px-4 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-muted/20 rounded-lg p-0.5">
              <button onClick={() => setTab("embed")} className={cn("text-[10px] font-mono px-3 py-1.5 rounded-md transition-all",
                tab === "embed" ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground/50 hover:text-foreground")}>
                <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> Embed</span>
              </button>
              <button onClick={() => setTab("payload")} className={cn("text-[10px] font-mono px-3 py-1.5 rounded-md transition-all",
                tab === "payload" ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground/50 hover:text-foreground")}>
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Payload</span>
              </button>
              <button onClick={openJsonTab} className={cn("text-[10px] font-mono px-3 py-1.5 rounded-md transition-all",
                tab === "json" ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground/50 hover:text-foreground")}>
                <span className="flex items-center gap-1"><Code className="w-3 h-3" /> JSON</span>
              </button>
            </div>
            <button onClick={() => onUpdate(webhook.id, { enabled: !webhook.enabled })}
              className={cn("flex items-center gap-1.5 text-[10px] font-mono font-semibold px-3 py-1.5 rounded-lg border transition-all",
                webhook.enabled ? "bg-success/10 border-success/20 text-success" : "bg-muted/20 border-border/30 text-muted-foreground")}>
              <Power className="w-3 h-3" /> {webhook.enabled ? "Ativo" : "Off"}
            </button>
          </div>

          <div className="px-4 py-3 space-y-3">
            {tab === "embed" ? (
              <>
                {/* Template vars helper */}
                <TemplateVarsHelp />

                {/* Avatar preview + URL */}
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <ImageIcon className="w-3 h-3" /> Avatar do Bot
                  </label>
                  <div className="flex items-center gap-3">
                    <img src={webhook.embed.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full border border-border/30 bg-muted/20 object-cover" />
                    <input type="text" value={webhook.embed.avatarUrl} onChange={(e) => onUpdateEmbed(webhook.id, "avatarUrl", e.target.value)}
                      placeholder="URL do avatar"
                      className="flex-1 bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50" />
                  </div>
                </div>
                <FieldRow icon={User} label="Nome do Bot" value={webhook.embed.botName} onChange={(v) => onUpdateEmbed(webhook.id, "botName", v)} />
                <FieldRow icon={Type} label="Título do Embed" value={webhook.embed.embedTitle} onChange={(v) => onUpdateEmbed(webhook.id, "embedTitle", v)} placeholder="🔔 | Título aqui — suporta {user}" />
                <FieldRow icon={MessageSquare} label="Descrição do Embed" value={webhook.embed.embedDescription} onChange={(v) => onUpdateEmbed(webhook.id, "embedDescription", v)} placeholder="**{user}** | 🔥 **{number_session} sessões**" multiline />
                <FieldRow icon={MessageSquare} label="Texto de Citação" value={webhook.embed.quoteText} onChange={(v) => onUpdateEmbed(webhook.id, "quoteText", v)} placeholder="{random_quote}" />
                <FieldRow icon={MessageSquare} label="Footer" value={webhook.embed.footerText} onChange={(v) => onUpdateEmbed(webhook.id, "footerText", v)} placeholder="Pixel Planner" />
                <FieldRow icon={ImageIcon} label="Thumbnail URL" value={webhook.embed.thumbnailUrl} onChange={(v) => onUpdateEmbed(webhook.id, "thumbnailUrl", v)} />

                {/* Color picker */}
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Palette className="w-3 h-3" /> Cor da Barra Lateral
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={webhook.embed.embedColor} onChange={(e) => onUpdateEmbed(webhook.id, "embedColor", e.target.value)}
                      className="w-8 h-8 rounded-lg border border-border/30 cursor-pointer bg-transparent" />
                    <input type="text" value={webhook.embed.embedColor} onChange={(e) => onUpdateEmbed(webhook.id, "embedColor", e.target.value)}
                      className="flex-1 bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50" />
                    <div className="w-16 h-8 rounded-lg border border-border/30" style={{ backgroundColor: webhook.embed.embedColor }} />
                  </div>
                </div>

                {/* userName in payload */}
                <FieldRow icon={User} label="userName (no payload)" value={(webhook.payload.userName as string) || ""} onChange={(v) => onUpdatePayload(webhook.id, "userName", v)} />
              </>
            ) : tab === "payload" ? (
              <>
                <FieldRow icon={Type} label="Label" value={webhook.label} onChange={(v) => onUpdate(webhook.id, { label: v })} />
                <FieldRow icon={MessageSquare} label="Descrição" value={webhook.description} onChange={(v) => onUpdate(webhook.id, { description: v })} />
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-1 block">Payload JSON (read-only)</label>
                  <pre className="bg-background/40 border border-border/20 rounded-lg px-3 py-2 text-[10px] font-mono text-muted-foreground/70 overflow-x-auto max-h-32 scrollbar-hidden">
                    {JSON.stringify(webhook.payload, null, 2)}
                  </pre>
                  <p className="text-[9px] font-mono text-muted-foreground/40 mt-1">Use a aba JSON para editar o payload completo</p>
                </div>
              </>
            ) : (
              /* JSON tab - edit embed + payload together */
              <>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3 h-3" /> Configuração Completa (JSON)
                  </label>
                  <div className="flex gap-2">
                    <button onClick={saveJson} className="text-[10px] font-mono text-success hover:underline font-semibold">Salvar</button>
                    <button onClick={() => setTab("embed")} className="text-[10px] font-mono text-muted-foreground hover:underline">Cancelar</button>
                  </div>
                </div>
                <textarea value={rawJson} onChange={(e) => setRawJson(e.target.value)} rows={14}
                  className="w-full bg-background/80 border border-border/30 rounded-lg px-3 py-2 text-[11px] font-mono text-foreground focus:outline-none focus:border-primary/50 resize-none" />
                <TemplateVarsHelp />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookDashboard;
