export const REST_AFTER_EASY = 90
export const REST_AFTER_HARD = 180
export const REST_AFTER_MISS = 300

// The app can't know how hard a set felt, so position in the lift stands in for it: the opening
// sets are the easiest, later sets need longer, and a missed set needs the longest.
export function getRestDuration(setIndex: number, completed: boolean): number {
  if (!completed) return REST_AFTER_MISS
  return setIndex < 2 ? REST_AFTER_EASY : REST_AFTER_HARD
}
