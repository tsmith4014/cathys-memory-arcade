import type { GameDefinition } from "./catalog";
import { mountDungeonCircuit } from "./dungeonCircuit";
import type { GameController, GameMountOptions } from "./runtime";
import { mountSkylineSmash } from "./skylineSmash";
import { mountTokenTrail } from "./tokenTrail";

export { arcadeGames } from "./catalog";
export type { GameDefinition, GameId } from "./catalog";
export type { GameController, GameHud } from "./runtime";

export function mountGame(canvas: HTMLCanvasElement, game: GameDefinition, options: GameMountOptions): GameController {
  if (game.id === "skyline-smash") return mountSkylineSmash(canvas, options);
  if (game.id === "token-trail") return mountTokenTrail(canvas, options);
  return mountDungeonCircuit(canvas, options);
}
