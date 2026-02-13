const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { NOTIFICATION_CHANNEL_ID, API_SECRET, FOOTER_LOGO } = require("../config");

// Fila de ações pendentes do Discord → App
const pendingActions = [];

function addPendingAction(action) {
  pendingActions.push(action);
}

function flushPendingActions() {
  const actions = [...pendingActions];
  pendingActions.length = 0;
  return actions;
}

function authMiddleware(req, res, next) {
  const token = req.headers["x-api-secret"];
  if (token !== API_SECRET) return res.status(401).json({ error: "Não autorizado" });
  next();
}

function registerRoutes(app, client) {
  // POST /api/pomodoro-end
  app.post("/api/pomodoro-end", authMiddleware, async (req, res) => {
    const { mode, sessions, userName } = req.body;
    const modeLabels = { focus: "🍅 Foco", short: "☕ Pausa Curta", long: "🌿 Descanso Longo" };
    const modeColors = { focus: 0xff6347, short: 0x4caf50, long: 0x2196f3 };

    try {
      const channel = await client.channels.fetch(NOTIFICATION_CHANNEL_ID);
      if (!channel) return res.status(404).json({ error: "Canal não encontrado" });

      const embed = new EmbedBuilder()
        .setTitle("⏰ Pomodoro Finalizado!")
        .setDescription(
          `**${modeLabels[mode] || mode}** concluído!\n\n` +
          `👤 **${userName || "Anônimo"}** • 📊 **${sessions || 0} sessões**\n\n` +
          (mode === "focus" ? "Hora de descansar! ☕" : "Hora de voltar ao foco! 🚀") +
          "\n\n⬇️ **Escolha o próximo passo:**"
        )
        .setColor(modeColors[mode] || 0x0033ff)
        .setThumbnail(FOOTER_LOGO)
        .setFooter({ text: "Pomodoro Tracker • Uzzo Solutions", iconURL: FOOTER_LOGO })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pomo_focus").setLabel("🍅 Iniciar Foco (25min)").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("pomo_short").setLabel("☕ Pausa Curta (5min)").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("pomo_long").setLabel("🌿 Descanso (15min)").setStyle(ButtonStyle.Primary),
      );

      await channel.send({ embeds: [embed], components: [row] });
      res.json({ success: true });
    } catch (err) {
      console.error("❌ Erro Pomodoro:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/task-reminder
  app.post("/api/task-reminder", authMiddleware, async (req, res) => {
    const { tasks, reminderType, userName } = req.body;
    if (!tasks?.length) return res.status(400).json({ error: "Sem tarefas" });

    const typeConfig = {
      before_deadline: { title: "⚠️ Atividades Vencendo em 30min!", color: 0xffa500, emoji: "⏳", footer: "Lembrete de prazo" },
      overdue_1: { title: "🚨 Atividades Atrasadas! (1º Aviso)", color: 0xff6347, emoji: "🔴", footer: "1º aviso" },
      overdue_2: { title: "🚨🚨 Atividades Atrasadas! (2º Aviso)", color: 0xff0000, emoji: "🔴🔴", footer: "2º aviso" },
      overdue_3: { title: "🚨🚨🚨 ÚLTIMO AVISO!", color: 0x8b0000, emoji: "🔴🔴🔴", footer: "Último aviso" },
    };
    const config = typeConfig[reminderType] || typeConfig.overdue_1;

    try {
      const channel = await client.channels.fetch(NOTIFICATION_CHANNEL_ID);
      const taskList = tasks.map((t, i) => {
        const dl = t.deadline ? new Date(t.deadline).toLocaleString("pt-BR") : "sem prazo";
        return `${config.emoji} **${i + 1}.** ${t.title} — *${dl}*`;
      }).join("\n");

      const embed = new EmbedBuilder()
        .setTitle(config.title)
        .setDescription(`👤 **${userName || "Anônimo"}**\n\n${taskList}`)
        .setColor(config.color)
        .setThumbnail(FOOTER_LOGO)
        .setFooter({ text: `${config.footer} • Uzzo Solutions`, iconURL: FOOTER_LOGO })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/pending-actions
  app.get("/api/pending-actions", authMiddleware, (req, res) => {
    res.json({ actions: flushPendingActions() });
  });

  // GET /api/health
  app.get("/api/health", (req, res) => {
    res.json({ status: "online", bot: client.isReady() ? "ready" : "connecting" });
  });
}

module.exports = { registerRoutes };
