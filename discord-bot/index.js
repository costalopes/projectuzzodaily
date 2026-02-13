const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
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
const NOTIFICATION_CHANNEL_ID = process.env.NOTIFICATION_CHANNEL_ID || "1471733666014298257";
const API_PORT = process.env.API_PORT || 3001;
const API_SECRET = process.env.API_SECRET || "meu-segredo-123";
const PREFIX = "!";

const FOOTER_LOGO = "https://rfajiyedyqalhnkzocfp.supabase.co/storage/v1/object/public/product-images/webhook/footer-logo.png";
const VOICE_THUMB = "https://royal-art-glow.lovable.app/images/voice-ticket-thumb.gif";
const ABSENCE_TIMEOUT_MS = 10_000;

const STATUS_MESSAGES = [
  "suporte ao vivo 🎧", "uzzosolutions.com 🚀", "os melhores preços do mercado 💰",
  "feita com ❤️ pelo Pedrinho", "precisa de ajuda? entre no canal!",
  "soluções digitais sob medida ✨", "atendimento humanizado 🤝",
  "sua ideia, nossa solução 💡", "streaming, licenças e mais 🎮",
  "peça seu orçamento sem compromisso 📋",
];
let statusIndex = 0;

if (!BOT_TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN não definido.");
  process.exit(1);
}

const activeTickets = new Map();

// ─── ESTADO DO GATO (em memória, sincroniza com o app) ───
let catState = {
  name: "Mimi",
  color: "#9b87f5",
  happiness: 80,
  energy: 70,
  mood: "idle",
  lastFed: Date.now(),
  lastPet: Date.now(),
};

// Fila de ações pendentes do Discord → App
const pendingActions = [];

// ─── CANVAS DO GATO ──────────────────────────────────────
async function generateCatCanvas(state) {
  const w = 400, h = 300;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // Fundo
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(1, "#16213e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Estrelas
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  for (let i = 0; i < 30; i++) {
    const sx = Math.random() * w, sy = Math.random() * h * 0.6;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chão
  ctx.fillStyle = "#2a2a4a";
  ctx.fillRect(0, h - 50, w, 50);

  const cx = w / 2, cy = h - 100;
  const color = state.color || "#9b87f5";

  // Corpo
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 45, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cabeça
  ctx.beginPath();
  ctx.arc(cx, cy - 45, 30, 0, Math.PI * 2);
  ctx.fill();

  // Orelhas
  ctx.beginPath();
  ctx.moveTo(cx - 22, cy - 65);
  ctx.lineTo(cx - 12, cy - 90);
  ctx.lineTo(cx - 2, cy - 65);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 65);
  ctx.lineTo(cx + 12, cy - 90);
  ctx.lineTo(cx + 22, cy - 65);
  ctx.fill();

  // Orelhas internas
  ctx.fillStyle = "#ffb6c1";
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 67);
  ctx.lineTo(cx - 12, cy - 82);
  ctx.lineTo(cx - 6, cy - 67);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 67);
  ctx.lineTo(cx + 12, cy - 82);
  ctx.lineTo(cx + 18, cy - 67);
  ctx.fill();

  // Olhos (mudam conforme humor)
  ctx.fillStyle = "#fff";
  if (state.mood === "sleeping" || state.energy < 20) {
    // Olhos fechados (linhas)
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 45);
    ctx.lineTo(cx - 5, cy - 45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 5, cy - 45);
    ctx.lineTo(cx + 15, cy - 45);
    ctx.stroke();
  } else {
    // Olhos abertos
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 47, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 10, cy - 47, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pupilas
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 46, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 46, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Brilho
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 48, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 12, cy - 48, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Boca (varia conforme humor)
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  if (state.happiness > 60) {
    // Sorriso
    ctx.beginPath();
    ctx.arc(cx, cy - 35, 6, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else if (state.happiness < 30) {
    // Triste
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 6, 1.1 * Math.PI, 1.9 * Math.PI);
    ctx.stroke();
  } else {
    // Neutro
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 35);
    ctx.lineTo(cx + 5, cy - 35);
    ctx.stroke();
  }

  // Bigodes
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  [-1, 1].forEach(side => {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 15, cy - 38 + i * 5);
      ctx.lineTo(cx + side * 40, cy - 42 + i * 7);
      ctx.stroke();
    }
  });

  // Rabo
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + 40, cy);
  ctx.quadraticCurveTo(cx + 65, cy - 30, cx + 55, cy - 55);
  ctx.stroke();

  // Patinhas
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx - 20, cy + 30, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 20, cy + 30, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Itens conforme humor
  if (state.mood === "eating" || state.happiness < 30) {
    // Tigela de comida
    ctx.fillStyle = "#e8d5b7";
    ctx.beginPath();
    ctx.ellipse(cx + 60, cy + 25, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c4a67a";
    ctx.beginPath();
    ctx.ellipse(cx + 60, cy + 25, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "12px sans-serif";
    ctx.fillText("🐟", cx + 54, cy + 20);
  }

  // Balão de fala
  let bubble = "";
  if (state.happiness < 20) bubble = "Tô com fome... 😿";
  else if (state.energy < 20) bubble = "zzZ... 💤";
  else if (state.mood === "eating") bubble = "Nhom nhom! 🐟";
  else if (state.happiness > 80) bubble = "Purr~ 💜";

  if (bubble) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const bw = ctx.measureText(bubble).width + 20;
    const bx = cx - bw / 2, by = cy - 110;
    // Balão
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, 28, 8);
    ctx.fill();
    // Setinha
    ctx.beginPath();
    ctx.moveTo(cx - 5, by + 28);
    ctx.lineTo(cx, by + 36);
    ctx.lineTo(cx + 5, by + 28);
    ctx.fill();
    // Texto
    ctx.fillStyle = "#333";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(bubble, bx + 10, by + 19);
  }

  // Barras de status
  const barY = h - 40;
  // Felicidade
  ctx.fillStyle = "#444";
  ctx.fillRect(20, barY, 160, 12);
  ctx.fillStyle = state.happiness > 50 ? "#4caf50" : state.happiness > 25 ? "#ff9800" : "#f44336";
  ctx.fillRect(20, barY, (state.happiness / 100) * 160, 12);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 9px monospace";
  ctx.fillText(`❤️ ${state.happiness}%`, 25, barY + 10);

  // Energia
  ctx.fillStyle = "#444";
  ctx.fillRect(220, barY, 160, 12);
  ctx.fillStyle = state.energy > 50 ? "#2196f3" : state.energy > 25 ? "#ff9800" : "#f44336";
  ctx.fillRect(220, barY, (state.energy / 100) * 160, 12);
  ctx.fillStyle = "#fff";
  ctx.fillText(`⚡ ${state.energy}%`, 225, barY + 10);

  // Nome
  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(state.name, cx, 25);
  ctx.textAlign = "start";

  return canvas.toBuffer("image/png");
}

