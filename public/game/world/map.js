import { MAP_W, MAP_H, TILE_W, TILE_H, TILE_TYPE } from "../constants.js";
import { getTilesByTag, getTile } from "../assets.js";

// map[y][x] = { type: TILE_TYPE, blockId, col, row } | null
let map = null;
let tileLookup = {}; // TILE_TYPE → [{ blockId, col, row }]

export function getMap() { return map; }

export function tileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return null;
  return map[ty][tx];
}

export function isWalkable(tx, ty) {
  const t = tileAt(tx, ty);
  if (!t) return false;
  return t.type === TILE_TYPE.FLOOR || t.type === TILE_TYPE.DOOR || t.type === TILE_TYPE.STAIRS || t.type === TILE_TYPE.DECORATION;
}

function pickTile(type) {
  const options = tileLookup[type];
  if (!options || options.length === 0) return tileLookup[TILE_TYPE.FLOOR]?.[0] ?? null;
  return options[Math.floor(Math.random() * options.length)];
}

function setTile(x, y, type) {
  const picked = pickTile(type);
  if (picked) {
    map[y][x] = { type, ...picked };
  }
}

function fillRect(x, y, w, h, type) {
  for (let ry = y; ry < y + h; ry++) {
    for (let rx = x; rx < x + w; rx++) {
      setTile(rx, ry, type);
    }
  }
}

function carveRoom(room) {
  // Interior floor
  fillRect(room.x + 1, room.y + 1, room.w - 2, room.h - 2, TILE_TYPE.FLOOR);
  // Walls
  for (let rx = room.x; rx < room.x + room.w; rx++) {
    setTile(rx, room.y, TILE_TYPE.WALL_TOP);
    setTile(rx, room.y + room.h - 1, TILE_TYPE.WALL);
  }
  for (let ry = room.y + 1; ry < room.y + room.h - 1; ry++) {
    setTile(room.x, ry, TILE_TYPE.WALL);
    setTile(room.x + room.w - 1, ry, TILE_TYPE.WALL);
  }
  // Corners
  setTile(room.x, room.y, TILE_TYPE.CORNER);
  setTile(room.x + room.w - 1, room.y, TILE_TYPE.CORNER);
  setTile(room.x, room.y + room.h - 1, TILE_TYPE.CORNER);
  setTile(room.x + room.w - 1, room.y + room.h - 1, TILE_TYPE.CORNER);
}

function carveCorridor(x1, y1, x2, y2) {
  // L-shaped: horizontal then vertical
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  for (let x = minX; x <= maxX; x++) {
    if (map[y1][x]?.type !== TILE_TYPE.FLOOR) setTile(x, y1, TILE_TYPE.FLOOR);
    // Add walls above/below corridor if not already set
    if (!map[y1 - 1]?.[x] || map[y1-1][x]?.type === TILE_TYPE.VOID) {
      setTile(x, y1 - 1, TILE_TYPE.WALL_TOP);
    }
    if (!map[y1 + 1]?.[x] || map[y1+1][x]?.type === TILE_TYPE.VOID) {
      setTile(x, y1 + 1, TILE_TYPE.WALL);
    }
  }
  for (let y = minY; y <= maxY; y++) {
    if (map[y][x2]?.type !== TILE_TYPE.FLOOR) setTile(x2, y, TILE_TYPE.FLOOR);
    if (!map[y]?.[x2 - 1] || map[y][x2-1]?.type === TILE_TYPE.VOID) {
      setTile(x2 - 1, y, TILE_TYPE.WALL);
    }
    if (!map[y]?.[x2 + 1] || map[y][x2+1]?.type === TILE_TYPE.VOID) {
      setTile(x2 + 1, y, TILE_TYPE.WALL);
    }
  }
}

let rooms = [];
export function getRooms() { return rooms; }

