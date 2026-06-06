import { PHASE, CLASSES } from "../constants.js";
import { SKILLS } from "./skills.js";
import { getPlayer, gainXP } from "../entities/player.js";
import { getSprite, drawText, measureText } from "../assets.js";

let state = null;

export function getBattleState() { return state; }

export function startBattle(enemyData) {
  const player = getPlayer();
  // Temp battle copies so originals aren't mutated until battle ends
  state = {
    phase: PHASE.SELECT,
    player: {
      name: player.name,
      hp: player.hp,
      maxHp: player.maxHp,
      mp: player.mp,
      maxMp: player.maxMp,
      atk: player.atk,
      def: player.def,
      spd: player.spd,
      skills: player.skills,
      portraitId: player.portraitId,
      portrait: null,
      _focusedTurns: 0,
      _evasion: false,
      _fortified: 0,
      _warCry: 0,
    },
    enemy: {
      name: "Enemy",
      hp: enemyData.hp,
      maxHp: enemyData.maxHp,
      atk: enemyData.atk,
      def: enemyData.def,
      spriteId: enemyData.spriteId,
      sprite: null,
      _stunned: false,
      _slowed: 0,
    },
    selectedSkill: 0,
    message: "An enemy appears!",
    messageTimer: 90,
    xpReward: 10 + Math.floor(Math.random() * 15),
    result: null, // "win" | "lose" | "flee"
  };
}

export function endBattle() {
  if (!state) return;
  if (state.result === "win") {
    const player = getPlayer();
    player.hp = state.player.hp;
    player.mp = state.player.mp;
    gainXP(state.xpReward);
  } else if (state.result === "lose") {
    // Roguelike — handled by caller
  }
  state = null;
}

function applyBuffs(combatant) {
  if (combatant._focusedTurns > 0) {
    combatant.atk = Math.floor(combatant.atk * 1.5);
    combatant._focusedTurns--;
  }
  if (combatant._fortified > 0) {
    combatant.def = Math.floor(combatant.def * 1.8);
    combatant._fortified--;
  }
  if (combatant._warCry > 0) {
    combatant.atk = Math.floor(combatant.atk * 1.4);
    combatant._warCry--;
  }
}

function enemyAction() {
  const { player, enemy } = state;
  if (enemy._stunned) {
    enemy._stunned = false;
    state.message = `${enemy.name} is stunned and skips a turn!`;
    return;
  }
  // Simple enemy AI: basic attack
  const rawDmg = Math.max(1, enemy.atk - Math.floor(player.def * (player._fortified ? 1.8 : 1) * 0.5));
  let damage = rawDmg;
  if (player._evasion) {
    player._evasion = false;
    damage = 0;
    state.message = `${player.name} evaded the attack!`;
    return;
  }
  player.hp = Math.max(0, player.hp - damage);
  state.message = `${enemy.name} attacks for ${damage} damage!`;
}

export function handleInput(input) {
  if (!state) return;

  const { phase } = state;

  if (phase === PHASE.SELECT) {
    const skillCount = state.player.skills.length;
    if (input.up || input.left) {
      state.selectedSkill = (state.selectedSkill - 1 + skillCount + 1) % (skillCount + 1);
    }
    if (input.down || input.right) {
      state.selectedSkill = (state.selectedSkill + 1) % (skillCount + 1);
    }
    if (input.confirm) {
      if (state.selectedSkill === state.player.skills.length) {
        // Flee option
        if (Math.random() < 0.5) {
          state.message = "Got away safely!";
          state.phase = PHASE.ENEMY_ACTION;
          state.result = "flee";
        } else {
          state.message = "Couldn't escape!";
          state.phase = PHASE.ENEMY_ACTION;
        }
        return;
      }
      const skillId = state.player.skills[state.selectedSkill];
      const skill = SKILLS[skillId];
      if (!skill) return;
      if (state.player.mp < skill.mpCost) {
        state.message = "Not enough MP!";
        return;
      }
      state.player.mp -= skill.mpCost;
      applyBuffs(state.player);
      const result = skill.fn(state.player, state.enemy);
      if (result.damage) {
        state.enemy.hp = Math.max(0, state.enemy.hp - result.damage);
      }
      state.message = result.msg;
      state.phase = PHASE.PLAYER_ACTION;
      state.messageTimer = 90;

      if (state.enemy.hp <= 0) {
        state.message += `\n${state.enemy.name} defeated! +${state.xpReward} XP`;
        state.phase = PHASE.WIN;
        state.result = "win";
      }
    }
  }
}

export function updateBattle() {
  if (!state) return;
  const { phase } = state;

  if (state.messageTimer > 0) {
    state.messageTimer--;
    return;
  }

  if (phase === PHASE.PLAYER_ACTION) {
    if (state.result === "win") return;
    applyBuffs(state.enemy);
    enemyAction();
    state.phase = PHASE.ENEMY_ACTION;
    state.messageTimer = 90;
  }

  if (phase === PHASE.ENEMY_ACTION) {
    if (state.result === "flee") return;
    if (state.player.hp <= 0) {
      state.message = "You have been defeated...";
      state.phase = PHASE.LOSE;
      state.result = "lose";
      return;
    }
    state.phase = PHASE.SELECT;
  }
}

