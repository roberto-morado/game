import { TILE_W, TILE_H, CHAR_W, CHAR_H, SCALE, ENEMY_SPEED, ENEMY_SIGHT_RANGE, ENEMY_CATCH_DIST } from "../constants.js";
import { isWalkable, tileAt, getMap } from "../world/map.js";
import { getSprite } from "../assets.js";
import { getPlayer } from "./player.js";
import { getSpriteMap } from "../assets.js";

const enemies = [];

export function getEnemies() { return enemies; }

export function clearEnemies() { enemies.length = 0; }

// Pick a random enemy sprite id
function randomEnemySpriteId() {
  const sm = getSpriteMap();
  const enemySprites = sm.sections.characters.sprites.filter((s) => s.role === "enemy");
  const picked = enemySprites[Math.floor(Math.random() * enemySprites.length)];
  return picked.id;
}

export function spawnEnemies(rooms) {
  clearEnemies();
  // Skip first room (player start)
  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < count; j++) {
      const tx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      const ty = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      if (!isWalkable(tx, ty)) continue;
      const hp = 20 + Math.floor(Math.random() * 20);
      enemies.push({
        id: `e${i}_${j}`,
        spriteId: randomEnemySpriteId(),
        x: tx * TILE_W + TILE_W / 2,
        y: ty * TILE_H + TILE_H / 2,
        // patrol anchor
        homeX: tx * TILE_W + TILE_W / 2,
        homeY: ty * TILE_H + TILE_H / 2,
        hp,
        maxHp: hp,
        atk: 5 + Math.floor(Math.random() * 5),
        def: 2 + Math.floor(Math.random() * 3),
        state: "idle",  // idle | chase
        facing: "right",
        sprite: null,
        defeated: false,
      });
    }
  }
}

function hasLineOfSight(ex, ey, px, py) {
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    const ix = ex + (px - ex) * (i / steps);
    const iy = ey + (py - ey) * (i / steps);
    const tx = Math.floor(ix / TILE_W);
    const ty = Math.floor(iy / TILE_H);
    const tile = tileAt(tx, ty);
    if (!tile) return false;
    if (tile.type === "wall" || tile.type === "wall-top" || tile.type === "corner") return false;
  }
  return true;
}

export function updateEnemies(battleCb) {
  const player = getPlayer();
  if (!player) return;

  for (const enemy of enemies) {
    if (enemy.defeated) continue;

    const distX = (player.x - enemy.x) / TILE_W;
    const distY = (player.y - enemy.y) / TILE_H;
    const dist = Math.sqrt(distX * distX + distY * distY);

    if (enemy.state === "idle") {
      if (dist < ENEMY_SIGHT_RANGE && hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
        enemy.state = "chase";
      }
    }

    if (enemy.state === "chase") {
      if (dist < ENEMY_CATCH_DIST) {
        // Trigger battle
        enemy.defeated = true; // remove from world
        battleCb(enemy);
        return;
      }

      // Move toward player
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      const nx = enemy.x + Math.cos(angle) * ENEMY_SPEED;
      const ny = enemy.y + Math.sin(angle) * ENEMY_SPEED;

      const tx = Math.floor(nx / TILE_W);
      const ty = Math.floor(ny / TILE_H);
      if (isWalkable(tx, ty)) {
        enemy.x = nx;
        enemy.y = ny;
      } else {
        // Try sliding
        if (isWalkable(Math.floor(nx / TILE_W), Math.floor(enemy.y / TILE_H))) enemy.x = nx;
        else if (isWalkable(Math.floor(enemy.x / TILE_W), Math.floor(ny / TILE_H))) enemy.y = ny;
      }

      enemy.facing = player.x > enemy.x ? "right" : "left";

      // Give up if too far
      if (dist > ENEMY_SIGHT_RANGE * 2) {
        enemy.state = "idle";
        enemy.x = enemy.homeX;
        enemy.y = enemy.homeY;
      }
    }
  }
}

export async function drawEnemies(ctx, camX, camY) {
  const player = getPlayer();

  for (const enemy of enemies) {
    if (enemy.defeated) continue;
    if (!enemy.sprite) {
      enemy.sprite = await getSprite(enemy.spriteId);
    }
    if (!enemy.sprite) continue;

    const sw = CHAR_W * SCALE;
    const sh = CHAR_H * SCALE;
    const sx = enemy.x - camX - sw / 2;
    const sy = enemy.y - camY - sh / 2;

    // Tint red when chasing
    ctx.save();
    if (enemy.state === "chase") {
      ctx.filter = "brightness(1.4) saturate(2) hue-rotate(-20deg)";
    }
    if (enemy.facing === "left") {
      ctx.scale(-1, 1);
      ctx.drawImage(enemy.sprite, -(sx + sw), sy, sw, sh);
    } else {
      ctx.drawImage(enemy.sprite, sx, sy, sw, sh);
    }
    ctx.restore();

    // HP bar above enemy
    if (enemy.state === "chase" || enemy.hp < enemy.maxHp) {
      const barW = sw;
      const barH = 4;
      const bx = sx;
      const by = sy - 8;
      ctx.fillStyle = "#500";
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = "#e44";
      ctx.fillRect(bx, by, barW * (enemy.hp / enemy.maxHp), barH);
    }
  }
}
