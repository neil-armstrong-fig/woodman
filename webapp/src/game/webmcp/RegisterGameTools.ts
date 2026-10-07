import type {GameSnapshot} from "@src/game/GameSnapshot";

interface GameToolCallbacks {
  readonly start: () => void;
  readonly reset: () => GameSnapshot;
  readonly snapshot: () => GameSnapshot;
}

interface ModelContextTool {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly annotations: Record<string, boolean>;
  readonly execute: () => GameSnapshot;
}

interface RegisterToolOptions {
  readonly signal: AbortSignal;
}

interface ModelContext {
  registerTool(tool: ModelContextTool, options: RegisterToolOptions): unknown;
}

interface ModelContextDocument extends Document {
  readonly modelContext?: ModelContext;
}

export function registerGameTools(callbacks: GameToolCallbacks): void {
  const modelContext = (document as ModelContextDocument).modelContext;
  if (!modelContext?.registerTool) {
    return;
  }

  const lifecycle = new AbortController();
  const tools = gameTools(callbacks);
  for (const tool of tools) {
    Promise.resolve(modelContext.registerTool(tool, {signal: lifecycle.signal})).catch(() => undefined);
  }
}

function gameTools(callbacks: GameToolCallbacks): readonly ModelContextTool[] {
  return [
    {
      name: "get_woodman_game_state",
      title: "Read Woodman game state",
      description: "Read the current Woodman game progress, needs, position and active encounter.",
      inputSchema: emptyObjectSchema(),
      annotations: {readOnlyHint: true, untrustedContentHint: false},
      execute: callbacks.snapshot,
    },
    {
      name: "start_woodman_game",
      title: "Start Woodman",
      description: "Dismiss the title screen and start the visible Woodman game.",
      inputSchema: emptyObjectSchema(),
      annotations: {readOnlyHint: false, untrustedContentHint: false},
      execute: () => {
        callbacks.start();
        return callbacks.snapshot();
      },
    },
    {
      name: "reset_woodman_game",
      title: "Reset Woodman",
      description: "Erase local Woodman progress and restart the visible game from level one.",
      inputSchema: emptyObjectSchema(),
      annotations: {readOnlyHint: false, untrustedContentHint: false},
      execute: callbacks.reset,
    },
  ];
}

function emptyObjectSchema(): Record<string, unknown> {
  return {type: "object", properties: {}, additionalProperties: false};
}
