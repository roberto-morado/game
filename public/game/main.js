import { loadAssets, preloadTiles, preloadSprites } from "./assets.js";
import { generateMap, renderMap, getRooms } from "./world/map.js";
import { camera, centerOn } from "./world/camera.js";
import { initPlayer, updatePlayer, drawPlayer, getPlayer, playerTilePos } from "./entities/player.js";
import { spawnEnemies, updateEnemies, drawEnemies } from "./entities/enemy.js";
import { startBattle, updateBattle, drawBattle, getBattleState, endBattle, handleInput, isBattleOver } from "./battle/battle.js";
import { drawHUD } from "./ui/hud.js";
import { drawClassSelect, updateClassSelect, drawGameOver, drawMainMenu } from "./ui/screens.js";
import { Input } from "./input.js";
import { PHASE, TILE_W, TILE_H } from "./constants.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let gamePhase = PHASE.MAIN_MENU; // starts here
let pendingPhase = null;

async function init() {
  await loadAssets();
  document.getElementById("loading").style.display = "none";
  requestAnimationFrame(loop);
}

function startNewGame(classId) {
  generateMap();
  const rooms = getRooms();
  const startRoom = rooms[0];
  const startTX = Math.floor(startRoom.x + startRoom.w / 2);
  const startTY = Math.floor(startRoom.y + startRoom.h / 2);
  initPlayer(classId, startTX, startTY);
  spawnEnemies(rooms);
  gamePhase = PHASE.WORLD;
}

let lastTime = 0;
function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;

  ctx.clearRect(0, 0, 1280, 720);

  update();
  render();

  Input.flush();
  requestAnimationFrame(loop);
}

function update() {
  switch (gamePhase) {
    case PHASE.MAIN_MENU:
      if (Input.confirm) {
        gamePhase = PHASE.CLASS_SELECT;
      }
      break;

    case PHASE.CLASS_SELECT: {
      const chosen = updateClassSelect();
      if (chosen) startNewGame(chosen);
      break;
    }

    case PHASE.WORLD:
      updatePlayer();
      updateEnemies((enemy) => {
        startBattle(enemy);
        gamePhase = PHASE.SELECT;
      });
      const player = getPlayer();
      if (player) {
        centerOn(player.x, player.y);
        // Check if player steps on stairs → next floor
        const { tx, ty } = playerTilePos();
        // (future: advance floor)
      }
      break;

    case PHASE.SELECT:
    case PHASE.PLAYER_ACTION:
    case PHASE.ENEMY_ACTION: {
      const bs = getBattleState();
      if (!bs) { gamePhase = PHASE.WORLD; break; }
      handleInput(Input);
      updateBattle();
      if (isBattleOver()) {
        if (bs.result === "lose") {
          gamePhase = PHASE.LOSE;
          // Keep state alive until player presses enter on game over
        } else {
          endBattle();
          gamePhase = PHASE.WORLD;
        }
      }
      break;
    }

    case PHASE.WIN:
      if (Input.confirm) {
        endBattle();
        gamePhase = PHASE.WORLD;
      }
      break;

    case PHASE.LOSE:
      if (Input.confirm) {
        endBattle();
        gamePhase = PHASE.CLASS_SELECT;
      }
      break;
  }
}

async function render() {
  switch (gamePhase) {
    case PHASE.MAIN_MENU:
      await drawMainMenu(ctx);
      break;

    case PHASE.CLASS_SELECT:
      await drawClassSelect(ctx);
      break;

    case PHASE.WORLD:
      await renderMap(ctx, camera.x, camera.y);
      await drawEnemies(ctx, camera.x, camera.y);
      await drawPlayer(ctx, camera.x, camera.y);
      await drawHUD(ctx);
      break;

    case PHASE.SELECT:
    case PHASE.PLAYER_ACTION:
    case PHASE.ENEMY_ACTION:
    case PHASE.WIN:
    case PHASE.LOSE:
      await drawBattle(ctx);
      break;
  }
}

init().catch(console.error);