export async function drawBattle(ctx) {
  if (!state) return;

  const W = 1280, H = 720;

  // Background
  ctx.fillStyle = "#1a0f2e";
  ctx.fillRect(0, 0, W, H);

  // Decorative ground
  ctx.fillStyle = "#2a1f4e";
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

  // Enemy sprite (left side, large)
  if (!state.enemy.sprite) state.enemy.sprite = await getSprite(state.enemy.spriteId);
  if (state.enemy.sprite) {
    const sw = 136, sh = 136;
    ctx.drawImage(state.enemy.sprite, W * 0.25 - sw / 2, H * 0.15, sw, sh);
  }

  // Enemy HP bar
  drawHPBar(ctx, W * 0.25 - 120, H * 0.08, 240, 20, state.enemy.hp, state.enemy.maxHp, "#e44444", "Enemy HP");

  // Player portrait (right side)
  if (!state.player.portrait) state.player.portrait = await getSprite(state.player.portraitId);
  if (state.player.portrait) {
    ctx.drawImage(state.player.portrait, W * 0.72, H * 0.45, 136, 138);
  }

  // Player stats
  ctx.fillStyle = "#0a0f1e";
  ctx.fillRect(W * 0.55, H * 0.62, W * 0.44, H * 0.36);
  ctx.strokeStyle = "#c8a96e";
  ctx.lineWidth = 2;
  ctx.strokeRect(W * 0.55, H * 0.62, W * 0.44, H * 0.36);

  drawHPBar(ctx, W * 0.72, H * 0.64, 200, 14, state.player.hp, state.player.maxHp, "#44cc44", "HP");
  drawMPBar(ctx, W * 0.72, H * 0.68, 200, 14, state.player.mp, state.player.maxMp, "#4488ff", "MP");

  // Skill menu (bottom center-left)
  if (state.phase === PHASE.SELECT) {
    drawSkillMenu(ctx);
  }

  // Message box
  drawMessageBox(ctx);

  // Win/Lose overlay
  if (state.phase === PHASE.WIN || state.phase === PHASE.LOSE) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, H);
    const msg = state.phase === PHASE.WIN ? "VICTORY!" : "DEFEATED";
    ctx.fillStyle = state.phase === PHASE.WIN ? "#c8a96e" : "#e44444";
    ctx.font = "bold 72px monospace";
    ctx.textAlign = "center";
    ctx.fillText(msg, W / 2, H / 2);
    ctx.font = "24px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText("Press ENTER to continue", W / 2, H / 2 + 60);
    ctx.textAlign = "left";
  }
}

function drawHPBar(ctx, x, y, w, h, current, max, color, label) {
  ctx.fillStyle = "#333";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, current / max), h);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#fff";
  ctx.font = "12px monospace";
  ctx.fillText(`${label}: ${current}/${max}`, x + 4, y + h - 3);
}

function drawMPBar(ctx, x, y, w, h, current, max, color, label) {
  drawHPBar(ctx, x, y, w, h, current, max, color, label);
}

function drawSkillMenu(ctx) {
  const W = 1280, H = 720;
  const menuX = 40, menuY = H * 0.62;
  const menuW = W * 0.45, menuH = H * 0.36;

  ctx.fillStyle = "#0a0f1e";
  ctx.fillRect(menuX, menuY, menuW, menuH);
  ctx.strokeStyle = "#c8a96e";
  ctx.lineWidth = 2;
  ctx.strokeRect(menuX, menuY, menuW, menuH);

  ctx.fillStyle = "#c8a96e";
  ctx.font = "bold 16px monospace";
  ctx.fillText("SKILLS", menuX + 12, menuY + 22);

  const { skills } = state.player;
  const itemH = 36;
  const startY = menuY + 36;

  for (let i = 0; i < skills.length; i++) {
    const skillId = skills[i];
    const skill = SKILLS[skillId];
    if (!skill) continue;
    const sy = startY + i * itemH;
    if (i === state.selectedSkill) {
      ctx.fillStyle = "rgba(200,169,110,0.2)";
      ctx.fillRect(menuX + 4, sy - 2, menuW - 8, itemH - 4);
      ctx.fillStyle = "#c8a96e";
      ctx.fillText("▶", menuX + 8, sy + 18);
    } else {
      ctx.fillStyle = "#aaa";
    }
    const mpColor = state.player.mp >= skill.mpCost ? "#44f" : "#844";
    ctx.fillStyle = i === state.selectedSkill ? "#fff" : "#ccc";
    ctx.font = "14px monospace";
    ctx.fillText(skill.name, menuX + 28, sy + 18);
    ctx.fillStyle = mpColor;
    ctx.fillText(`MP: ${skill.mpCost}`, menuX + 160, sy + 18);
  }

  // Flee option
  const fleeY = startY + skills.length * itemH;
  if (skills.length === state.selectedSkill) {
    ctx.fillStyle = "rgba(200,169,110,0.2)";
    ctx.fillRect(menuX + 4, fleeY - 2, menuW - 8, itemH - 4);
    ctx.fillStyle = "#c8a96e";
    ctx.font = "bold 14px monospace";
    ctx.fillText("▶ FLEE", menuX + 8, fleeY + 18);
  } else {
    ctx.fillStyle = "#888";
    ctx.font = "14px monospace";
    ctx.fillText("FLEE", menuX + 28, fleeY + 18);
  }
}

function drawMessageBox(ctx) {
  const W = 1280, H = 720;
  const boxX = 40, boxY = H * 0.52;
  const boxW = W * 0.45, boxH = 60;

  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = "#fff";
  ctx.font = "14px monospace";
  const lines = state.message.split("\n");
  lines.forEach((line, i) => {
    ctx.fillText(line, boxX + 10, boxY + 20 + i * 18);
  });
}

export function isBattleOver() {
  if (!state) return false;
  if (state.phase === PHASE.WIN && state.result === "win") return true;
  if (state.phase === PHASE.LOSE && state.result === "lose") return true;
  if (state.result === "flee" && state.messageTimer <= 0) return true;
  return false;
}
