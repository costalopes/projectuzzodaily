const { Client, GatewayIntentBits } = require("discord.js");
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
  console.log(`✅ Layla online como ${client.user.tag}`);

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

client.login(BOT_TOKEN);
