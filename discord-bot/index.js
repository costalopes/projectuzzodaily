const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const express = require("express");
const cors = require("cors");

// Se você tiver o welcomeCard, descomente:
// const { generateWelcomeCard } = require("./welcomeCard");

// ─── CONFIG ───────────────────────────────────────────────
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const VOICE_CHANNEL_ID = "1287765464986161215";
const TICKET_CATEGORY_ID = "1211815391949492265";
const SUPPORT_ROLE_ID = "1460505179781857413";
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || "1148037098595680288";
const NOTIFICATION_CHANNEL_ID = process.env.NOTIFICATION_CHANNEL_ID || "1471733666014298257"; // Canal para notificações do Pomodoro/tarefas
const API_PORT = process.env.API_PORT || 3001;
const API_SECRET = process.env.API_SECRET || "meu-segredo-123"; // Troque por algo seguro

const FOOTER_LOGO = "https://rfajiyedyqalhnkzocfp.supabase.co/storage/v1/object/public/product-images/webhook/footer-logo.png";
const VOICE_THUMB = "https://royal-art-glow.lovable.app/images/voice-ticket-thumb.gif";
const ABSENCE_TIMEOUT_MS = 10_000;

const STATUS_MESSAGES = [
  "suporte ao vivo 🎧",
  "uzzosolutions.com 🚀",
  "os melhores preços do mercado 💰",
  "feita com ❤️ pelo Pedrinho",
  "precisa de ajuda? entre no canal!",
  "soluções digitais sob medida ✨",
  "atendimento humanizado 🤝",
  "sua ideia, nossa solução 💡",
  "streaming, licenças e mais 🎮",
  "peça seu orçamento sem compromisso 📋",
];
let statusIndex = 0;

if (!BOT_TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN não definido nas variáveis de ambiente.");
  process.exit(1);
}

const activeTickets = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
  presence: {
    status: "idle",
    activities: [{ name: "suporte", type: 3 }],
  },
});

