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

module.exports = {
  BOT_TOKEN,
  VOICE_CHANNEL_ID,
  TICKET_CATEGORY_ID,
  SUPPORT_ROLE_ID,
  WELCOME_CHANNEL_ID,
  NOTIFICATION_CHANNEL_ID,
  API_PORT,
  API_SECRET,
  PREFIX,
  FOOTER_LOGO,
  VOICE_THUMB,
  ABSENCE_TIMEOUT_MS,
  STATUS_MESSAGES,
};
