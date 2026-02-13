import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PomodoroPayload {
  type: "pomodoro";
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

      embed = {
        title: "<:sininho:1200187032308293662> Pomodoro Finalizado!",
        description:
          `**${modeLabels[payload.mode] || payload.mode}** concluído! <a:estrela_gif:1089377048579022888>\n\n` +
          `**${payload.userName || "Anônimo"}** | <a:orange_fire:1323543791533162576> **${payload.sessions || 0} sessões**\n\n` +
          (payload.mode === "focus"
            ? "Hora de descansar! <:coffe:1471922341511430398>"
            : "Hora de voltar ao foco!"),
        color: modeColors[payload.mode] || 0x0033ff,
        thumbnail: { url: ICON_URL },
        footer: {
          text: "Continue sendo produtivo!",
        },
        timestamp: new Date().toISOString(),
      };
    } else if (payload.type === "task_reminder") {
      const typeConfig: Record<
        string,
        { title: string; color: number; emoji: string; footer: string }
      > = {
        before_deadline: {
          title: "<:sininho:1200187032308293662> Atividades Vencendo em 30min!",
          color: 0xffa500,
          emoji: "<a:orange_fire:1323543791533162576>",
          footer: "Lembrete de prazo",
        },
        overdue_1: {
          title: "<:sininho:1200187032308293662> Atividades Atrasadas! (1º Aviso)",
          color: 0xff6347,
          emoji: "<a:orange_fire:1323543791533162576>",
          footer: "1º aviso",
        },
        overdue_2: {
          title: "<:sininho:1200187032308293662> Atividades Atrasadas! (2º Aviso)",
          color: 0xff0000,
          emoji: "<a:orange_fire:1323543791533162576>",
          footer: "2º aviso",
        },
        overdue_3: {
          title: "<:sininho:1200187032308293662> ÚLTIMO AVISO!",
          color: 0x8b0000,
          emoji: "<a:orange_fire:1323543791533162576>",
          footer: "Último aviso",
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
        description: `**${payload.userName || "Anônimo"}**\n\n${taskList}`,
        color: config.color,
        thumbnail: { url: ICON_URL },
        footer: {
          text: "Continue sendo produtivo!",
        },
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
        avatar_url: ICON_URL,
        embeds: [embed],
      }),
    });

    if (!discordRes.ok) {
      const errorText = await discordRes.text();
      throw new Error(
        `Discord webhook failed [${discordRes.status}]: ${errorText}`
      );
    }

    // Discord returns 204 No Content on success
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
