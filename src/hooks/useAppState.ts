import { useState, useEffect, useCallback } from 'react'
import type { AppState, LiftId, Units, Workout } from '../model/types'
import {
  createAppState,
  exportData,
  getWorkoutPrescription,
  importData,
  processWorkoutResult,
  updateWorkoutInHistory,
  deleteWorkoutFromHistory,
} from '../model/programme'
import { importStrongLiftsCSV } from '../model/importCSV'
import { clearDraft } from '../model/workoutDraft'

const STORAGE_KEY = 'stronglifts-app-state'

function loadState(): AppState | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  const parsed = importData(stored)
  if ('error' in parsed) {
    console.error('Corrupted state:', parsed.error)
    return null
  }
  return parsed
}

export function useAppState() {
  const [state, setState] = useState<AppState | null>(loadState)

  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, exportData(state))
    }
  }, [state])

  const completeWorkout = useCallback((workout: Workout) => {
    setState(prev => prev ? processWorkoutResult(prev, workout) : prev)
  }, [])

  const editWorkout = useCallback((workoutId: string, updated: Workout) => {
    setState(prev => prev ? updateWorkoutInHistory(prev, workoutId, updated) : prev)
  }, [])

  const deleteWorkout = useCallback((workoutId: string) => {
    setState(prev => prev ? deleteWorkoutFromHistory(prev, workoutId) : prev)
  }, [])

  const updateSettings = useCallback((updates: Partial<Pick<AppState, 'units' | 'increments'>>) => {
    setState(prev => prev ? { ...prev, ...updates } : prev)
  }, [])

  const updateLiftWeight = useCallback((liftId: LiftId, weight: number) => {
    setState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        lifts: {
          ...prev.lifts,
          [liftId]: { ...prev.lifts[liftId], currentWeight: weight },
        },
      }
    })
  }, [])

  const initializeApp = useCallback((units: Units, startingWeights: Record<LiftId, number>) => {
    setState(createAppState(units, startingWeights))
  }, [])

  const resetApp = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    clearDraft()
    setState(null)
  }, [])

  const doExport = useCallback(() => {
    return state ? exportData(state) : ''
  }, [state])

  const doImport = useCallback((json: string): string | null => {
    const result = importData(json)
    if ('error' in result) return result.error
    setState(result)
    return null
  }, [])

  const doImportCSV = useCallback((csv: string): string | null => {
    const result = importStrongLiftsCSV(csv)
    if ('error' in result) return result.error
    setState(result)
    return null
  }, [])

  return {
    state,
    isSetupRequired: state === null || !state.setupComplete,
    completeWorkout,
    editWorkout,
    deleteWorkout,
    updateSettings,
    updateLiftWeight,
    initializeApp,
    resetApp,
    exportState: doExport,
    importState: doImport,
    importCSV: doImportCSV,
    prescription: state ? getWorkoutPrescription(state) : null,
  }
}
