import type { Wallet } from "@solana/solana-sdk"
import type { WatchAction, WatchActionSchemaAny, WatchActionResult } from "./actions/watch-action"
import type { WatchEngine } from "./engine-core"

type ActionRegistry = Map<string, WatchAction<WatchActionSchemaAny, unknown>>

const registry: ActionRegistry = new Map()

export function registerWatchAction<T extends WatchActionSchemaAny, R>(
  key: string,
  action: WatchAction<T, R>
): void {
  if (registry.has(key)) {
    throw new Error(`Action "${key}" already registered`)
  }
  registry.set(key, action)
}

export function resolveWatchAction(
  key: string
): WatchAction<WatchActionSchemaAny, unknown> {
  const action = registry.get(key)
  if (!action) throw new Error(`Action "${key}" not found`)
  return action
}

export async function execWatchActionByKey<R>(
  engine: WatchEngine,
  key: string,
  payload: unknown
): Promise<WatchActionResult<R>> {
  const action = resolveWatchAction(key)

  if (action.schema) {
    const parsed = action.schema.safeParse(payload)
    if (!parsed.success) {
      return { message: "Validation failed", errors: parsed.error.issues }
    }
    payload = parsed.data
  }

  // if action.func expects wallet as second arg
  const result = action.func.length > 1
    ? await (action.func as any)(payload, engine.wallet as Wallet)
    : await (action.func as any)(payload)

  return result as WatchActionResult<R>
}
