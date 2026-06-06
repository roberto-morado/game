import { CANVAS_W, CANVAS_H, TILE_W, TILE_H, MAP_W, MAP_H } from "../constants.js";

export const camera = { x: 0, y: 0 };

export function centerOn(px, py) {
  camera.x = Math.max(0, Math.min(px - CANVAS_W / 2, MAP_W * TILE_W - CANVAS_W));
  camera.y = Math.max(0, Math.min(py - CANVAS_H / 2, MAP_H * TILE_H - CANVAS_H));
}

// World pixel → screen pixel
export function worldToScreen(wx, wy) {
  return { sx: wx - camera.x, sy: wy - camera.y };
}

// Screen pixel → world tile
export function screenToTile(sx, sy) {
  const wx = sx + camera.x;
  const wy = sy + camera.y;
  return { tx: Math.floor(wx / TILE_W), ty: Math.floor(wy / TILE_H) };
}