// ─── EXPRESS API SERVER ──────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Middleware de autenticação simples
function authMiddleware(req, res, next) {
  const token = req.headers["x-api-secret"];
  if (token !== API_SECRET) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

// POST /api/pomodoro-end — Notifica que o Pomodoro acabou
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
        `**${modeLabels[mode] || mode}** concluído com sucesso!\n\n` +
        `👤 **Usuário:** ${userName || "Anônimo"}\n` +
        `📊 **Sessões completas:** ${sessions || 0}\n` +
        `⏱️ **Modo:** ${modeLabels[mode] || mode}\n\n` +
        (mode === "focus"
          ? "Hora de fazer uma pausa! Descanse um pouco. ☕"
          : "Hora de voltar ao foco! Bora produzir! 🚀")
      )
      .setColor(modeColors[mode] || 0x0033ff)
      .setThumbnail(FOOTER_LOGO)
      .setFooter({ text: "Pomodoro Tracker • Uzzo Solutions", iconURL: FOOTER_LOGO })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log(`🍅 Notificação de Pomodoro enviada (${mode})`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao enviar notificação de Pomodoro:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/task-reminder — Notifica sobre tarefas com prazo
app.post("/api/task-reminder", authMiddleware, async (req, res) => {
  const { tasks, reminderType, userName } = req.body;
  // reminderType: "before_deadline" | "overdue_1" | "overdue_2" | "overdue_3"

  if (!tasks || !tasks.length) {
    return res.status(400).json({ error: "Nenhuma tarefa informada" });
  }

  const typeConfig = {
    before_deadline: {
      title: "⚠️ Atividades Vencendo em 30 Minutos!",
      color: 0xffa500,
      emoji: "⏳",
      footer: "Lembrete de prazo",
    },
    overdue_1: {
      title: "🚨 Atividades Atrasadas! (1º Aviso)",
      color: 0xff6347,
      emoji: "🔴",
      footer: "1º aviso de atraso",
    },
    overdue_2: {
      title: "🚨🚨 Atividades Atrasadas! (2º Aviso)",
      color: 0xff0000,
      emoji: "🔴🔴",
      footer: "2º aviso de atraso",
    },
    overdue_3: {
      title: "🚨🚨🚨 Atividades Atrasadas! (Último Aviso)",
      color: 0x8b0000,
      emoji: "🔴🔴🔴",
      footer: "3º e último aviso de atraso",
    },
  };

  const config = typeConfig[reminderType] || typeConfig.overdue_1;

  try {
    const channel = await client.channels.fetch(NOTIFICATION_CHANNEL_ID);
    if (!channel) return res.status(404).json({ error: "Canal não encontrado" });

    const taskList = tasks
      .map((t, i) => {
        const deadline = t.deadline ? new Date(t.deadline).toLocaleString("pt-BR") : "sem prazo";
        return `${config.emoji} **${i + 1}.** ${t.title} — *prazo: ${deadline}*`;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle(config.title)
      .setDescription(
        `👤 **Usuário:** ${userName || "Anônimo"}\n\n` +
        `**Tarefas:**\n${taskList}\n\n` +
        (reminderType === "before_deadline"
          ? "⏰ Corre que o prazo tá chegando!"
          : reminderType === "overdue_3"
          ? "📌 Este foi o **último aviso**. Conclua suas tarefas!"
          : "⚡ Não esqueça de finalizar suas atividades!")
      )
      .setColor(config.color)
      .setThumbnail(FOOTER_LOGO)
      .setFooter({ text: `${config.footer} • Uzzo Solutions`, iconURL: FOOTER_LOGO })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log(`📋 Notificação de tarefa enviada (${reminderType}, ${tasks.length} tarefas)`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro ao enviar notificação de tarefa:", err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "online", bot: client.isReady() ? "ready" : "connecting" });
});

// ─── DISCORD BOT EVENTS ─────────────────────────────────

client.once("ready", () => {
  console.log(`✅ Layla Gateway Bot online como ${client.user.tag}`);
  console.log(`👂 Monitorando canal de voz: ${VOICE_CHANNEL_ID}`);
  console.log(`📁 Categoria de tickets: ${TICKET_CATEGORY_ID}`);
  console.log(`🔔 Canal de notificações: ${NOTIFICATION_CHANNEL_ID}`);

  function updateStatus() {
    client.user.setPresence({
      status: "idle",
      activities: [{ name: STATUS_MESSAGES[statusIndex], type: 3 }],
    });
    statusIndex = (statusIndex + 1) % STATUS_MESSAGES.length;
  }

  updateStatus();
  setInterval(updateStatus, 30_000);

  // Inicia o servidor Express após o bot estar online
  app.listen(API_PORT, () => {
    console.log(`🌐 API HTTP rodando na porta ${API_PORT}`);
    console.log(`   POST /api/pomodoro-end`);
    console.log(`   POST /api/task-reminder`);
    console.log(`   GET  /api/health`);
  });
});

async function getChannelCategory(guild, channelId) {
  try {
    const channel = await guild.channels.fetch(channelId);
    return channel?.parentId;
  } catch {
    return null;
  }
}

async function closeTicketByAbsence(guild, userId) {
  const ticket = activeTickets.get(userId);
  if (!ticket) return;
  activeTickets.delete(userId);

  try {
    const ticketChannel = await guild.channels.fetch(ticket.ticketChannelId);
    if (ticketChannel) {
      await ticketChannel.delete("Ticket fechado por ausência do usuário.");
      console.log(`🗑️ Ticket ${ticketChannel.name} excluído por ausência.`);
    }
  } catch (err) {
    console.error("❌ Erro ao excluir canal de ticket:", err);
  }

  try {
    const user = await client.users.fetch(userId);
    const dmEmbed = new EmbedBuilder()
      .setTitle("<a:y_aviso_cdw:1282771322555994245>  Ticket Encerrado")
      .setDescription(
        "Seu ticket de suporte por voz foi **fechado automaticamente** porque você saiu do canal de voz.\n\nSe ainda precisar de ajuda, entre novamente no canal de suporte por voz e um novo ticket será criado."
      )
      .setColor(0xff3333)
      .setThumbnail(FOOTER_LOGO)
      .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO })
      .setTimestamp();
    await user.send({ embeds: [dmEmbed] });
    console.log(`📩 DM de ausência enviada para ${user.username}`);
  } catch (err) {
    console.error("❌ Erro ao enviar DM de ausência:", err);
  }
}

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (newState.member?.user?.bot) return;

  const userId = newState.member.user.id;
  const guild = newState.guild;
  const oldChannelId = oldState.channelId;
  const newChannelId = newState.channelId;

  const joinedTargetChannel =
    newChannelId === VOICE_CHANNEL_ID && oldChannelId !== VOICE_CHANNEL_ID;

  if (joinedTargetChannel) {
    const existing = activeTickets.get(userId);
    if (existing?.timeoutId) {
      clearTimeout(existing.timeoutId);
      existing.timeoutId = null;
      console.log(`↩️ ${newState.member.displayName} voltou, timeout cancelado.`);
      return;
    }
    if (existing) return;

    const user = newState.member.user;
    const displayName = newState.member.displayName || user.username;
    console.log(`🎙️ ${displayName} entrou no canal de voz de suporte`);

    try {
      const allChannels = await guild.channels.fetch();
      const ticketsInCategory = allChannels.filter(
        (ch) => ch.parentId === TICKET_CATEGORY_ID && ch.name.match(/・\d{3}$/)
      );
      const ticketNumber = String(ticketsInCategory.size + 1).padStart(3, "0");

      const shortName = user.username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 5);

      const channelName = `🎟️・${shortName}・${ticketNumber}`;

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: 0,
        parent: TICKET_CATEGORY_ID,
        topic: `Ticket de suporte por voz — ${displayName}`,
        permissionOverwrites: [
          { id: guild.id, deny: ["ViewChannel"] },
          { id: user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
          { id: SUPPORT_ROLE_ID, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
        ],
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle("Mensagem do sistema:")
        .setDescription(
          `Olá, <@${user.id}>! Que bom te ver por aqui, nosso sistema já avisou nossa equipe que você está aguardando suporte, em breve vamos te transferir para o atendimento humano.`
        )
        .setColor(0x0033ff)
        .setThumbnail(VOICE_THUMB)
        .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO })
        .setTimestamp();

      await ticketChannel.send({ content: `<@${user.id}>`, embeds: [welcomeEmbed] });

      activeTickets.set(userId, { ticketChannelId: ticketChannel.id, timeoutId: null });
      console.log(`✅ Ticket ${channelName} criado para ${displayName}`);
    } catch (error) {
      console.error("❌ Erro ao processar entrada no canal de voz:", error);
    }
    return;
  }

  const ticket = activeTickets.get(userId);
  if (!ticket) return;

  let stillInSupport = false;
  if (newChannelId) {
    if (newChannelId === VOICE_CHANNEL_ID) {
      stillInSupport = true;
    } else {
      const parentId = await getChannelCategory(guild, newChannelId);
      if (parentId === TICKET_CATEGORY_ID) stillInSupport = true;
    }
  }

  if (stillInSupport) {
    if (ticket.timeoutId) {
      clearTimeout(ticket.timeoutId);
      ticket.timeoutId = null;
      console.log(`✅ ${newState.member.displayName} movido para canal de suporte, timeout cancelado.`);
    }
    return;
  }

  if (!ticket.timeoutId) {
    console.log(`⏳ ${newState.member.displayName} saiu dos canais de suporte, iniciando timeout de ${ABSENCE_TIMEOUT_MS / 1000}s...`);
    ticket.timeoutId = setTimeout(() => {
      closeTicketByAbsence(guild, userId);
    }, ABSENCE_TIMEOUT_MS);
  }
});

