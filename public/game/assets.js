import { ALPHA_THRESH } from "./constants.js";

let spriteMap = null;
let sheet = null;
// spriteId → ImageBitmap (transparent)
const spriteCache = new Map();
// blockId → Map<`${col},${row}`, ImageBitmap>
const tileCache = new Map();

export async function loadAssets() {
  const [mapRes, imgRes] = await Promise.all([
    fetch("/sprite_map.json"),
    fetch("/sheet.jpeg"),
  ]);
  spriteMap = await mapRes.json();
  const blob = await imgRes.blob();
  sheet = await createImageBitmap(blob);
}

export function getSpriteMap() { return spriteMap; }

function removeBlack(imgData) {
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < ALPHA_THRESH && d[i+1] < ALPHA_THRESH && d[i+2] < ALPHA_THRESH) {
      d[i+3] = 0;
    }
  }
}

async function extractRegion(sx, sy, sw, sh, transparent = false) {
  const oc = new OffscreenCanvas(sw, sh);
  const ctx = oc.getContext("2d");
  ctx.drawImage(sheet, sx, sy, sw, sh, 0, 0, sw, sh);
  if (transparent) {
    const id = ctx.getImageData(0, 0, sw, sh);
    removeBlack(id);
    ctx.putImageData(id, 0, 0);
  }
  return createImageBitmap(oc);
}

export async function getSprite(id) {
  if (spriteCache.has(id)) return spriteCache.get(id);

  const sec = spriteMap.sections;

  // Characters
  const charSprite = sec.characters.sprites.find((s) => s.id === id);
  if (charSprite) {
    const { x, y } = charSprite;
    const { w, h } = sec.characters.sprite_size;
    const bmp = await extractRegion(x, y, w, h, true);
    spriteCache.set(id, bmp);
    return bmp;
  }

  // Bosses
  const bossSprite = sec.bosses.sprites.find((s) => s.id === id);
  if (bossSprite) {
    const { x, y } = bossSprite;
    const { w, h } = sec.bosses.sprite_size;
    const bmp = await extractRegion(x, y, w, h, true);
    spriteCache.set(id, bmp);
    return bmp;
  }

  // Portraits
  const portrait = sec.portraits.sprites.find((s) => s.id === id);
  if (portrait) {
    const { x, y } = portrait;
    const { w, h } = sec.portraits.sprite_size;
    const bmp = await extractRegion(x, y, w, h, true);
    spriteCache.set(id, bmp);
    return bmp;
  }

  // Items
  const item = sec.items.sprites.find((s) => s.id === id);
  if (item) {
    const { x, w } = item;
    const { row_y, row_height } = sec.items;
    const bmp = await extractRegion(x, row_y, w, row_height, true);
    spriteCache.set(id, bmp);
    return bmp;
  }

  // Effects
  const effect = sec.effects.sprites.find((s) => s.id === id);
  if (effect) {
    const { x, w } = effect;
    const { row_y, row_height } = sec.effects;
    const bmp = await extractRegion(x, row_y, w, row_height, true);
    spriteCache.set(id, bmp);
    return bmp;
  }

  // Interface
  const ui = sec.interface.sprites.find((s) => s.id === id);
  if (ui) {
    const { x, w } = ui;
    const { row_y, row_height } = sec.interface;
    const bmp = await extractRegion(x, row_y, w, row_height, false);
    spriteCache.set(id, bmp);
    return bmp;
  }

  return null;
}

export async function getTile(blockId, col, row) {
  const key = `${col},${row}`;
  if (!tileCache.has(blockId)) tileCache.set(blockId, new Map());
  const bc = tileCache.get(blockId);
  if (bc.has(key)) return bc.get(key);

  const block = spriteMap.sections.environments.blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const { w: tw, h: th } = spriteMap.sections.environments.tile_size;
  const sx = block.x + col * tw;
  const sy = block.y + row * th;
  const bmp = await extractRegion(sx, sy, tw, th, false);
  bc.set(key, bmp);
  return bmp;
}

// Returns { blockId, col, row } for a given tile type tag, or null
export function getTilesByTag(tag) {
  const tags = spriteMap.sections.environments.tile_tags;
  const results = [];
  for (const [blockId, tileMap] of Object.entries(tags)) {
    for (const [key, tileTag] of Object.entries(tileMap)) {
      if (tileTag === tag) {
        const [col, row] = key.split(",").map(Number);
        results.push({ blockId, col, row });
      }
    }
  }
  return results;
}

// Preload all tiles for smooth gameplay
export async function preloadTiles() {
  const blocks = spriteMap.sections.environments.blocks;
  const promises = [];
  for (const block of blocks) {
    for (let r = 0; r < block.rows; r++) {
      for (let c = 0; c < block.cols; c++) {
        promises.push(getTile(block.id, c, r));
      }
    }
  }
  await Promise.all(promises);
}

// Preload all character sprites
export async function preloadSprites() {
  const ids = [
    ...spriteMap.sections.characters.sprites.map((s) => s.id),
    ...spriteMap.sections.bosses.sprites.map((s) => s.id),
    ...spriteMap.sections.portraits.sprites.map((s) => s.id),
    ...spriteMap.sections.effects.sprites.map((s) => s.id),
    ...spriteMap.sections.items.sprites.map((s) => s.id),
    ...spriteMap.sections.interface.sprites.map((s) => s.id),
  ];
  await Promise.all(ids.map((id) => getSprite(id)));
}

// Draw a font glyph from the sprite sheet
export function drawGlyph(ctx, char, dx, dy, scale = 1) {
  const glyph = spriteMap.sections.fonts.glyphs[char.toUpperCase()];
  if (!glyph) return 0;
  const { row_y, row_height } = spriteMap.sections.fonts;
  ctx.drawImage(sheet, glyph.x, row_y, glyph.w, row_height, dx, dy, glyph.w * scale, row_height * scale);
  return glyph.w * scale;
}

export function measureText(text, scale = 1) {
  let w = 0;
  for (const ch of text.toUpperCase()) {
    const g = spriteMap.sections.fonts.glyphs[ch];
    if (g) w += g.w * scale + 2;
  }
  return w;
}

export function drawText(ctx, text, dx, dy, scale = 1) {
  let x = dx;
  for (const ch of text.toUpperCase()) {
    x += drawGlyph(ctx, ch, x, dy, scale) + 2 * scale;
  }
}
