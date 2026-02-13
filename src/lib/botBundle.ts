import JSZip from "jszip";

// ─── BOT FILES (auto-embedded) ───────────────────────────
// Whenever you update a bot file, update the corresponding string here.

const BOT_FILES: Record<string, string> = {
  "package.json": `{
  "name": "layla-gateway-bot",
  "version": "1.0.0",
  "description": "Layla Gateway Bot - Voice channel monitoring for Uzzo Solutions",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "discord.js": "^14.16.3",
    "@napi-rs/canvas": "^0.1.65",
    "express": "^4.21.0",
    "cors": "^2.8.5"
  }
}`,

  "Dockerfile": `FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]`,

  ".dockerignore": `node_modules
npm-debug.log`,

  "config.js": `// ─── CONFIG ───────────────────────────────────────────────
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const VOICE_CHANNEL_ID = "1287765464986161215";
const TICKET_CATEGORY_ID = "1211815391949492265";
const SUPPORT_ROLE_ID = "1460505179781857413";
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || "1148037098595680288";
const NOTIFICATION_CHANNEL_ID = process.env.NOTIFICATION_CHANNEL_ID || "1471733666014298257";
const API_PORT = process.env.PORT || process.env.API_PORT || 3001;
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

module.exports = {
  BOT_TOKEN, VOICE_CHANNEL_ID, TICKET_CATEGORY_ID, SUPPORT_ROLE_ID,
  WELCOME_CHANNEL_ID, NOTIFICATION_CHANNEL_ID, API_PORT, API_SECRET,
  PREFIX, FOOTER_LOGO, VOICE_THUMB, ABSENCE_TIMEOUT_MS, STATUS_MESSAGES,
};`,

  "index.js": `const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const cors = require("cors");

const { BOT_TOKEN, API_PORT, STATUS_MESSAGES } = require("./config");
const { registerRoutes } = require("./api/routes");
const { registerInteractions } = require("./events/interactions");
const { registerCommands } = require("./events/commands");
const { registerVoiceTickets } = require("./events/voiceTickets");
const { registerWelcome } = require("./events/welcome");

// ─── VALIDAÇÃO ───────────────────────────────────────────
if (!BOT_TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN não definido.");
  process.exit(1);
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
registerRoutes(app, client);

// ─── REGISTRAR EVENTOS ──────────────────────────────────
registerInteractions(client);
registerCommands(client);
registerVoiceTickets(client);
registerWelcome(client);

// ─── BOT READY ───────────────────────────────────────────
let statusIndex = 0;
client.once("ready", () => {
  console.log(\`✅ Layla online como \${client.user.tag}\`);

  function updateStatus() {
    client.user.setPresence({ status: "idle", activities: [{ name: STATUS_MESSAGES[statusIndex], type: 3 }] });
    statusIndex = (statusIndex + 1) % STATUS_MESSAGES.length;
  }
  updateStatus();
  setInterval(updateStatus, 30_000);

  app.listen(API_PORT, () => {
    console.log(\`🌐 API na porta \${API_PORT}\`);
    console.log(\`   POST /api/pomodoro-end\`);
    console.log(\`   POST /api/task-reminder\`);
    console.log(\`   POST /api/cat-hungry\`);
    console.log(\`   POST /api/cat-status\`);
    console.log(\`   GET  /api/pending-actions\`);
    console.log(\`   GET  /api/health\`);
  });
});

client.login(BOT_TOKEN);`,

  "catState.js": `// ─── ESTADO DO GATO (em memória, sincroniza com o app) ───
let catState = {
  name: "Bartolomeu",
  color: "#3a3a4a",
  colorIdx: 2,
  happiness: 80,
  energy: 70,
  mood: "idle",
  lastFed: Date.now(),
  lastPet: Date.now(),
};

// Fila de ações pendentes do Discord → App
const pendingActions = [];

function getCatState() {
  return catState;
}

function updateCatState(updates) {
  catState = { ...catState, ...updates };
  return catState;
}

function addPendingAction(action) {
  pendingActions.push(action);
}

function flushPendingActions() {
  const actions = [...pendingActions];
  pendingActions.length = 0;
  return actions;
}

module.exports = {
  getCatState,
  updateCatState,
  addPendingAction,
  flushPendingActions,
};`,

  "catCanvas.js": `const { createCanvas } = require("@napi-rs/canvas");

// ─── PALETAS (idênticas ao site PixelCatCorner.tsx) ───────
const CAT_COLORS = [
  { name: "Laranja", fur1: "#e8a050", fur2: "#d08838", fur3: "#f0c080", stripe: "#c07028", belly: "#f8e0c0", eye: "#2a6040" },
  { name: "Cinza",   fur1: "#8a8a9a", fur2: "#6a6a7a", fur3: "#a8a8b8", stripe: "#5a5a6a", belly: "#c8c8d8", eye: "#c89020" },
  { name: "Preto",   fur1: "#3a3a4a", fur2: "#2a2a3a", fur3: "#5a5a6a", stripe: "#1a1a2a", belly: "#6a6a7a", eye: "#e0c040" },
  { name: "Branco",  fur1: "#e8e8f0", fur2: "#d0d0d8", fur3: "#f5f5ff", stripe: "#c0c0c8", belly: "#ffffff", eye: "#4080c0" },
  { name: "Malhado", fur1: "#c88040", fur2: "#a06828", fur3: "#e8b880", stripe: "#303030", belly: "#f0d8b8", eye: "#308050" },
  { name: "Siamês",  fur1: "#f0e0d0", fur2: "#d8c8b8", fur3: "#f8f0e8", stripe: "#8a6a50", belly: "#faf0e8", eye: "#4070b0" },
];

const earInner = "#f0a0a0";
const nose = "#e07080";
const pawPad = "#e89098";
const collar = "#9b87f5";
const bell = "#7c3aed";

// ─── PIXEL HELPER ─────────────────────────────────────────
function px(ctx, x, y, w, h, color, scale, opacity) {
  if (opacity !== undefined && opacity < 1) {
    ctx.globalAlpha = opacity;
  }
  ctx.fillStyle = color;
  ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
  ctx.globalAlpha = 1;
}

// ─── CANVAS DO GATO (pixel art idêntico ao site) ─────────
async function generateCatCanvas(state) {
  const SCALE = 8;
  const catW = 44, catH = 40;
  const padding = 4;
  const canvasW = (catW + padding * 2) * SCALE;
  const statusBarH = 60;
  const nameH = 40;
  const bubbleH = state.mood === "eating" || state.happiness < 20 || state.energy < 20 || state.happiness > 80 ? 50 : 0;
  const totalH = nameH + bubbleH + (catH + padding * 2) * SCALE + statusBarH;

  const canvas = createCanvas(canvasW, totalH);
  const ctx = canvas.getContext("2d");

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, totalH);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(1, "#16213e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, totalH);

  // Stars
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  for (let i = 0; i < 25; i++) {
    const sx = Math.random() * canvasW;
    const sy = Math.random() * (totalH * 0.4);
    ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, 2);
  }

  // Color index from state
  const colorIdx = state.colorIdx ?? 0;
  const c = CAT_COLORS[colorIdx] || CAT_COLORS[0];
  const isHappy = state.mood === "happy" || state.mood === "eating" || state.mood === "playing" || state.mood === "excited";
  const isSleeping = state.mood === "sleeping" || state.energy < 15;
  const isTired = state.mood === "tired" || state.mood === "lonely";

  // Offset for centering
  const ox = padding;
  const oy = padding + Math.floor((nameH + bubbleH) / SCALE);

  // ─── Name ───
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.fillText(state.name || "Miau", canvasW / 2, 28);
  ctx.textAlign = "start";

  // ─── Speech bubble ───
  let bubble = "";
  if (state.happiness < 20) bubble = "Tô com fome... 😿";
  else if (state.energy < 20) bubble = "zzZ... 💤";
  else if (state.mood === "eating") bubble = "Nhom nhom! 🐟";
  else if (state.happiness > 80) bubble = "Purr~ 💜";

  if (bubble) {
    ctx.font = "bold 14px sans-serif";
    const tw = ctx.measureText(bubble).width;
    const bx = (canvasW - tw - 20) / 2;
    const by = nameH;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const bw = tw + 20, bh = 30, r = 8;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.lineTo(bx + bw - r, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
    ctx.lineTo(bx + bw, by + bh - r);
    ctx.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
    ctx.lineTo(bx + r, by + bh);
    ctx.arcTo(bx, by + bh, bx, by + bh - r, r);
    ctx.lineTo(bx, by + r);
    ctx.arcTo(bx, by, bx + r, by, r);
    ctx.closePath();
    ctx.fill();
    // Arrow
    ctx.beginPath();
    ctx.moveTo(canvasW / 2 - 5, by + 30);
    ctx.lineTo(canvasW / 2, by + 38);
    ctx.lineTo(canvasW / 2 + 5, by + 30);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.fillText(bubble, bx + 10, by + 21);
  }

  // ─── PIXEL ART (matching site SVG exactly) ───

  // Shadow
  px(ctx, ox + 5, oy + 36, 30, 4, "rgba(0,0,0,0.15)", SCALE);

  // Tail
  px(ctx, ox + 30, oy + 24, 1, 1, c.fur2, SCALE);
  px(ctx, ox + 31, oy + 23, 1, 1, c.fur1, SCALE);
  px(ctx, ox + 32, oy + 22, 1, 1, c.fur1, SCALE);
  px(ctx, ox + 33, oy + 21, 2, 1, c.fur1, SCALE);
  px(ctx, ox + 34, oy + 20, 2, 1, c.stripe, SCALE);
  px(ctx, ox + 35, oy + 19, 2, 1, c.fur2, SCALE);
  px(ctx, ox + 36, oy + 18, 1, 1, c.stripe, SCALE);
  px(ctx, ox + 37, oy + 17, 1, 1, c.fur1, SCALE);

  // Body
  px(ctx, ox + 7, oy + 21, 25, 11, c.fur1, SCALE);
  px(ctx, ox + 8, oy + 20, 23, 1, c.fur2, SCALE);
  px(ctx, ox + 9, oy + 23, 3, 1, c.stripe, SCALE);
  px(ctx, ox + 10, oy + 25, 2, 1, c.stripe, SCALE);
  px(ctx, ox + 26, oy + 23, 3, 1, c.stripe, SCALE);
  px(ctx, ox + 27, oy + 25, 2, 1, c.stripe, SCALE);
  px(ctx, ox + 13, oy + 22, 13, 9, c.belly, SCALE);

  // Collar
  px(ctx, ox + 9, oy + 19, 21, 2, collar, SCALE);
  px(ctx, ox + 18, oy + 20, 3, 2, bell, SCALE);
  px(ctx, ox + 19, oy + 20, 1, 1, "rgba(255,255,255,0.4)", SCALE);

  // Left ear
  px(ctx, ox + 6, oy + 1, 1, 1, c.fur2, SCALE);
  px(ctx, ox + 7, oy + 0, 4, 1, c.fur2, SCALE);
  px(ctx, ox + 5, oy + 2, 1, 4, c.fur2, SCALE);
  px(ctx, ox + 6, oy + 2, 1, 3, c.fur1, SCALE);
  px(ctx, ox + 7, oy + 1, 3, 2, c.fur1, SCALE);
  px(ctx, ox + 7, oy + 2, 2, 2, earInner, SCALE);

  // Right ear
  px(ctx, ox + 27, oy + 1, 1, 1, c.fur2, SCALE);
  px(ctx, ox + 28, oy + 0, 4, 1, c.fur2, SCALE);
  px(ctx, ox + 32, oy + 2, 1, 4, c.fur2, SCALE);
  px(ctx, ox + 31, oy + 2, 1, 3, c.fur1, SCALE);
  px(ctx, ox + 28, oy + 1, 3, 2, c.fur1, SCALE);
  px(ctx, ox + 29, oy + 2, 2, 2, earInner, SCALE);

  // Head
  px(ctx, ox + 6, oy + 6, 27, 2, c.fur2, SCALE);
  px(ctx, ox + 5, oy + 8, 29, 11, c.fur1, SCALE);
  px(ctx, ox + 6, oy + 7, 25, 1, c.fur1, SCALE);
  // Stripe on forehead
  px(ctx, ox + 15, oy + 7, 1, 1, c.stripe, SCALE);
  px(ctx, ox + 16, oy + 6, 1, 2, c.stripe, SCALE);
  px(ctx, ox + 17, oy + 7, 3, 1, c.stripe, SCALE);
  px(ctx, ox + 20, oy + 6, 1, 2, c.stripe, SCALE);
  px(ctx, ox + 21, oy + 7, 1, 1, c.stripe, SCALE);
  // Cheeks
  px(ctx, ox + 6, oy + 14, 6, 4, c.fur3, SCALE);
  px(ctx, ox + 27, oy + 14, 6, 4, c.fur3, SCALE);

  // Eyes
  if (isSleeping) {
    px(ctx, ox + 10, oy + 12, 6, 1, c.eye, SCALE);
    px(ctx, ox + 22, oy + 12, 6, 1, c.eye, SCALE);
  } else if (isTired) {
    px(ctx, ox + 10, oy + 12, 6, 3, c.eye, SCALE, 0.6);
    px(ctx, ox + 10, oy + 11, 6, 2, c.fur1, SCALE);
    px(ctx, ox + 22, oy + 12, 6, 3, c.eye, SCALE, 0.6);
    px(ctx, ox + 22, oy + 11, 6, 2, c.fur1, SCALE);
  } else if (isHappy) {
    px(ctx, ox + 10, oy + 11, 6, 1, c.eye, SCALE);
    px(ctx, ox + 10, oy + 12, 1, 2, c.eye, SCALE);
    px(ctx, ox + 15, oy + 12, 1, 2, c.eye, SCALE);
    px(ctx, ox + 22, oy + 11, 6, 1, c.eye, SCALE);
    px(ctx, ox + 22, oy + 12, 1, 2, c.eye, SCALE);
    px(ctx, ox + 27, oy + 12, 1, 2, c.eye, SCALE);
  } else {
    px(ctx, ox + 10, oy + 10, 6, 5, c.eye, SCALE);
    px(ctx, ox + 11, oy + 10, 3, 2, "#ffffff", SCALE);
    px(ctx, ox + 14, oy + 13, 1, 1, "#ffffff", SCALE, 0.4);
    px(ctx, ox + 22, oy + 10, 6, 5, c.eye, SCALE);
    px(ctx, ox + 23, oy + 10, 3, 2, "#ffffff", SCALE);
    px(ctx, ox + 26, oy + 13, 1, 1, "#ffffff", SCALE, 0.4);
  }

  // Nose & mouth
  px(ctx, ox + 17, oy + 15, 4, 2, nose, SCALE);
  px(ctx, ox + 18, oy + 15, 2, 1, "#f0909a", SCALE);
  px(ctx, ox + 16, oy + 17, 1, 1, c.fur2, SCALE);
  px(ctx, ox + 21, oy + 17, 1, 1, c.fur2, SCALE);
  if (isHappy) px(ctx, ox + 17, oy + 17, 4, 1, nose, SCALE, 0.5);
  if (isTired) {
    px(ctx, ox + 17, oy + 18, 1, 1, c.fur2, SCALE, 0.4);
    px(ctx, ox + 20, oy + 18, 1, 1, c.fur2, SCALE, 0.4);
  }

  // Whiskers
  px(ctx, ox + 1, oy + 13, 8, 1, c.fur3, SCALE, 0.5);
  px(ctx, ox + 0, oy + 15, 8, 1, c.fur3, SCALE, 0.5);
  px(ctx, ox + 2, oy + 17, 7, 1, c.fur3, SCALE, 0.4);
  px(ctx, ox + 30, oy + 13, 8, 1, c.fur3, SCALE, 0.5);
  px(ctx, ox + 31, oy + 15, 8, 1, c.fur3, SCALE, 0.5);
  px(ctx, ox + 30, oy + 17, 7, 1, c.fur3, SCALE, 0.4);

  // Front paws
  px(ctx, ox + 7, oy + 32, 7, 4, c.fur1, SCALE);
  px(ctx, ox + 8, oy + 35, 5, 1, c.fur3, SCALE);
  px(ctx, ox + 9, oy + 34, 1, 1, pawPad, SCALE);
  px(ctx, ox + 11, oy + 34, 1, 1, pawPad, SCALE);
  px(ctx, ox + 25, oy + 32, 7, 4, c.fur1, SCALE);
  px(ctx, ox + 26, oy + 35, 5, 1, c.fur3, SCALE);
  px(ctx, ox + 27, oy + 34, 1, 1, pawPad, SCALE);
  px(ctx, ox + 29, oy + 34, 1, 1, pawPad, SCALE);

  // Laptop (when coding/focused/idle)
  if (!isHappy && !isSleeping && !isTired && state.mood !== "eating" && state.mood !== "playing") {
    px(ctx, ox + 14, oy + 30, 11, 2, "#444444", SCALE);
    px(ctx, ox + 13, oy + 32, 13, 1, "#555555", SCALE);
    px(ctx, ox + 15, oy + 27, 9, 3, "#222222", SCALE);
    px(ctx, ox + 16, oy + 27, 1, 1, "#66ff66", SCALE, 0.9);
    px(ctx, ox + 18, oy + 27, 3, 1, "#ffff99", SCALE, 0.7);
    px(ctx, ox + 16, oy + 28, 4, 1, "#99ccff", SCALE, 0.7);
    px(ctx, ox + 21, oy + 28, 2, 1, "#ff99cc", SCALE, 0.6);
    px(ctx, ox + 17, oy + 29, 5, 1, "#66ff66", SCALE, 0.5);
  }

  // Food bowl when eating
  if (state.mood === "eating" || state.happiness < 20) {
    px(ctx, ox + 36, oy + 33, 6, 3, "#e8d5b7", SCALE);
    px(ctx, ox + 37, oy + 34, 4, 1, "#c4a67a", SCALE);
    ctx.font = "14px sans-serif";
    ctx.fillText("🐟", (ox + 37) * SCALE, (oy + 33) * SCALE);
  }

  // ─── Status bars ───
  const barY = totalH - statusBarH + 10;
  const barW = canvasW / 2 - 30;

  // Happiness bar
  ctx.fillStyle = "#444";
  ctx.fillRect(20, barY, barW, 16);
  ctx.fillStyle = state.happiness > 50 ? "#4caf50" : state.happiness > 25 ? "#ff9800" : "#f44336";
  ctx.fillRect(20, barY, (state.happiness / 100) * barW, 16);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px monospace";
  ctx.fillText(\`❤️ \${state.happiness}%\`, 25, barY + 13);

  // Energy bar
  const barX2 = canvasW / 2 + 10;
  ctx.fillStyle = "#444";
  ctx.fillRect(barX2, barY, barW, 16);
  ctx.fillStyle = state.energy > 50 ? "#2196f3" : state.energy > 25 ? "#ff9800" : "#f44336";
  ctx.fillRect(barX2, barY, (state.energy / 100) * barW, 16);
  ctx.fillStyle = "#fff";
  ctx.fillText(\`⚡ \${state.energy}%\`, barX2 + 5, barY + 13);

  // Mood label
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(\`mood: \${state.mood}\`, canvasW / 2, barY + 38);
  ctx.textAlign = "start";

  return canvas.toBuffer("image/png");
}

module.exports = { generateCatCanvas };`,

  "api/routes.js": `const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { NOTIFICATION_CHANNEL_ID, API_SECRET, PREFIX, FOOTER_LOGO } = require("../config");
const { getCatState, updateCatState, flushPendingActions } = require("../catState");
const { generateCatCanvas } = require("../catCanvas");

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
          \`**\${modeLabels[mode] || mode}** concluído!\\n\\n\` +
          \`👤 **\${userName || "Anônimo"}** • 📊 **\${sessions || 0} sessões**\\n\\n\` +
          (mode === "focus" ? "Hora de descansar! ☕" : "Hora de voltar ao foco! 🚀") +
          "\\n\\n⬇️ **Escolha o próximo passo:**"
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
        return \`\${config.emoji} **\${i + 1}.** \${t.title} — *\${dl}*\`;
      }).join("\\n");

      const embed = new EmbedBuilder()
        .setTitle(config.title)
        .setDescription(\`👤 **\${userName || "Anônimo"}**\\n\\n\${taskList}\`)
        .setColor(config.color)
        .setThumbnail(FOOTER_LOGO)
        .setFooter({ text: \`\${config.footer} • Uzzo Solutions\`, iconURL: FOOTER_LOGO })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/cat-status
  app.post("/api/cat-status", authMiddleware, async (req, res) => {
    const { name, color, colorIdx, happiness, energy, mood } = req.body;
    const catState = getCatState();
    const updated = updateCatState({
      name: name || catState.name,
      color: color || catState.color,
      colorIdx: colorIdx ?? catState.colorIdx,
      happiness: Math.round(happiness ?? catState.happiness),
      energy: Math.round(energy ?? catState.energy),
      mood: mood || catState.mood,
    });
    res.json({ success: true, catState: updated });
  });

  // POST /api/cat-hungry
  app.post("/api/cat-hungry", authMiddleware, async (req, res) => {
    const { name, happiness, energy, userName } = req.body;
    const catState = getCatState();
    updateCatState({
      name: name || catState.name,
      happiness: happiness ?? catState.happiness,
      energy: energy ?? catState.energy,
      mood: "hungry",
    });

    try {
      const channel = await client.channels.fetch(NOTIFICATION_CHANNEL_ID);
      const state = getCatState();
      const catImage = await generateCatCanvas(state);
      const attachment = new AttachmentBuilder(catImage, { name: "cat-status.png" });

      const embed = new EmbedBuilder()
        .setTitle(\`🐱 \${state.name} está com fome!\`)
        .setDescription(
          \`O gatinho de **\${userName || "Anônimo"}** precisa de atenção!\\n\\n\` +
          \`❤️ Felicidade: **\${state.happiness}%**\\n\` +
          \`⚡ Energia: **\${state.energy}%**\\n\\n\` +
          \`Use \\\`!alimentar\\\` para dar comida!\`
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

  // GET /api/pending-actions
  app.get("/api/pending-actions", authMiddleware, (req, res) => {
    res.json({ actions: flushPendingActions() });
  });

  // GET /api/health
  app.get("/api/health", (req, res) => {
    res.json({ status: "online", bot: client.isReady() ? "ready" : "connecting", catState: getCatState() });
  });
}

module.exports = { registerRoutes };`,

  "events/interactions.js": `const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { FOOTER_LOGO } = require("../config");
const { getCatState, updateCatState, addPendingAction } = require("../catState");
const { generateCatCanvas } = require("../catCanvas");

function registerInteractions(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const id = interaction.customId;

    try {
      // Botões do Pomodoro
      if (id.startsWith("pomo_")) {
        const modeMap = { pomo_focus: "focus", pomo_short: "short", pomo_long: "long" };
        const mode = modeMap[id];
        const labels = { focus: "🍅 Foco (25min)", short: "☕ Pausa (5min)", long: "🌿 Descanso (15min)" };

        addPendingAction({ type: "start_pomodoro", mode, timestamp: Date.now(), user: interaction.user.username });

        await interaction.reply({
          content: \`✅ **\${labels[mode]}** iniciado pelo Discord!\\nO timer será sincronizado com o app.\`,
          ephemeral: true,
        });
        return;
      }

      // Botão: Alimentar
      if (id === "cat_feed") {
        await interaction.deferReply();
        const state = getCatState();
        updateCatState({
          happiness: Math.min(100, state.happiness + 15),
          energy: Math.min(100, state.energy + 10),
          mood: "eating",
          lastFed: Date.now(),
        });
        addPendingAction({ type: "cat_feed", timestamp: Date.now(), user: interaction.user.username });

        const updated = getCatState();
        const catImage = await generateCatCanvas(updated);
        const attachment = new AttachmentBuilder(catImage, { name: "cat-fed.png" });

        await interaction.editReply({
          content: \`🐟 **\${interaction.user.username}** alimentou **\${updated.name}**!\\n❤️ \${updated.happiness}% • ⚡ \${updated.energy}%\`,
          files: [attachment],
        });
        return;
      }

      // Botão: Carinho
      if (id === "cat_pet") {
        await interaction.deferReply();
        const state = getCatState();
        updateCatState({
          happiness: Math.min(100, state.happiness + 8),
          mood: "happy",
          lastPet: Date.now(),
        });
        addPendingAction({ type: "cat_pet", timestamp: Date.now(), user: interaction.user.username });

        const updated = getCatState();
        await interaction.editReply({
          content: \`🤗 **\${interaction.user.username}** fez carinho em **\${updated.name}**! Purr~ 💜\\n❤️ \${updated.happiness}%\`,
        });
        return;
      }

      // Botão: Status
      if (id === "cat_status") {
        await interaction.deferReply({ ephemeral: true });
        const state = getCatState();
        const catImage = await generateCatCanvas(state);
        const attachment = new AttachmentBuilder(catImage, { name: "cat-status.png" });

        const embed = new EmbedBuilder()
          .setTitle(\`📊 Status de \${state.name}\`)
          .setDescription(
            \`❤️ Felicidade: **\${state.happiness}%** \${state.happiness > 60 ? "😊" : state.happiness > 30 ? "😐" : "😿"}\\n\` +
            \`⚡ Energia: **\${state.energy}%** \${state.energy > 60 ? "⚡" : state.energy > 30 ? "🔋" : "🪫"}\\n\` +
            \`🎭 Humor: **\${state.mood}**\\n\` +
            \`🍽️ Última refeição: <t:\${Math.floor(state.lastFed / 1000)}:R>\`
          )
          .setColor(0x9b87f5)
          .setImage("attachment://cat-status.png")
          .setFooter({ text: "Pet Virtual • Uzzo Solutions", iconURL: FOOTER_LOGO })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        return;
      }
    } catch (err) {
      console.error(\`❌ Erro na interação "\${id}":\`, err);
      const replyMethod = interaction.deferred ? "editReply" : "reply";
      await interaction[replyMethod]({
        content: \`❌ Ocorreu um erro ao processar a interação. Tente novamente!\`,
        ephemeral: true,
      }).catch(() => {});
    }
  });
}

module.exports = { registerInteractions };`,

  "events/commands.js": `const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { PREFIX, FOOTER_LOGO } = require("../config");
const { getCatState, updateCatState, addPendingAction } = require("../catState");
const { generateCatCanvas } = require("../catCanvas");

function registerCommands(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    try {
    if (command === "alimentar" || command === "feed") {
      const state = getCatState();
      updateCatState({
        happiness: Math.min(100, state.happiness + 15),
        energy: Math.min(100, state.energy + 10),
        mood: "eating",
        lastFed: Date.now(),
      });
      addPendingAction({ type: "cat_feed", timestamp: Date.now(), user: message.author.username });

      const updated = getCatState();
      const catImage = await generateCatCanvas(updated);
      const attachment = new AttachmentBuilder(catImage, { name: "cat-fed.png" });

      await message.reply({
        content: \`🐟 **\${updated.name}** foi alimentado(a)! Nhom nhom~\\n❤️ \${updated.happiness}% • ⚡ \${updated.energy}%\`,
        files: [attachment],
      });
      return;
    }

    if (command === "gato" || command === "cat" || command === "status") {
      const state = getCatState();
      const catImage = await generateCatCanvas(state);
      const attachment = new AttachmentBuilder(catImage, { name: "cat-status.png" });

      const embed = new EmbedBuilder()
        .setTitle(\`🐱 \${state.name}\`)
        .setDescription(
          \`❤️ Felicidade: **\${state.happiness}%**\\n\` +
          \`⚡ Energia: **\${state.energy}%**\\n\` +
          \`🎭 Humor: **\${state.mood}**\\n\` +
          \`🍽️ Última refeição: <t:\${Math.floor(state.lastFed / 1000)}:R>\`
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
      const state = getCatState();
      updateCatState({
        happiness: Math.min(100, state.happiness + 8),
        mood: "happy",
        lastPet: Date.now(),
      });
      addPendingAction({ type: "cat_pet", timestamp: Date.now(), user: message.author.username });

      const updated = getCatState();
      await message.reply(\`🤗 Você fez carinho em **\${updated.name}**! Purr~ 💜\\n❤️ \${updated.happiness}%\`);
      return;
    }

    if (command === "help" || command === "ajuda") {
      const embed = new EmbedBuilder()
        .setTitle("📖 Comandos Disponíveis")
        .setDescription(
          \`**🐱 Pet Virtual:**\\n\` +
          \`\\\`\${PREFIX}gato\\\` — Ver status do gatinho com canvas\\n\` +
          \`\\\`\${PREFIX}alimentar\\\` — Dar comida ao gatinho\\n\` +
          \`\\\`\${PREFIX}carinho\\\` — Fazer carinho no gatinho\\n\\n\` +
          \`**ℹ️ Outros:**\\n\` +
          \`\\\`\${PREFIX}ajuda\\\` — Esta mensagem\`
        )
        .setColor(0x9b87f5)
        .setFooter({ text: "Uzzo Solutions", iconURL: FOOTER_LOGO });

      await message.reply({ embeds: [embed] });
      return;
    }
    } catch (err) {
      console.error(\`❌ Erro no comando "\${command}":\`, err);
      await message.reply(\`❌ Ocorreu um erro ao executar o comando. Tente novamente!\`).catch(() => {});
    }
  });
}

module.exports = { registerCommands };`,

  "events/voiceTickets.js": `const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { VOICE_CHANNEL_ID, TICKET_CATEGORY_ID, SUPPORT_ROLE_ID, FOOTER_LOGO, VOICE_THUMB, ABSENCE_TIMEOUT_MS } = require("../config");

const activeTickets = new Map();

async function getChannelCategory(guild, channelId) {
  try {
    const channel = await guild.channels.fetch(channelId);
    return channel?.parentId;
  } catch { return null; }
}

async function closeTicketByAbsence(client, guild, userId) {
  const ticket = activeTickets.get(userId);
  if (!ticket) return;
  activeTickets.delete(userId);

  try {
    const ch = await guild.channels.fetch(ticket.ticketChannelId);
    if (ch) { await ch.delete("Ausência."); console.log(\`🗑️ Ticket \${ch.name} excluído.\`); }
  } catch (err) { console.error("❌ Erro ticket:", err); }

  try {
    const user = await client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setTitle("<a:y_aviso_cdw:1282771322555994245>  Ticket Encerrado")
      .setDescription("Seu ticket foi **fechado automaticamente** por ausência.\\nEntre novamente se precisar de ajuda.")
      .setColor(0xff3333).setThumbnail(FOOTER_LOGO)
      .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO }).setTimestamp();
    await user.send({ embeds: [embed] });
  } catch (err) { console.error("❌ DM ausência:", err); }
}

function registerVoiceTickets(client) {
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
        const tickets = allCh.filter(ch => ch.parentId === TICKET_CATEGORY_ID && ch.name.match(/・\\d{3}$/));
        const num = String(tickets.size + 1).padStart(3, "0");
        const short = user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);

        const ticketCh = await guild.channels.create({
          name: \`🎟️・\${short}・\${num}\`, type: 0, parent: TICKET_CATEGORY_ID,
          topic: \`Ticket — \${displayName}\`,
          permissionOverwrites: [
            { id: guild.id, deny: ["ViewChannel"] },
            { id: user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
            { id: SUPPORT_ROLE_ID, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
          ],
        });

        const embed = new EmbedBuilder()
          .setTitle("Mensagem do sistema:")
          .setDescription(\`Olá, <@\${user.id}>! Nosso sistema avisou a equipe. Em breve você será atendido.\`)
          .setColor(0x0033ff).setThumbnail(VOICE_THUMB)
          .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO }).setTimestamp();

        await ticketCh.send({ content: \`<@\${user.id}>\`, embeds: [embed] });
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
      ticket.timeoutId = setTimeout(() => closeTicketByAbsence(client, guild, userId), ABSENCE_TIMEOUT_MS);
    }
  });
}

module.exports = { registerVoiceTickets };`,

  "events/welcome.js": `const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { WELCOME_CHANNEL_ID, FOOTER_LOGO } = require("../config");

function registerWelcome(client) {
  client.on("guildMemberAdd", async (member) => {
    if (member.user.bot) return;
    const guild = member.guild;

    try {
      const embed = new EmbedBuilder()
        .setTitle("Bem-vindo(a) ao Uzzo Solutions ®!")
        .setDescription(
          \`<:ios_hearthands:1261374708436304034> Olá <@\${member.id}>! Que bom ter você!\\n\\n\` +
          \`Conheça <#1193519922345689118>. Ajuda? <#1260202900442058803>. 💙\`
        )
        .setColor(0x0033ff)
        .setFooter({ text: "Atendimento 09:30 - 23:00 • Uzzo Solutions", iconURL: FOOTER_LOGO }).setTimestamp();

      if (WELCOME_CHANNEL_ID) {
        const ch = await guild.channels.fetch(WELCOME_CHANNEL_ID);
        if (ch) {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("Ver onboarding").setStyle(ButtonStyle.Link).setURL("https://royal-art-glow.lovable.app/discord/onboarding").setEmoji("📋")
          );
          await ch.send({ content: \`<@\${member.id}>\`, embeds: [embed], components: [row] });
        }
      }
      try { await member.send({ embeds: [embed] }); } catch {}
    } catch (err) { console.error("❌ Welcome:", err); }
  });
}

module.exports = { registerWelcome };`,
};

export async function downloadBotZip() {
  const zip = new JSZip();

  for (const [path, content] of Object.entries(BOT_FILES)) {
    zip.file(path, content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "discord-bot.zip";
  a.click();
  URL.revokeObjectURL(url);
}

export const BOT_VERSION = "2026-02-13T01";
