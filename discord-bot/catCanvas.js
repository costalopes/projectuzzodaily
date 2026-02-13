const { createCanvas } = require("@napi-rs/canvas");

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
    ctx.beginPath();
    ctx.roundRect(bx, by, tw + 20, 30, 8);
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
    // Closed eyes (lines)
    px(ctx, ox + 10, oy + 12, 6, 1, c.eye, SCALE);
    px(ctx, ox + 22, oy + 12, 6, 1, c.eye, SCALE);
  } else if (isTired) {
    // Droopy eyes
    px(ctx, ox + 10, oy + 12, 6, 3, c.eye, SCALE, 0.6);
    px(ctx, ox + 10, oy + 11, 6, 2, c.fur1, SCALE);
    px(ctx, ox + 22, oy + 12, 6, 3, c.eye, SCALE, 0.6);
    px(ctx, ox + 22, oy + 11, 6, 2, c.fur1, SCALE);
  } else if (isHappy) {
    // Happy eyes (^_^)
    px(ctx, ox + 10, oy + 11, 6, 1, c.eye, SCALE);
    px(ctx, ox + 10, oy + 12, 1, 2, c.eye, SCALE);
    px(ctx, ox + 15, oy + 12, 1, 2, c.eye, SCALE);
    px(ctx, ox + 22, oy + 11, 6, 1, c.eye, SCALE);
    px(ctx, ox + 22, oy + 12, 1, 2, c.eye, SCALE);
    px(ctx, ox + 27, oy + 12, 1, 2, c.eye, SCALE);
  } else {
    // Normal eyes
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
  ctx.fillText(`❤️ ${state.happiness}%`, 25, barY + 13);

  // Energy bar
  const barX2 = canvasW / 2 + 10;
  ctx.fillStyle = "#444";
  ctx.fillRect(barX2, barY, barW, 16);
  ctx.fillStyle = state.energy > 50 ? "#2196f3" : state.energy > 25 ? "#ff9800" : "#f44336";
  ctx.fillRect(barX2, barY, (state.energy / 100) * barW, 16);
  ctx.fillStyle = "#fff";
  ctx.fillText(`⚡ ${state.energy}%`, barX2 + 5, barY + 13);

  // Mood label
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`mood: ${state.mood}`, canvasW / 2, barY + 38);
  ctx.textAlign = "start";

  return canvas.toBuffer("image/png");
}

module.exports = { generateCatCanvas };
