import type {
  AppState,
  ExerciseResult,
  LiftId,
  LiftState,
  SetResult,
  Workout,
  WorkoutType,
} from './types'
import { ALL_LIFTS, getDefaultIncrements } from './defaults'

const EXERCISE_MAP: Record<string, LiftId> = {
  'squat': 'squat',
  'bench press': 'bench',
  'barbell row': 'row',
  'overhead press': 'ohp',
  'deadlift': 'deadlift',
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current)
  return fields
}

interface CSVRow {
  date: string
  workoutNum: number
  workoutName: string
  exercise: string
  setsReps: string
  startTime: string
  endTime: string
  notes: string
  sets: { reps: number; weight: number }[]
}

function parseRow(fields: string[]): CSVRow | null {
  if (fields.length < 18) return null

  const exercise = fields[5]?.trim()
  if (!exercise) return null

  const sets: { reps: number; weight: number }[] = []
  for (let i = 17; i < fields.length; i += 2) {
    const reps = parseInt(fields[i] ?? '', 10)
    const weight = parseFloat(fields[i + 1] ?? '')
    if (!isNaN(reps) && !isNaN(weight)) {
      sets.push({ reps, weight })
    }
  }

  return {
    date: fields[0]?.trim() ?? '',
    workoutNum: parseInt(fields[1] ?? '0', 10),
    workoutName: fields[2]?.replace(/"/g, '').trim() ?? '',
    exercise,
    setsReps: fields[6]?.trim() ?? '',
    startTime: fields[14]?.trim() ?? '',
    endTime: fields[15]?.trim() ?? '',
    notes: fields[16]?.replace(/"/g, '').trim() ?? '',
    sets,
  }
}

function resolveWorkoutType(workoutName: string): WorkoutType {
  if (workoutName.includes('Workout B')) return 'B'
  return 'A'
}

function parseDuration(startTime: string, endTime: string): number | undefined {
  function parseTime(t: string): number | null {
    const match = t.match(/(\d+):(\d+)\s*(am|pm)/i)
    if (!match) return null
    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const ampm = match[3].toLowerCase()
    if (ampm === 'pm' && hours !== 12) hours += 12
    if (ampm === 'am' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  const start = parseTime(startTime)
  const end = parseTime(endTime)
  if (start === null || end === null) return undefined
  let diff = end - start
  if (diff < 0) diff += 24 * 60
  return diff
}

export function importStrongLiftsCSV(csv: string): AppState | { error: string } {
  const lines = csv.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { error: 'CSV file is empty or has no data rows' }

  const rows: CSVRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    const row = parseRow(fields)
    if (row) rows.push(row)
  }

  if (rows.length === 0) return { error: 'No valid data rows found in CSV' }

  const workoutGroups = new Map<number, CSVRow[]>()
  for (const row of rows) {
    const existing = workoutGroups.get(row.workoutNum) ?? []
    existing.push(row)
    workoutGroups.set(row.workoutNum, existing)
  }

  const workouts: Workout[] = []

  const sortedWorkoutNums = Array.from(workoutGroups.keys()).sort((a, b) => a - b)

  for (const workoutNum of sortedWorkoutNums) {
    const group = workoutGroups.get(workoutNum)!
    const first = group[0]
    const date = first.date.replace(/\//g, '-')
    const type = resolveWorkoutType(first.workoutName)
    const duration = parseDuration(first.startTime, first.endTime)

    const exercises: ExerciseResult[] = []

    for (const row of group) {
      const liftId = EXERCISE_MAP[row.exercise.toLowerCase()]
      if (!liftId) continue

      if (row.setsReps === 'Skipped' || row.sets.length === 0) {
        continue
      }

      const weight = row.sets[0]?.weight ?? 0
      if (weight === 0) continue

      const allZeroReps = row.sets.every(s => s.reps === 0)
      if (allZeroReps) continue

      const targetReps = liftId === 'deadlift' ? 5 : 5
      const sets: SetResult[] = row.sets.map(s => ({
        reps: s.reps,
        targetReps,
        completed: s.reps >= targetReps,
      }))

      exercises.push({
        liftId,
        prescribedWeight: weight,
        sets,
        notes: row.notes || undefined,
      })
    }

    if (exercises.length === 0) continue

    workouts.push({
      id: crypto.randomUUID(),
      date,
      type,
      exercises,
      durationMinutes: duration,
    })
  }

  if (workouts.length === 0) return { error: 'No valid workouts found in CSV' }

  const lifts = {} as Record<LiftId, LiftState>
  for (const liftId of ALL_LIFTS) {
    let maxWeight = 0
    let maxWeightDate = workouts[0].date
    let lastWeight = 0

    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (ex.liftId === liftId) {
          lastWeight = ex.prescribedWeight
          if (ex.prescribedWeight > maxWeight) {
            maxWeight = ex.prescribedWeight
            maxWeightDate = w.date
          }
        }
      }
    }

    if (lastWeight === 0) {
      lastWeight = liftId === 'deadlift' ? 40 : 20
      maxWeight = lastWeight
      maxWeightDate = workouts[0].date
    }

    let recentFailures = 0
    for (let i = workouts.length - 1; i >= 0; i--) {
      const ex = workouts[i].exercises.find(e => e.liftId === liftId)
      if (!ex) continue
      const allComplete = ex.sets.every(s => s.completed)
      if (allComplete) break
      recentFailures++
      if (recentFailures >= 3) break
    }

    lifts[liftId] = {
      currentWeight: lastWeight,
      failureCount: recentFailures,
      deloadCount: 0,
      status: recentFailures >= 2 ? 'stalled' : recentFailures >= 1 ? 'failed' : 'progressing',
      personalRecord: maxWeight,
      personalRecordDate: maxWeightDate,
      repScheme: '5x5',
    }
  }

  const lastWorkout = workouts[workouts.length - 1]
  const nextWorkoutType: WorkoutType = lastWorkout.type === 'A' ? 'B' : 'A'

  return {
    version: 1,
    units: 'kg',
    setupComplete: true,
    nextWorkoutType,
    lifts,
    increments: getDefaultIncrements('kg'),
    workouts,
  }
}
