const { createCanvas } = require("@napi-rs/canvas");

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
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 47, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 10, cy - 47, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 46, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 46, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 48, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 12, cy - 48, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Boca
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  if (state.happiness > 60) {
    ctx.beginPath();
    ctx.arc(cx, cy - 35, 6, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else if (state.happiness < 30) {
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 6, 1.1 * Math.PI, 1.9 * Math.PI);
    ctx.stroke();
  } else {
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
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, 28, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 5, by + 28);
    ctx.lineTo(cx, by + 36);
    ctx.lineTo(cx + 5, by + 28);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(bubble, bx + 10, by + 19);
  }

  // Barras de status
  const barY = h - 40;
  ctx.fillStyle = "#444";
  ctx.fillRect(20, barY, 160, 12);
  ctx.fillStyle = state.happiness > 50 ? "#4caf50" : state.happiness > 25 ? "#ff9800" : "#f44336";
  ctx.fillRect(20, barY, (state.happiness / 100) * 160, 12);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 9px monospace";
  ctx.fillText(`❤️ ${state.happiness}%`, 25, barY + 10);

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

module.exports = { generateCatCanvas };