// ─── WELCOME CARD (guildMemberAdd) ───────────────────────
client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;

  const guild = member.guild;
  const username = member.displayName || member.user.username;
  const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256 });

  console.log(`👋 Novo membro: ${username} entrou em ${guild.name}`);

  try {
    // Se tiver o welcomeCard, descomente:
    // const cardBuffer = await generateWelcomeCard({ username, avatarURL, serverName: guild.name, memberCount: guild.memberCount });
    // const attachment = new AttachmentBuilder(cardBuffer, { name: "welcome-card.png" });

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`Bem-vindo(a) ao Uzzo Solutions ®!`)
      .setDescription(
        `<:ios_hearthands:1261374708436304034> Olá <@${member.id}>! Que bom ter você com a gente!\n\n` +
        `Recomendamos você conhecer o canal <#1193519922345689118>. ` +
        `Se precisar de ajuda, entre no canal <#1260202900442058803>. ` +
        `Estamos aqui para te ajudar! 💙`
      )
      .setColor(0x0033ff)
      // .setImage("attachment://welcome-card.png")
      .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO })
      .setTimestamp();

    if (WELCOME_CHANNEL_ID) {
      try {
        const welcomeChannel = await guild.channels.fetch(WELCOME_CHANNEL_ID);
        if (welcomeChannel) {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Ver onboarding")
              .setStyle(ButtonStyle.Link)
              .setURL("https://royal-art-glow.lovable.app/discord/onboarding")
              .setEmoji("📋")
          );
          await welcomeChannel.send({
            content: `<@${member.id}>`,
            embeds: [welcomeEmbed],
            // files: [attachment],
            components: [row],
          });
          console.log(`✅ Welcome card enviado no canal para ${username}`);
        }
      } catch (err) {
        console.error("❌ Erro ao enviar no canal de boas-vindas:", err);
      }
    }

    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`Bem-vindo(a) ao Uzzo Solutions ®!`)
        .setDescription(
          `<:ios_hearthands:1261374708436304034> Olá **${username}**! Que bom ter você com a gente!\n\n` +
          `Recomendamos você conhecer o canal **#bate-papo**. ` +
          `Se precisar de ajuda, entre no canal **#suporte**. ` +
          `Estamos aqui para te ajudar! 💙`
        )
        .setColor(0x0033ff)
        // .setImage("attachment://welcome-card.png")
        .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO })
        .setTimestamp();

      await member.send({ embeds: [dmEmbed] });
      console.log(`📩 Welcome card enviado na DM de ${username}`);
    } catch (err) {
      console.error(`⚠️ Não foi possível enviar DM para ${username} (DMs fechadas?)`, err.message);
    }
  } catch (error) {
    console.error("❌ Erro ao gerar welcome card:", error);
  }
});

client.login(BOT_TOKEN);
