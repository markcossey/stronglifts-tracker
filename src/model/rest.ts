export const REST_AFTER_SET = 180
export const REST_AFTER_MISS = 300

export function getRestDuration(completed: boolean): number {
  return completed ? REST_AFTER_SET : REST_AFTER_MISS
}
