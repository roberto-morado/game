export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const TILE_W = 67;
export const TILE_H = 67;
export const CHAR_W = 68;
export const CHAR_H = 68;

export const SCALE = 2; // character/boss render scale

// Map dimensions (in tiles)
export const MAP_W = 80;
export const MAP_H = 80;

// Viewport (in tiles)
export const VP_COLS = Math.ceil(CANVAS_W / TILE_W) + 1;
export const VP_ROWS = Math.ceil(CANVAS_H / TILE_H) + 1;

// Transparency threshold for JPEG black background removal
export const ALPHA_THRESH = 40;

// Player move speed (px per frame at 60fps)
export const PLAYER_SPEED = 2;

// Enemy behavior
export const ENEMY_SIGHT_RANGE = 8;  // tiles
export const ENEMY_SPEED = 1.2;
export const ENEMY_CATCH_DIST = 1.2; // tiles — triggers battle

// Battle
export const PHASE = Object.freeze({
  WORLD: "WORLD",
  SELECT: "SELECT",
  PLAYER_ACTION: "PLAYER_ACTION",
  ENEMY_ACTION: "ENEMY_ACTION",
  WIN: "WIN",
  LOSE: "LOSE",
  CLASS_SELECT: "CLASS_SELECT",
  MAIN_MENU: "MAIN_MENU",
});

// Class definitions
export const CLASSES = Object.freeze({
  archer: {
    id: "archer",
    name: "Archer",
    spriteId: "archer",
    portraitId: "portrait_archer",
    hp: 80,
    mp: 60,
    atk: 14,
    def: 6,
    spd: 12,
    skills: ["double_shot", "rain_of_arrows", "focus", "evade"],
  },
  knight: {
    id: "knight",
    name: "Knight",
    spriteId: "knight",
    portraitId: "portrait_knight",
    hp: 120,
    mp: 30,
    atk: 12,
    def: 14,
    spd: 6,
    skills: ["shield_bash", "fortify", "war_cry", "cleave"],
  },
  wizard: {
    id: "wizard",
    name: "Wizard",
    spriteId: "wizard",
    portraitId: "portrait_wizard",
    hp: 60,
    mp: 100,
    atk: 16,
    def: 4,
    spd: 9,
    skills: ["fireball", "ice_shard", "thunder", "heal"],
  },
});

// NPC portrait assignments for dialogue/quests
export const NPC_PORTRAITS = [
  "portrait_npc_0",  // merchant
  "portrait_npc_1",  // quest giver
  "portrait_npc_2",  // inn keeper
  "portrait_npc_3",  // blacksmith
  "portrait_npc_4",  // elder
  "portrait_npc_5",  // guard
  "portrait_npc_6",  // mysterious stranger
  "portrait_npc_7",  // healer
  "portrait_npc_8",  // scout
  "portrait_npc_9",  // bard
  "portrait_npc_10", // sage
];

export const TILE_TYPE = Object.freeze({
  FLOOR: "floor",
  WALL: "wall",
  WALL_TOP: "wall-top",
  CORNER: "corner",
  DOOR: "door",
  DECORATION: "decoration",
  OBSTACLE: "obstacle",
  STAIRS: "stairs",
  VOID: "void",
});
