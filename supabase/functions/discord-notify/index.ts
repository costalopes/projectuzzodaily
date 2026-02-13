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

const FOOTER_LOGO =
  "https://rfajiyedyqalhnkzocfp.supabase.co/storage/v1/object/public/product-images/webhook/footer-logo.png";

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
        focus: "🍅 Foco",
        short: "☕ Pausa Curta",
        long: "🌿 Descanso Longo",
      };
      const modeColors: Record<string, number> = {
        focus: 0xff6347,
        short: 0x4caf50,
        long: 0x2196f3,
      };

      embed = {
        title: "⏰ Pomodoro Finalizado!",
        description:
          `**${modeLabels[payload.mode] || payload.mode}** concluído!\n\n` +
          `👤 **${payload.userName || "Anônimo"}** • 📊 **${payload.sessions || 0} sessões**\n\n` +
          (payload.mode === "focus"
            ? "Hora de descansar! ☕"
            : "Hora de voltar ao foco! 🚀"),
        color: modeColors[payload.mode] || 0x0033ff,
        thumbnail: { url: FOOTER_LOGO },
        footer: {
          text: "Pomodoro Tracker • Uzzo Solutions",
          icon_url: FOOTER_LOGO,
        },
        timestamp: new Date().toISOString(),
      };
    } else if (payload.type === "task_reminder") {
      const typeConfig: Record<
        string,
        { title: string; color: number; emoji: string; footer: string }
      > = {
        before_deadline: {
          title: "⚠️ Atividades Vencendo em 30min!",
          color: 0xffa500,
          emoji: "⏳",
          footer: "Lembrete de prazo",
        },
        overdue_1: {
          title: "🚨 Atividades Atrasadas! (1º Aviso)",
          color: 0xff6347,
          emoji: "🔴",
          footer: "1º aviso",
        },
        overdue_2: {
          title: "🚨🚨 Atividades Atrasadas! (2º Aviso)",
          color: 0xff0000,
          emoji: "🔴🔴",
          footer: "2º aviso",
        },
        overdue_3: {
          title: "🚨🚨🚨 ÚLTIMO AVISO!",
          color: 0x8b0000,
          emoji: "🔴🔴🔴",
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
        description: `👤 **${payload.userName || "Anônimo"}**\n\n${taskList}`,
        color: config.color,
        thumbnail: { url: FOOTER_LOGO },
        footer: {
          text: `${config.footer} • Uzzo Solutions`,
          icon_url: FOOTER_LOGO,
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
        username: "Layla 🤖",
        avatar_url: FOOTER_LOGO,
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