// ─── DISCORD CLIENT ──────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  presence: { status: "idle", activities: [{ name: "suporte", type: 3 }] },
});

// ─── EXPRESS API ─────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

function authMiddleware(req, res, next) {
  const token = req.headers["x-api-secret"];
  if (token !== API_SECRET) return res.status(401).json({ error: "Não autorizado" });
  next();
}

// POST /api/pomodoro-end — Notificação com botões interativos
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
      new ButtonBuilder()
        .setCustomId("pomo_focus")
        .setLabel("🍅 Iniciar Foco (25min)")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("pomo_short")
        .setLabel("☕ Pausa Curta (5min)")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("pomo_long")
        .setLabel("🌿 Descanso (15min)")
        .setStyle(ButtonStyle.Primary),
    );

    await channel.send({ embeds: [embed], components: [row] });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erro Pomodoro:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/task-reminder — Avisos de tarefas
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

// POST /api/cat-status — Recebe status do gato do app
app.post("/api/cat-status", authMiddleware, async (req, res) => {
  const { name, color, happiness, energy, mood } = req.body;
  catState = { ...catState, name: name || catState.name, color: color || catState.color, happiness: happiness ?? catState.happiness, energy: energy ?? catState.energy, mood: mood || catState.mood };
  res.json({ success: true, catState });
});

