import { TILE_W, TILE_H, CHAR_W, CHAR_H, SCALE, PLAYER_SPEED, CLASSES } from "../constants.js";
import { isWalkable } from "../world/map.js";
import { getSprite } from "../assets.js";
import { Input } from "../input.js";

let player = null;

export function initPlayer(classId, startTileX, startTileY) {
  const cls = CLASSES[classId];
  player = {
    classId,
    name: cls.name,
    // world-pixel position (center of tile)
    x: startTileX * TILE_W + TILE_W / 2,
    y: startTileY * TILE_H + TILE_H / 2,
    // stats
    maxHp: cls.hp,
    hp: cls.hp,
    maxMp: cls.mp,
    mp: cls.mp,
    atk: cls.atk,
    def: cls.def,
    spd: cls.spd,
    level: 1,
    xp: 0,
    xpNext: 50,
    skills: [...cls.skills],
    spriteId: cls.spriteId,
    portraitId: cls.portraitId,
    // render
    facing: "right",
    moving: false,
    sprite: null,
  };
  return player;
}

export function getPlayer() { return player; }

export function updatePlayer() {
  if (!player) return;

  const dx = (Input.right ? 1 : 0) - (Input.left ? 1 : 0);
  const dy = (Input.down  ? 1 : 0) - (Input.up   ? 1 : 0);
  player.moving = dx !== 0 || dy !== 0;

  if (dx !== 0) player.facing = dx > 0 ? "right" : "left";

  const speed = PLAYER_SPEED;
  const nx = player.x + dx * speed;
  const ny = player.y + dy * speed;

  // Collision — check the tile where the player's hitbox corners would be
  const hw = (CHAR_W * SCALE) / 2 - 4;
  const hh = (CHAR_H * SCALE) / 2 - 4;

  const canMoveX = checkMove(nx, player.y, hw, hh);
  const canMoveY = checkMove(player.x, ny, hw, hh);

  if (canMoveX) player.x = nx;
  if (canMoveY) player.y = ny;
}

function checkMove(px, py, hw, hh) {
  const corners = [
    [px - hw, py - hh],
    [px + hw, py - hh],
    [px - hw, py + hh],
    [px + hw, py + hh],
  ];
  return corners.every(([cx, cy]) => isWalkable(Math.floor(cx / TILE_W), Math.floor(cy / TILE_H)));
}

export async function drawPlayer(ctx, camX, camY) {
  if (!player) return;
  if (!player.sprite) {
    player.sprite = await getSprite(player.spriteId);
  }
  if (!player.sprite) return;

  const sw = CHAR_W * SCALE;
  const sh = CHAR_H * SCALE;
  const sx = player.x - camX - sw / 2;
  const sy = player.y - camY - sh / 2;

  ctx.save();
  if (player.facing === "left") {
    ctx.scale(-1, 1);
    ctx.drawImage(player.sprite, -(sx + sw), sy, sw, sh);
  } else {
    ctx.drawImage(player.sprite, sx, sy, sw, sh);
  }
  ctx.restore();
}

export function playerTilePos() {
  if (!player) return { tx: 0, ty: 0 };
  return {
    tx: Math.floor(player.x / TILE_W),
    ty: Math.floor(player.y / TILE_H),
  };
}

export function gainXP(amount) {
  player.xp += amount;
  while (player.xp >= player.xpNext) {
    player.xp -= player.xpNext;
    player.level++;
    player.xpNext = Math.floor(player.xpNext * 1.4);
    // Stat gains on level up
    player.maxHp += 8;
    player.hp = player.maxHp;
    player.maxMp += 5;
    player.mp = player.maxMp;
    player.atk += 2;
    player.def += 1;
  }
}
