import type {GameSnapshot} from "@src/game/GameSnapshot";
import {registerGameTools} from "@src/game/webmcp/RegisterGameTools";
import {WoodmanGame} from "@src/game/WoodmanGame";

interface WoodmanDebugApi {
  readonly start: () => void;
  readonly reset: () => GameSnapshot;
  readonly openArgument: (encounterId: string) => void;
  readonly snapshot: () => GameSnapshot;
}

interface WoodmanWindow extends Window {
  __woodman?: WoodmanDebugApi;
  __woodmanReady?: boolean;
  snapshot?: () => GameSnapshot;
}

startGame();

function startGame(): void {
  try {
    const game = new WoodmanGame(gameCanvas());
    const debugApi: WoodmanDebugApi = {
      start: () => game.start(),
      reset: () => game.reset(),
      openArgument: encounterId => game.openArgument(encounterId),
      snapshot: () => game.snapshot(),
    };
    const woodmanWindow = window as WoodmanWindow;
    woodmanWindow.__woodman = debugApi;
    woodmanWindow.snapshot = debugApi.snapshot;
    woodmanWindow.__woodmanReady = true;
    registerGameTools(debugApi);
    game.run();
  } catch (error) {
    console.error("Woodman could not start.", error);
    showEngineError();
  }
}

function gameCanvas(): HTMLCanvasElement {
  const canvas = document.getElementById("game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Expected #game-canvas in the Woodman game shell.");
  }
  return canvas;
}

function showEngineError(): void {
  document.getElementById("loading")?.classList.add("hidden");
  document.getElementById("engine-error")?.classList.remove("hidden");
}
