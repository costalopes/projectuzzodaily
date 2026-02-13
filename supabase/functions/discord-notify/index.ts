import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PomodoroPayload {
  type: "pomodoro";
  event: "start" | "end" | "transition";
  mode: "focus" | "short" | "long";
  sessions: number;
  userName: string;
}

interface TaskReminderPayload {
  type: "task_reminder";
  reminderType: "before_deadline" | "overdue_1" | "overdue_2" | "overdue_3";
  tasks: { title: string; deadline?: string }[];
  userName: string;
}

type NotifyPayload = PomodoroPayload | TaskReminderPayload;

const ICON_URL =
  "https://shziwwccvpxtdjvbmrab.supabase.co/storage/v1/object/public/webhook-assets/iconpomodoro.png";
const AVATAR_URL =
  "https://shziwwccvpxtdjvbmrab.supabase.co/storage/v1/object/public/webhook-assets/avatar.png";

const MOTIVATIONAL_PHRASES = [
  "Cada pomodoro te aproxima do seu objetivo.",
  "Disciplina supera motivação.",
  "Pequenos passos, grandes resultados.",
  "Foco é um superpoder.",
  "Você está construindo algo incrível.",
  "Consistência é a chave do sucesso.",
  "Um passo de cada vez, sempre em frente.",
  "Seu futuro eu agradece o esforço de hoje.",
  "Grandes conquistas começam com pequenos hábitos.",
  "Produtividade não é pressa, é constância.",
  "Cada minuto focado conta.",
  "Você está mais perto do que imagina.",
  "O segredo é não parar.",
  "Transforme esforço em resultado.",
  "Hoje é dia de progresso.",
  "Continue, o resultado vem.",
  "A jornada importa tanto quanto o destino.",
  "Foco no processo, não no resultado.",
  "Você já está fazendo mais do que ontem.",
  "Determinação move montanhas.",
  "Cada sessão é uma vitória.",
  "Seu compromisso inspira.",
  "Menos distração, mais ação.",
  "O tempo investido nunca é perdido.",
  "Você está no caminho certo.",
  "Acredite no seu ritmo.",
  "Progresso, não perfeição.",
  "A constância vence o talento.",
  "Sua dedicação faz a diferença.",
  "Mantenha o ritmo, colha os frutos.",
  "Foque no que importa.",
  "Um pomodoro por vez muda tudo.",
  "Você é mais forte do que pensa.",
  "O melhor momento para agir é agora.",
  "Produtividade é um hábito, não um evento.",
  "Sua persistência é admirável.",
  "Construa o hábito, o sucesso segue.",
  "Cada ciclo é uma conquista.",
  "Não desista, descanse e volte.",
  "O foco de hoje é o sucesso de amanhã.",
  "Você está evoluindo a cada sessão.",
  "Menos pensar, mais fazer.",
  "A excelência é um hábito diário.",
  "Confie no processo.",
  "Sua energia está sendo bem investida.",
  "O esforço silencioso traz resultados barulhentos.",
  "Continue empilhando vitórias.",
  "Você escolheu ser produtivo. Isso já é muito.",
  "A magia acontece fora da zona de conforto.",
  "Respire fundo e continue brilhando.",
];