// POST /api/cat-hungry — Notifica que o gato está com fome
app.post("/api/cat-hungry", authMiddleware, async (req, res) => {
  const { name, happiness, energy, userName } = req.body;
  catState = { ...catState, name: name || catState.name, happiness: happiness ?? catState.happiness, energy: energy ?? catState.energy, mood: "hungry" };

  try {
    const channel = await client.channels.fetch(NOTIFICATION_CHANNEL_ID);
    const catImage = await generateCatCanvas(catState);
    const attachment = new AttachmentBuilder(catImage, { name: "cat-status.png" });

    const embed = new EmbedBuilder()
      .setTitle(`🐱 ${catState.name} está com fome!`)
      .setDescription(
        `O gatinho de **${userName || "Anônimo"}** precisa de atenção!\n\n` +
        `❤️ Felicidade: **${catState.happiness}%**\n` +
        `⚡ Energia: **${catState.energy}%**\n\n` +
        `Use \`${PREFIX}alimentar\` para dar comida!`
      )
      .setColor(0xff9800)
      .setImage("attachment://cat-status.png")
      .setFooter({ text: "Pet Virtual • Uzzo Solutions", iconURL: FOOTER_LOGO })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("cat_feed").setLabel("🐟 Alimentar").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("cat_pet").setLabel("🤗 Carinho").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("cat_status").setLabel("📊 Status").setStyle(ButtonStyle.Secondary),
    );

    await channel.send({ embeds: [embed], files: [attachment], components: [row] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pending-actions — App consulta ações feitas pelo Discord
app.get("/api/pending-actions", authMiddleware, (req, res) => {
  const actions = [...pendingActions];
  pendingActions.length = 0;
  res.json({ actions });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "online", bot: client.isReady() ? "ready" : "connecting", catState });
});

// ─── INTERAÇÕES DE BOTÃO ─────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;

  // Botões do Pomodoro
  if (id.startsWith("pomo_")) {
    const modeMap = { pomo_focus: "focus", pomo_short: "short", pomo_long: "long" };
    const mode = modeMap[id];
    const labels = { focus: "🍅 Foco (25min)", short: "☕ Pausa (5min)", long: "🌿 Descanso (15min)" };

    pendingActions.push({ type: "start_pomodoro", mode, timestamp: Date.now(), user: interaction.user.username });

    await interaction.reply({
      content: `✅ **${labels[mode]}** iniciado pelo Discord!\nO timer será sincronizado com o app.`,
      ephemeral: true,
    });
    return;
  }

  // Botões do Gato
  if (id === "cat_feed") {
    catState.happiness = Math.min(100, catState.happiness + 15);
    catState.energy = Math.min(100, catState.energy + 10);
    catState.mood = "eating";
    catState.lastFed = Date.now();
    pendingActions.push({ type: "cat_feed", timestamp: Date.now(), user: interaction.user.username });

    const catImage = await generateCatCanvas(catState);
    const attachment = new AttachmentBuilder(catImage, { name: "cat-fed.png" });

    await interaction.reply({
      content: `🐟 **${interaction.user.username}** alimentou **${catState.name}**!\n❤️ ${catState.happiness}% • ⚡ ${catState.energy}%`,
      files: [attachment],
    });
    return;
  }

  if (id === "cat_pet") {
    catState.happiness = Math.min(100, catState.happiness + 8);
    catState.mood = "happy";
    catState.lastPet = Date.now();
    pendingActions.push({ type: "cat_pet", timestamp: Date.now(), user: interaction.user.username });

    await interaction.reply({
      content: `🤗 **${interaction.user.username}** fez carinho em **${catState.name}**! Purr~ 💜\n❤️ ${catState.happiness}%`,
      ephemeral: false,
    });
    return;
  }

  if (id === "cat_status") {
    const catImage = await generateCatCanvas(catState);
    const attachment = new AttachmentBuilder(catImage, { name: "cat-status.png" });

    const embed = new EmbedBuilder()
      .setTitle(`📊 Status de ${catState.name}`)
      .setDescription(
        `❤️ Felicidade: **${catState.happiness}%** ${catState.happiness > 60 ? "😊" : catState.happiness > 30 ? "😐" : "😿"}\n` +
        `⚡ Energia: **${catState.energy}%** ${catState.energy > 60 ? "⚡" : catState.energy > 30 ? "🔋" : "🪫"}\n` +
        `🎭 Humor: **${catState.mood}**\n` +
        `🍽️ Última refeição: <t:${Math.floor(catState.lastFed / 1000)}:R>`
      )
      .setColor(0x9b87f5)
      .setImage("attachment://cat-status.png")
      .setFooter({ text: "Pet Virtual • Uzzo Solutions", iconURL: FOOTER_LOGO })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], files: [attachment], ephemeral: true });
    return;
  }
});