export function generateMap() {
  // Build tile lookup from tags
  const types = Object.values(TILE_TYPE).filter(t => t !== TILE_TYPE.VOID);
  for (const type of types) {
    const tagged = getTilesByTag(type);
    tileLookup[type] = tagged;
  }
  // Ensure floor has fallback (dungeon block, row 1 = dirt floor area)
  if (!tileLookup[TILE_TYPE.FLOOR] || tileLookup[TILE_TYPE.FLOOR].length === 0) {
    tileLookup[TILE_TYPE.FLOOR] = [{ blockId: "dungeon", col: 0, row: 1 }];
  }
  if (!tileLookup[TILE_TYPE.WALL] || tileLookup[TILE_TYPE.WALL].length === 0) {
    tileLookup[TILE_TYPE.WALL] = [{ blockId: "room", col: 0, row: 0 }];
  }
  if (!tileLookup[TILE_TYPE.WALL_TOP] || tileLookup[TILE_TYPE.WALL_TOP].length === 0) {
    tileLookup[TILE_TYPE.WALL_TOP] = [{ blockId: "room", col: 1, row: 0 }];
  }
  if (!tileLookup[TILE_TYPE.CORNER] || tileLookup[TILE_TYPE.CORNER].length === 0) {
    tileLookup[TILE_TYPE.CORNER] = [{ blockId: "room", col: 0, row: 0 }];
  }

  map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(null));
  rooms = [];

  const MAX_ROOMS = 20;
  const MIN_SIZE = 6, MAX_SIZE = 14;

  for (let attempt = 0; attempt < 200 && rooms.length < MAX_ROOMS; attempt++) {
    const w = MIN_SIZE + Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE));
    const h = MIN_SIZE + Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE));
    const x = 1 + Math.floor(Math.random() * (MAP_W - w - 2));
    const y = 1 + Math.floor(Math.random() * (MAP_H - h - 2));
    const room = { x, y, w, h };

    const overlaps = rooms.some((r) =>
      x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y
    );
    if (overlaps) continue;

    carveRoom(room);
    if (rooms.length > 0) {
      const prev = rooms[rooms.length - 1];
      const cx1 = Math.floor(prev.x + prev.w / 2);
      const cy1 = Math.floor(prev.y + prev.h / 2);
      const cx2 = Math.floor(room.x + room.w / 2);
      const cy2 = Math.floor(room.y + room.h / 2);
      carveCorridor(cx1, cy1, cx2, cy2);
    }
    rooms.push(room);
  }

  // Place stairs in last room
  if (rooms.length > 1) {
    const last = rooms[rooms.length - 1];
    const sx = Math.floor(last.x + last.w / 2);
    const sy = Math.floor(last.y + last.h / 2);
    setTile(sx, sy, TILE_TYPE.STAIRS);
  }

  // Scatter decorations in a few rooms
  for (let i = 1; i < rooms.length - 1; i += 3) {
    const r = rooms[i];
    const dx = r.x + 2 + Math.floor(Math.random() * Math.max(1, r.w - 4));
    const dy = r.y + 2 + Math.floor(Math.random() * Math.max(1, r.h - 4));
    const dec = pickTile(TILE_TYPE.DECORATION);
    if (dec && map[dy][dx]?.type === TILE_TYPE.FLOOR) {
      map[dy][dx] = { type: TILE_TYPE.DECORATION, ...dec };
    }
  }
}

export async function renderMap(ctx, camX, camY) {
  const startX = Math.floor(camX / TILE_W);
  const startY = Math.floor(camY / TILE_H);
  const endX = startX + Math.ceil(1280 / TILE_W) + 2;
  const endY = startY + Math.ceil(720 / TILE_H) + 2;

  const offsetX = -(camX % TILE_W);
  const offsetY = -(camY % TILE_H);

  for (let ty = startY; ty < Math.min(endY, MAP_H); ty++) {
    for (let tx = startX; tx < Math.min(endX, MAP_W); tx++) {
      const tile = map[ty]?.[tx];
      if (!tile) {
        // Void — draw dark background
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(
          (tx - startX) * TILE_W + offsetX,
          (ty - startY) * TILE_H + offsetY,
          TILE_W, TILE_H
        );
        continue;
      }
      const bmp = await getTile(tile.blockId, tile.col, tile.row);
      if (bmp) {
        ctx.drawImage(
          bmp,
          (tx - startX) * TILE_W + offsetX,
          (ty - startY) * TILE_H + offsetY,
          TILE_W, TILE_H
        );
      }
    }
  }
}
