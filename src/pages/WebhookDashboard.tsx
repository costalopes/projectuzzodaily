import { useState } from "react";
import { ArrowLeft, Send, CheckCircle, XCircle, Loader2, Zap, Bell, Timer, AlertTriangle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WebhookTest {
  id: string;
  label: string;
  description: string;
  icon: typeof Timer;
  color: string;
  payload: Record<string, unknown>;
}

const WEBHOOK_TESTS: WebhookTest[] = [
  {
    id: "pomodoro_start_focus",
    label: "Timer Iniciado (Foco)",
    description: "Notifica início de sessão de foco de 25min",
    icon: Timer,
    color: "text-primary",
    payload: { type: "pomodoro", event: "start", mode: "focus", sessions: 2, userName: "Teste Dashboard" },
  },
  {
    id: "pomodoro_end_focus",
    label: "Pomodoro Finalizado (Foco)",
    description: "Notifica conclusão de sessão de foco",
    icon: CheckCircle,
    color: "text-success",
    payload: { type: "pomodoro", event: "end", mode: "focus", sessions: 3, userName: "Teste Dashboard" },
  },
  {
    id: "pomodoro_transition_short",
    label: "Transição → Pausa Curta",
    description: "Notifica início automático de pausa curta",
    icon: Zap,
    color: "text-accent",
    payload: { type: "pomodoro", event: "transition", mode: "short", sessions: 3, userName: "Teste Dashboard" },
  },
  {
    id: "pomodoro_transition_long",
    label: "Transição → Descanso Longo",
    description: "Notifica início automático de descanso longo",
    icon: Zap,
    color: "text-blue-400",
    payload: { type: "pomodoro", event: "transition", mode: "long", sessions: 4, userName: "Teste Dashboard" },
  },
  {
    id: "pomodoro_start_short",
    label: "Timer Iniciado (Pausa)",
    description: "Notifica início de pausa curta de 5min",
    icon: Timer,
    color: "text-success",
    payload: { type: "pomodoro", event: "start", mode: "short", sessions: 3, userName: "Teste Dashboard" },
  },
  {
    id: "task_before_deadline",
    label: "Atividades Vencendo (30min)",
    description: "Lembrete de tarefas prestes a vencer",
    icon: Bell,
    color: "text-primary",
    payload: {
      type: "task_reminder",
      reminderType: "before_deadline",
      tasks: [
        { title: "Estudar React", deadline: new Date(Date.now() + 1800000).toISOString() },
        { title: "Entregar relatório", deadline: new Date(Date.now() + 3600000).toISOString() },
      ],
      userName: "Teste Dashboard",
    },
  },
  {
    id: "task_overdue_1",
    label: "Atividades Atrasadas (1º Aviso)",
    description: "Primeiro aviso de tarefas atrasadas",
    icon: AlertTriangle,
    color: "text-accent",
    payload: {
      type: "task_reminder",
      reminderType: "overdue_1",
      tasks: [{ title: "Finalizar projeto", deadline: new Date(Date.now() - 3600000).toISOString() }],
      userName: "Teste Dashboard",
    },
  },
  {
    id: "task_overdue_3",
    label: "ÚLTIMO AVISO!",
    description: "Terceiro e último aviso de tarefas atrasadas",
    icon: Flame,
    color: "text-destructive",
    payload: {
      type: "task_reminder",
      reminderType: "overdue_3",
      tasks: [{ title: "Deploy urgente!", deadline: new Date(Date.now() - 7200000).toISOString() }],
      userName: "Teste Dashboard",
    },
  },
];

type TestStatus = "idle" | "loading" | "success" | "error";

const WebhookDashboard = () => {
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [lastResults, setLastResults] = useState<Record<string, string>>({});
  const [sendingAll, setSendingAll] = useState(false);

  const sendWebhook = async (test: WebhookTest) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      toast.error("Supabase não configurado");
      return;
    }

    setStatuses((p) => ({ ...p, [test.id]: "loading" }));

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/discord-notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(test.payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatuses((p) => ({ ...p, [test.id]: "success" }));
        setLastResults((p) => ({ ...p, [test.id]: "✓ Enviado com sucesso" }));
        toast.success(`${test.label} enviado!`);
      } else {
        setStatuses((p) => ({ ...p, [test.id]: "error" }));
        setLastResults((p) => ({ ...p, [test.id]: data.error || "Erro desconhecido" }));
        toast.error(`Falha: ${data.error || "Erro"}`);
      }
    } catch (err) {
      setStatuses((p) => ({ ...p, [test.id]: "error" }));
      setLastResults((p) => ({ ...p, [test.id]: String(err) }));
      toast.error("Erro de rede");
    }

    setTimeout(() => {
      setStatuses((p) => ({ ...p, [test.id]: "idle" }));
    }, 3000);
  };

  const sendAll = async () => {
    setSendingAll(true);
    for (const test of WEBHOOK_TESTS) {
      await sendWebhook(test);
      await new Promise((r) => setTimeout(r, 800));
    }
    setSendingAll(false);
  };

  const successCount = Object.values(statuses).filter((s) => s === "success").length;
  const errorCount = Object.values(statuses).filter((s) => s === "error").length;

  return (
    <div className="h-screen overflow-hidden relative flex flex-col bg-background">
      {/* Subtle background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
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
                  // teste de notificações discord
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats */}
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

              <button
                onClick={sendAll}
                disabled={sendingAll}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all",
                  "bg-primary text-primary-foreground hover:opacity-90 shadow-lg",
                  sendingAll && "opacity-50 cursor-not-allowed"
                )}
              >
                {sendingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {sendingAll ? "Enviando..." : "Enviar Todos"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden">
          <div className="max-w-5xl mx-auto px-6 py-6">
            {/* Section: Pomodoro */}
            <div className="mb-6">
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-mono mb-3 flex items-center gap-2">
                <Timer className="w-3 h-3" /> Pomodoro Notifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {WEBHOOK_TESTS.filter((t) => t.payload.type === "pomodoro").map((test) => (
                  <WebhookCard key={test.id} test={test} status={statuses[test.id] || "idle"} result={lastResults[test.id]} onSend={() => sendWebhook(test)} />
                ))}
              </div>
            </div>

            {/* Section: Task Reminders */}
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-mono mb-3 flex items-center gap-2">
                <Bell className="w-3 h-3" /> Task Reminders
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {WEBHOOK_TESTS.filter((t) => t.payload.type === "task_reminder").map((test) => (
                  <WebhookCard key={test.id} test={test} status={statuses[test.id] || "idle"} result={lastResults[test.id]} onSend={() => sendWebhook(test)} />
                ))}
              </div>
            </div>

            {/* Payload Preview */}
            <div className="mt-8 mb-4">
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-mono mb-3">
                // endpoint
              </h2>
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
  test,
  status,
  result,
  onSend,
}: {
  test: WebhookTest;
  status: TestStatus;
  result?: string;
  onSend: () => void;
}) => {
  const Icon = test.icon;

  return (
    <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl p-4 flex items-start gap-3 group hover:border-border/50 transition-all">
      <div className={cn("mt-0.5 shrink-0", test.color)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-mono font-semibold text-foreground">{test.label}</h3>
        <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">{test.description}</p>
        {result && (
          <p className={cn("text-[10px] font-mono mt-1.5", status === "success" ? "text-success" : "text-destructive")}>
            {result}
          </p>
        )}
      </div>

      <button
        onClick={onSend}
        disabled={status === "loading"}
        className={cn(
          "shrink-0 rounded-lg w-9 h-9 flex items-center justify-center transition-all border",
          status === "loading"
            ? "bg-muted/30 border-border/30 cursor-not-allowed"
            : status === "success"
              ? "bg-success/10 border-success/30 text-success"
              : status === "error"
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
        )}
      >
        {status === "loading" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : status === "success" ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : status === "error" ? (
          <XCircle className="w-3.5 h-3.5" />
        ) : (
          <Send className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};

export default WebhookDashboard;