// ─── COMANDOS DE TEXTO (PREFIX) ──────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command === "alimentar" || command === "feed") {
    catState.happiness = Math.min(100, catState.happiness + 15);
    catState.energy = Math.min(100, catState.energy + 10);
    catState.mood = "eating";
    catState.lastFed = Date.now();
    pendingActions.push({ type: "cat_feed", timestamp: Date.now(), user: message.author.username });

    const catImage = await generateCatCanvas(catState);
    const attachment = new AttachmentBuilder(catImage, { name: "cat-fed.png" });

    await message.reply({
      content: `🐟 **${catState.name}** foi alimentado(a)! Nhom nhom~\n❤️ ${catState.happiness}% • ⚡ ${catState.energy}%`,
      files: [attachment],
    });
    return;
  }

  if (command === "gato" || command === "cat" || command === "status") {
    const catImage = await generateCatCanvas(catState);
    const attachment = new AttachmentBuilder(catImage, { name: "cat-status.png" });

    const embed = new EmbedBuilder()
      .setTitle(`🐱 ${catState.name}`)
      .setDescription(
        `❤️ Felicidade: **${catState.happiness}%**\n` +
        `⚡ Energia: **${catState.energy}%**\n` +
        `🎭 Humor: **${catState.mood}**\n` +
        `🍽️ Última refeição: <t:${Math.floor(catState.lastFed / 1000)}:R>`
      )
      .setColor(0x9b87f5)
      .setImage("attachment://cat-status.png")
      .setFooter({ text: "Pet Virtual • Uzzo Solutions", iconURL: FOOTER_LOGO })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("cat_feed").setLabel("🐟 Alimentar").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("cat_pet").setLabel("🤗 Carinho").setStyle(ButtonStyle.Primary),
    );

    await message.reply({ embeds: [embed], files: [attachment], components: [row] });
    return;
  }

  if (command === "carinho" || command === "pet") {
    catState.happiness = Math.min(100, catState.happiness + 8);
    catState.mood = "happy";
    catState.lastPet = Date.now();
    pendingActions.push({ type: "cat_pet", timestamp: Date.now(), user: message.author.username });

    await message.reply(`🤗 Você fez carinho em **${catState.name}**! Purr~ 💜\n❤️ ${catState.happiness}%`);
    return;
  }

  if (command === "help" || command === "ajuda") {
    const embed = new EmbedBuilder()
      .setTitle("📖 Comandos Disponíveis")
      .setDescription(
        `**🐱 Pet Virtual:**\n` +
        `\`${PREFIX}gato\` — Ver status do gatinho com canvas\n` +
        `\`${PREFIX}alimentar\` — Dar comida ao gatinho\n` +
        `\`${PREFIX}carinho\` — Fazer carinho no gatinho\n\n` +
        `**ℹ️ Outros:**\n` +
        `\`${PREFIX}ajuda\` — Esta mensagem`
      )
      .setColor(0x9b87f5)
      .setFooter({ text: "Uzzo Solutions", iconURL: FOOTER_LOGO });

    await message.reply({ embeds: [embed] });
    return;
  }
});

// ─── BOT READY ───────────────────────────────────────────
client.once("ready", () => {
  console.log(`✅ Layla online como ${client.user.tag}`);
  console.log(`🔔 Notificações: ${NOTIFICATION_CHANNEL_ID}`);

  function updateStatus() {
    client.user.setPresence({ status: "idle", activities: [{ name: STATUS_MESSAGES[statusIndex], type: 3 }] });
    statusIndex = (statusIndex + 1) % STATUS_MESSAGES.length;
  }
  updateStatus();
  setInterval(updateStatus, 30_000);

  app.listen(API_PORT, () => {
    console.log(`🌐 API na porta ${API_PORT}`);
    console.log(`   POST /api/pomodoro-end`);
    console.log(`   POST /api/task-reminder`);
    console.log(`   POST /api/cat-hungry`);
    console.log(`   POST /api/cat-status`);
    console.log(`   GET  /api/pending-actions`);
    console.log(`   GET  /api/health`);
  });
});

// ─── VOICE TICKETS (código original) ─────────────────────
async function getChannelCategory(guild, channelId) {
  try {
    const channel = await guild.channels.fetch(channelId);
    return channel?.parentId;
  } catch { return null; }
}