const getRandomPhrase = () =>
  MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");
    if (!WEBHOOK_URL) {
      throw new Error("DISCORD_WEBHOOK_URL is not configured");
    }

    const payload: NotifyPayload = await req.json();

    let embed: Record<string, unknown>;

    if (payload.type === "pomodoro") {
      const modeLabels: Record<string, string> = {
        focus: "Foco",
        short: "Pausa Curta",
        long: "Descanso Longo",
      };
      const modeColors: Record<string, number> = {
        focus: 0xff6347,
        short: 0x4caf50,
        long: 0x2196f3,
      };

      const isStart = payload.event === "start";
      const isTransition = payload.event === "transition";

      if (isStart) {
        const durationLabels: Record<string, string> = {
          focus: "25 minutos",
          short: "5 minutos",
          long: "15 minutos",
        };
        embed = {
          title: "<:sininho:1200187032308293662> Timer Iniciado!",
          description:
            `**${modeLabels[payload.mode]}** iniciado! (${durationLabels[payload.mode]})\n\n` +
            `**${payload.userName || "Anônimo"}** | <a:orange_fire:1323543791533162576> **${payload.sessions || 0} sessões**\n\n` +
            `*${getRandomPhrase()}*`,
          color: modeColors[payload.mode] || 0x0033ff,
          thumbnail: { url: ICON_URL },
          timestamp: new Date().toISOString(),
        };
      } else if (isTransition) {
        const transitionMessages: Record<string, string> = {
          focus: "Iniciando Foco! Você consegue! 🚀",
          short: "Pausa merecida! Descanse um pouco 😌",
          long: "Descanso longo! Aproveita para recarregar as energias ⚡",
        };
        embed = {
          title: "<:sininho:1200187032308293662> Próxima Sessão!",
          description:
            `**${payload.userName || "Anônimo"}** | <a:orange_fire:1323543791533162576> **${payload.sessions || 0} sessões**\n\n` +
            `**${modeLabels[payload.mode]}** — ${transitionMessages[payload.mode]}\n\n` +
            `*${getRandomPhrase()}*`,
          color: modeColors[payload.mode] || 0x0033ff,
          thumbnail: { url: ICON_URL },
          timestamp: new Date().toISOString(),
        };
      } else {
        embed = {
          title: "<:sininho:1200187032308293662> Pomodoro Finalizado!",
          description:
            `**${modeLabels[payload.mode]}** concluído! <a:estrela_gif:1089377048579022888>\n\n` +
            `**${payload.userName || "Anônimo"}** | <a:orange_fire:1323543791533162576> **${payload.sessions || 0} sessões**\n\n` +
            (payload.mode === "focus"
              ? "`Hora de descansar!` <:coffe:1471922341511430398>\n\n"
              : "`Hora de voltar ao foco!`\n\n") +
            `*${getRandomPhrase()}*`,
          color: modeColors[payload.mode] || 0x0033ff,
          thumbnail: { url: ICON_URL },
          timestamp: new Date().toISOString(),
        };
      }
    } else if (payload.type === "task_reminder") {
      const typeConfig: Record<
        string,
        { title: string; color: number; emoji: string }
      > = {
        before_deadline: {
          title: "<:sininho:1200187032308293662> Atividades Vencendo em 30min!",
          color: 0xffa500,
          emoji: "<a:orange_fire:1323543791533162576>",
        },
        overdue_1: {
          title: "<:sininho:1200187032308293662> Atividades Atrasadas! (1º Aviso)",
          color: 0xff6347,
          emoji: "<a:orange_fire:1323543791533162576>",
        },
        overdue_2: {
          title: "<:sininho:1200187032308293662> Atividades Atrasadas! (2º Aviso)",
          color: 0xff0000,
          emoji: "<a:orange_fire:1323543791533162576>",
        },
        overdue_3: {
          title: "<:sininho:1200187032308293662> ÚLTIMO AVISO!",
          color: 0x8b0000,
          emoji: "<a:orange_fire:1323543791533162576>",
        },
      };

      const config = typeConfig[payload.reminderType] || typeConfig.overdue_1;
      const taskList = payload.tasks
        .map((t, i) => {
          const dl = t.deadline
            ? new Date(t.deadline).toLocaleString("pt-BR")
            : "sem prazo";
          return `${config.emoji} **${i + 1}.** ${t.title} — *${dl}*`;
        })
        .join("\n");

      embed = {
        title: config.title,
        description: `**${payload.userName || "Anônimo"}**\n\n${taskList}\n\n*${getRandomPhrase()}*`,
        color: config.color,
        thumbnail: { url: ICON_URL },
        timestamp: new Date().toISOString(),
      };
    } else {
      throw new Error("Invalid payload type");
    }

    const discordRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Layla | Pixel Planner",
        avatar_url: AVATAR_URL,
        embeds: [embed],
      }),
    });

    if (!discordRes.ok) {
      const errorText = await discordRes.text();
      throw new Error(
        `Discord webhook failed [${discordRes.status}]: ${errorText}`
      );
    }

    await discordRes.text().catch(() => {});

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending Discord notification:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
