import type { GameDefinition } from "./catalog";
import { mountDragonfireDescent } from "./dragonfireDescent";
import { mountDungeonCircuit } from "./dungeonCircuit";
import { mountHighriseHavoc } from "./highriseHavoc";
import type { GameController, GameMountOptions } from "./runtime";
import { mountSkylineSmash } from "./skylineSmash";
import { mountSunsetRun } from "./sunsetRun";
import { mountTokenTrail } from "./tokenTrail";

export { arcadeGames } from "./catalog";
export type { GameDefinition, GameId } from "./catalog";
export type { GameController, GameHud } from "./runtime";

export function mountGame(canvas: HTMLCanvasElement, game: GameDefinition, options: GameMountOptions): GameController {
  if (game.id === "skyline-smash") return mountSkylineSmash(canvas, options);
  if (game.id === "token-trail") return mountTokenTrail(canvas, options);
  if (game.id === "dungeon-circuit") return mountDungeonCircuit(canvas, options);
  if (game.id === "highrise-havoc") return mountHighriseHavoc(canvas, options);
  if (game.id === "sunset-run") return mountSunsetRun(canvas, options);
  return mountDragonfireDescent(canvas, options);
}