async function closeTicketByAbsence(guild, userId) {
  const ticket = activeTickets.get(userId);
  if (!ticket) return;
  activeTickets.delete(userId);

  try {
    const ch = await guild.channels.fetch(ticket.ticketChannelId);
    if (ch) { await ch.delete("Ausência."); console.log(`🗑️ Ticket ${ch.name} excluído.`); }
  } catch (err) { console.error("❌ Erro ticket:", err); }

  try {
    const user = await client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setTitle("<a:y_aviso_cdw:1282771322555994245>  Ticket Encerrado")
      .setDescription("Seu ticket foi **fechado automaticamente** por ausência.\nEntre novamente se precisar de ajuda.")
      .setColor(0xff3333).setThumbnail(FOOTER_LOGO)
      .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO }).setTimestamp();
    await user.send({ embeds: [embed] });
  } catch (err) { console.error("❌ DM ausência:", err); }
}

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (newState.member?.user?.bot) return;
  const userId = newState.member.user.id;
  const guild = newState.guild;
  const oldCh = oldState.channelId, newCh = newState.channelId;

  if (newCh === VOICE_CHANNEL_ID && oldCh !== VOICE_CHANNEL_ID) {
    const existing = activeTickets.get(userId);
    if (existing?.timeoutId) { clearTimeout(existing.timeoutId); existing.timeoutId = null; return; }
    if (existing) return;

    const user = newState.member.user;
    const displayName = newState.member.displayName || user.username;

    try {
      const allCh = await guild.channels.fetch();
      const tickets = allCh.filter(ch => ch.parentId === TICKET_CATEGORY_ID && ch.name.match(/・\d{3}$/));
      const num = String(tickets.size + 1).padStart(3, "0");
      const short = user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);

      const ticketCh = await guild.channels.create({
        name: `🎟️・${short}・${num}`, type: 0, parent: TICKET_CATEGORY_ID,
        topic: `Ticket — ${displayName}`,
        permissionOverwrites: [
          { id: guild.id, deny: ["ViewChannel"] },
          { id: user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
          { id: SUPPORT_ROLE_ID, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle("Mensagem do sistema:")
        .setDescription(`Olá, <@${user.id}>! Nosso sistema avisou a equipe. Em breve você será atendido.`)
        .setColor(0x0033ff).setThumbnail(VOICE_THUMB)
        .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO }).setTimestamp();

      await ticketCh.send({ content: `<@${user.id}>`, embeds: [embed] });
      activeTickets.set(userId, { ticketChannelId: ticketCh.id, timeoutId: null });
    } catch (err) { console.error("❌ Erro voz:", err); }
    return;
  }

  const ticket = activeTickets.get(userId);
  if (!ticket) return;

  let still = false;
  if (newCh) {
    if (newCh === VOICE_CHANNEL_ID) still = true;
    else { const p = await getChannelCategory(guild, newCh); if (p === TICKET_CATEGORY_ID) still = true; }
  }
  if (still) { if (ticket.timeoutId) { clearTimeout(ticket.timeoutId); ticket.timeoutId = null; } return; }
  if (!ticket.timeoutId) {
    ticket.timeoutId = setTimeout(() => closeTicketByAbsence(guild, userId), ABSENCE_TIMEOUT_MS);
  }
});

// ─── WELCOME ─────────────────────────────────────────────
client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;
  const guild = member.guild;
  const username = member.displayName || member.user.username;

  try {
    const embed = new EmbedBuilder()
      .setTitle("Bem-vindo(a) ao Uzzo Solutions ®!")
      .setDescription(
        `<:ios_hearthands:1261374708436304034> Olá <@${member.id}>! Que bom ter você!\n\n` +
        `Conheça <#1193519922345689118>. Ajuda? <#1260202900442058803>. 💙`
      )
      .setColor(0x0033ff)
      .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO }).setTimestamp();

    if (WELCOME_CHANNEL_ID) {
      const ch = await guild.channels.fetch(WELCOME_CHANNEL_ID);
      if (ch) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("Ver onboarding").setStyle(ButtonStyle.Link).setURL("https://royal-art-glow.lovable.app/discord/onboarding").setEmoji("📋")
        );
        await ch.send({ content: `<@${member.id}>`, embeds: [embed], components: [row] });
      }
    }
    try { await member.send({ embeds: [embed] }); } catch {}
  } catch (err) { console.error("❌ Welcome:", err); }
});

client.login(BOT_TOKEN);
