import type { AppState } from '../model/types'

/**
 * Three-way merge of app state, used when this device and the server have both
 * changed since the last sync (e.g. two devices used offline).
 *
 * - Lists (workouts, functional workouts, body weights, reviews) are merged item by
 *   item using each item's id/date/month: additions from both sides are kept, an item
 *   deleted on one side and untouched on the other is dropped, and if both sides edited
 *   the same item this device's version wins.
 * - Everything else (current lift weights, next workout type, settings…) is taken from
 *   whichever side changed it. If both changed it, the side with the most recent
 *   workout wins, so lift progression follows the latest training session.
 *
 * `base` is the state as last synced, or null if this device has never synced.
 */
export function mergeStates(base: AppState | null, local: AppState, remote: AppState): AppState {
  const winner = latestActivity(remote) > latestActivity(local) ? remote : local

  const merged: Record<string, unknown> = {}
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)])
  for (const key of keys) {
    if (key in LIST_KEYS) continue
    const k = key as keyof AppState
    const b = base ? json(base[k]) : undefined
    const l = json(local[k])
    const r = json(remote[k])
    let value: unknown
    if (l === r) value = local[k]
    else if (base && l === b) value = remote[k]
    else if (base && r === b) value = local[k]
    else value = winner[k]
    if (value !== undefined) merged[key] = value
  }

  for (const [key, spec] of Object.entries(LIST_KEYS)) {
    const k = key as ListKey
    const list = mergeList(
      base?.[k] as Item[] | undefined,
      local[k] as Item[] | undefined,
      remote[k] as Item[] | undefined,
      spec.key,
    )
    if (list.length > 0 || local[k] !== undefined || remote[k] !== undefined) {
      merged[key] = spec.sort ? [...list].sort(spec.sort) : list
    }
  }

  return merged as unknown as AppState
}

type Item = Record<string, unknown>
type ListKey = 'workouts' | 'functionalWorkouts' | 'bodyWeights' | 'reviews'

const byDateAsc = (a: Item, b: Item) => String(a.date).localeCompare(String(b.date))

const LIST_KEYS: Record<ListKey, { key: (i: Item) => string; sort?: (a: Item, b: Item) => number }> = {
  workouts: { key: i => String(i.id), sort: byDateAsc },
  functionalWorkouts: { key: i => String(i.id), sort: byDateAsc },
  bodyWeights: { key: i => String(i.date), sort: byDateAsc },
  reviews: { key: i => String(i.month), sort: (a, b) => String(b.month).localeCompare(String(a.month)) },
}

function mergeList(
  base: Item[] | undefined,
  local: Item[] | undefined,
  remote: Item[] | undefined,
  key: (i: Item) => string,
): Item[] {
  const baseJson = new Map((base ?? []).map(i => [key(i), json(i)]))
  const localMap = new Map((local ?? []).map(i => [key(i), i]))
  const remoteMap = new Map((remote ?? []).map(i => [key(i), i]))
  const out: Item[] = []

  // Local order first, then anything only the remote has.
  const ids = [...localMap.keys(), ...[...remoteMap.keys()].filter(id => !localMap.has(id))]
  for (const id of ids) {
    const l = localMap.get(id)
    const r = remoteMap.get(id)
    const b = baseJson.get(id)
    if (l && r) {
      out.push(b !== undefined && json(l) === b ? r : l)
    } else if (l) {
      // Only here: either added locally (keep) or deleted remotely. A remote deletion
      // wins unless this device edited the item since the last sync.
      if (b === undefined || json(l) !== b) out.push(l)
    } else if (r) {
      if (b === undefined || json(r) !== b) out.push(r)
    }
  }
  return out
}

/** Sortable timestamp of the most recent strength or functional session. */
export function latestActivity(state: AppState): string {
  let latest = ''
  for (const w of [...state.workouts, ...(state.functionalWorkouts ?? [])]) {
    // endTime/startTime are full ISO timestamps; older entries may only have a date.
    const stamp = w.endTime ?? w.startTime ?? w.date
    if (stamp > latest) latest = stamp
  }
  return latest
}

function json(value: unknown): string | undefined {
  return value === undefined ? undefined : JSON.stringify(value)
}
