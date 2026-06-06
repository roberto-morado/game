import { getSprite } from "../assets.js";
import { CLASSES } from "../constants.js";
import { Input } from "../input.js";

let selectedClass = 0;
const classIds = Object.keys(CLASSES);
const portraits = {};
let portraitsLoaded = false;

async function loadPortraits() {
  if (portraitsLoaded) return;
  for (const id of classIds) {
    const cls = CLASSES[id];
    portraits[id] = await getSprite(cls.portraitId);
  }
  portraitsLoaded = true;
}

export async function drawClassSelect(ctx) {
  await loadPortraits();
  const W = 1280, H = 720;

  // Background
  ctx.fillStyle = "#0d0d1a";
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = "#c8a96e";
  ctx.font = "bold 48px monospace";
  ctx.textAlign = "center";
  ctx.fillText("CHOOSE YOUR CLASS", W / 2, 80);
  ctx.textAlign = "left";

  const cardW = 280, cardH = 380;
  const totalW = classIds.length * cardW + (classIds.length - 1) * 40;
  const startX = (W - totalW) / 2;
  const cardY = 130;

  for (let i = 0; i < classIds.length; i++) {
    const id = classIds[i];
    const cls = CLASSES[id];
    const cx = startX + i * (cardW + 40);
    const selected = i === selectedClass;

    // Card
    ctx.fillStyle = selected ? "#1a1a3a" : "#0f0f22";
    ctx.fillRect(cx, cardY, cardW, cardH);
    ctx.strokeStyle = selected ? "#c8a96e" : "#333";
    ctx.lineWidth = selected ? 3 : 1;
    ctx.strokeRect(cx, cardY, cardW, cardH);

    // Portrait
    if (portraits[id]) {
      ctx.drawImage(portraits[id], cx + cardW / 2 - 68, cardY + 20, 136, 138);
    }

    // Name
    ctx.fillStyle = selected ? "#c8a96e" : "#888";
    ctx.font = `bold 22px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(cls.name.toUpperCase(), cx + cardW / 2, cardY + 180);

    // Stats
    ctx.font = "14px monospace";
    ctx.fillStyle = "#ccc";
    const stats = [
      `HP: ${cls.hp}`,
      `MP: ${cls.mp}`,
      `ATK: ${cls.atk}`,
      `DEF: ${cls.def}`,
      `SPD: ${cls.spd}`,
    ];
    stats.forEach((s, si) => {
      ctx.fillText(s, cx + cardW / 2, cardY + 210 + si * 22);
    });

    // Skills
    ctx.fillStyle = "#7af";
    ctx.font = "12px monospace";
    ctx.fillText("Skills:", cx + cardW / 2, cardY + 320);
    const skillNames = cls.skills.map((s) => s.replace(/_/g, " ")).join(", ");
    ctx.fillStyle = "#aaa";
    ctx.font = "11px monospace";
    // Wrap if needed
    const words = skillNames.split(", ");
    let line = "", lineY = cardY + 338;
    for (const word of words) {
      const test = line ? line + ", " + word : word;
      if (ctx.measureText(test).width > cardW - 20) {
        ctx.fillText(line, cx + cardW / 2, lineY);
        line = word;
        lineY += 16;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx + cardW / 2, lineY);

    ctx.textAlign = "left";
  }

  // Instructions
  ctx.fillStyle = "#666";
  ctx.font = "16px monospace";
  ctx.textAlign = "center";
  ctx.fillText("← → to select   ENTER to confirm", W / 2, H - 40);
  ctx.textAlign = "left";
}

export function updateClassSelect() {
  if (Input.left)  selectedClass = (selectedClass - 1 + classIds.length) % classIds.length;
  if (Input.right) selectedClass = (selectedClass + 1) % classIds.length;
  if (Input.confirm) return classIds[selectedClass];
  return null;
}

export async function drawGameOver(ctx, xp) {
  const W = 1280, H = 720;
  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e44";
  ctx.font = "bold 72px monospace";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", W / 2, H / 2 - 40);
  ctx.fillStyle = "#888";
  ctx.font = "20px monospace";
  ctx.fillText("Press ENTER to restart", W / 2, H / 2 + 40);
  ctx.textAlign = "left";
}

export async function drawMainMenu(ctx) {
  const W = 1280, H = 720;
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, W, H);

  // Title shadow
  ctx.fillStyle = "#3a2a00";
  ctx.font = "bold 68px monospace";
  ctx.textAlign = "center";
  ctx.fillText("PIXEL QUEST", W / 2 + 3, H * 0.28 + 3);

  ctx.fillStyle = "#c8a96e";
  ctx.fillText("PIXEL QUEST", W / 2, H * 0.28);

  ctx.fillStyle = "#aaa";
  ctx.font = "18px monospace";
  ctx.fillText("A Roguelike Adventure", W / 2, H * 0.38);

  ctx.fillStyle = "#fff";
  ctx.font = "20px monospace";
  ctx.fillText("Press ENTER to begin", W / 2, H * 0.65);

  ctx.fillStyle = "#555";
  ctx.font = "13px monospace";
  ctx.fillText("Arrow keys to move  |  ENTER to confirm  |  ESC to cancel", W / 2, H * 0.88);

  ctx.textAlign = "left";
}
