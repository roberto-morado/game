import { getSprite, drawText } from "../assets.js";
import { getPlayer } from "../entities/player.js";

let portraitCache = null;
let hpBarCache = null;

export async function drawHUD(ctx) {
  const player = getPlayer();
  if (!player) return;

  // Fetch portrait
  if (!portraitCache) {
    portraitCache = await getSprite(player.portraitId);
  }
  if (!hpBarCache) {
    hpBarCache = await getSprite("health_bar");
  }

  const padX = 10, padY = 10;
  const panelW = 300, panelH = 90;

  // Panel background
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(padX, padY, panelW, panelH);
  ctx.strokeStyle = "#c8a96e";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(padX, padY, panelW, panelH);

  // Portrait
  if (portraitCache) {
    ctx.drawImage(portraitCache, padX + 5, padY + 5, 68, 69);
  }

  const tx = padX + 82;
  const ty = padY + 16;

  // Name + Level
  ctx.fillStyle = "#c8a96e";
  ctx.font = "bold 13px monospace";
  ctx.fillText(player.name, tx, ty);
  ctx.fillStyle = "#aaa";
  ctx.font = "11px monospace";
  ctx.fillText(`Lv.${player.level}`, tx + 100, ty);

  // HP bar
  const barW = 180, barH = 12;
  ctx.fillStyle = "#300";
  ctx.fillRect(tx, ty + 8, barW, barH);
  ctx.fillStyle = "#4c4";
  ctx.fillRect(tx, ty + 8, barW * Math.max(0, player.hp / player.maxHp), barH);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(tx, ty + 8, barW, barH);
  ctx.fillStyle = "#fff";
  ctx.font = "10px monospace";
  ctx.fillText(`HP ${player.hp}/${player.maxHp}`, tx + 4, ty + 18);

  // MP bar
  ctx.fillStyle = "#003";
  ctx.fillRect(tx, ty + 26, barW, barH);
  ctx.fillStyle = "#44f";
  ctx.fillRect(tx, ty + 26, barW * Math.max(0, player.mp / player.maxMp), barH);
  ctx.strokeRect(tx, ty + 26, barW, barH);
  ctx.fillStyle = "#fff";
  ctx.fillText(`MP ${player.mp}/${player.maxMp}`, tx + 4, ty + 36);

  // XP bar
  ctx.fillStyle = "#330";
  ctx.fillRect(tx, ty + 44, barW, barH);
  ctx.fillStyle = "#aa4";
  ctx.fillRect(tx, ty + 44, barW * Math.max(0, player.xp / player.xpNext), barH);
  ctx.strokeRect(tx, ty + 44, barW, barH);
  ctx.fillStyle = "#ccc";
  ctx.fillText(`XP ${player.xp}/${player.xpNext}`, tx + 4, ty + 54);

  // Controls hint (bottom right)
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(1280 - 200, 720 - 30, 200, 30);
  ctx.fillStyle = "#888";
  ctx.font = "11px monospace";
  ctx.fillText("Arrows:Move  Enter:Act", 1280 - 196, 720 - 10);
}
