import { useState, useRef } from 'react'
import type { AppState, LiftId, Units } from '../model/types'
import { ALL_LIFTS, LIFT_DISPLAY_NAMES } from '../model/defaults'
import { convertWeight, exportCSV } from '../model/programme'
import Button from '../ui/Button'

interface SettingsProps {
  state: AppState
  onUpdateSettings: (updates: Partial<Pick<AppState, 'units' | 'increments'>>) => void
  onUpdateLiftWeight: (liftId: LiftId, weight: number) => void
  onExport: () => string
  onImport: (json: string) => string | null
  onImportCSV: (csv: string) => string | null
  onReset: () => void
}

export default function Settings({
  state,
  onUpdateSettings,
  onUpdateLiftWeight,
  onExport,
  onImport,
  onImportCSV,
  onReset,
}: SettingsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  function handleUnitsChange(newUnits: Units) {
    if (newUnits === state.units) return

    const confirmed = window.confirm(
      `Convert all weights from ${state.units} to ${newUnits}? This will convert your current weights and increments.`,
    )
    if (!confirmed) return

    const newIncrements = { ...state.increments }
    for (const liftId of ALL_LIFTS) {
      newIncrements[liftId] = convertWeight(state.increments[liftId], state.units, newUnits)
      const newWeight = convertWeight(state.lifts[liftId].currentWeight, state.units, newUnits)
      onUpdateLiftWeight(liftId, newWeight)
    }
    onUpdateSettings({ units: newUnits, increments: newIncrements })
  }

  function handleIncrementChange(liftId: LiftId, value: string) {
    const num = parseFloat(value)
    if (!isNaN(num) && num > 0) {
      onUpdateSettings({
        increments: { ...state.increments, [liftId]: num },
      })
    }
  }

  function handleWeightChange(liftId: LiftId, value: string) {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0) {
      onUpdateLiftWeight(liftId, num)
    }
  }

  function handleExportJSON() {
    const json = onExport()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stronglifts-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportCSV() {
    const csv = exportCSV(state)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stronglifts-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport() {
    fileInputRef.current?.click()
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const error = onImport(reader.result as string)
      if (error) {
        setImportError(error)
        setImportSuccess(false)
      } else {
        setImportError(null)
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleImportCSV() {
    csvInputRef.current?.click()
  }

  function handleCSVFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const error = onImportCSV(reader.result as string)
      if (error) {
        setImportError(error)
        setImportSuccess(false)
      } else {
        setImportError(null)
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Settings</h1>

      <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
        <h3 className="font-semibold text-gray-100">Units</h3>
        <div className="grid grid-cols-2 gap-2">
          {(['kg', 'lb'] as Units[]).map(u => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitsChange(u)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                state.units === u
                  ? 'bg-[#3da836] text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {u === 'kg' ? 'Kilograms' : 'Pounds'}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
        <h3 className="font-semibold text-gray-100">Weight Increments</h3>
        <p className="text-xs text-gray-500">How much weight to add after a successful workout.</p>
        {ALL_LIFTS.map(liftId => (
          <div key={liftId} className="flex items-center justify-between">
            <label className="text-sm text-gray-300" htmlFor={`inc-${liftId}`}>
              {LIFT_DISPLAY_NAMES[liftId]}
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`inc-${liftId}`}
                type="number"
                inputMode="decimal"
                step={0.25}
                min={0.25}
                value={state.increments[liftId]}
                onChange={e => handleIncrementChange(liftId, e.target.value)}
                className="w-20 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-right text-sm font-mono text-gray-100 focus:border-[#47c23f] outline-none"
              />
              <span className="text-xs text-gray-500 w-5">{state.units}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
        <h3 className="font-semibold text-gray-100">Current Working Weights</h3>
        <p className="text-xs text-gray-500">Manually adjust if needed. Does not change past workouts.</p>
        {ALL_LIFTS.map(liftId => (
          <div key={liftId} className="flex items-center justify-between">
            <label className="text-sm text-gray-300" htmlFor={`weight-${liftId}`}>
              {LIFT_DISPLAY_NAMES[liftId]}
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`weight-${liftId}`}
                type="number"
                inputMode="decimal"
                step={state.increments[liftId]}
                min={0}
                value={state.lifts[liftId].currentWeight}
                onChange={e => handleWeightChange(liftId, e.target.value)}
                className="w-24 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-right text-sm font-mono text-gray-100 focus:border-[#47c23f] outline-none"
              />
              <span className="text-xs text-gray-500 w-5">{state.units}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
        <h3 className="font-semibold text-gray-100">Data</h3>
        <div className="space-y-2">
          <Button variant="secondary" fullWidth onClick={handleExportJSON}>
            Export JSON Backup
          </Button>
          <Button variant="secondary" fullWidth onClick={handleExportCSV}>
            Export CSV History
          </Button>
          <Button variant="secondary" fullWidth onClick={handleImport}>
            Import JSON Backup
          </Button>
          <Button variant="secondary" fullWidth onClick={handleImportCSV}>
            Import StrongLifts CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVFileSelect}
            className="hidden"
          />
          {importError && (
            <p className="text-sm text-red-400">Import failed: {importError}</p>
          )}
          {importSuccess && (
            <p className="text-sm text-green-400">Data imported successfully!</p>
          )}
        </div>
      </section>

      <section className="bg-gray-900 rounded-xl border border-red-900/50 p-4 space-y-3">
        <h3 className="font-semibold text-red-400">Reset</h3>
        <p className="text-xs text-gray-500">Delete all data and start over. This cannot be undone.</p>
        <Button variant="danger" onClick={() => setShowResetConfirm(true)}>
          Reset All Data
        </Button>
      </section>

      <div className="text-center text-xs text-gray-600 py-4">
        StrongLifts 5×5 Tracker v1.0
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full space-y-4 border border-gray-800">
            <h3 className="text-lg font-bold text-gray-100">Reset all data?</h3>
            <p className="text-gray-400">This will delete all workouts and settings. Consider exporting a backup first.</p>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowResetConfirm(false)}>Cancel</Button>
              <Button variant="danger" fullWidth onClick={onReset}>Reset</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
