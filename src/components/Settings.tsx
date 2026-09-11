import { useState, useRef } from 'react'
import type { AppState, LiftId, TapFeedback, Units } from '../model/types'
import { ALL_LIFTS, DEFAULT_TAP_FEEDBACK, LIFT_DISPLAY_NAMES } from '../model/defaults'
import { playTapSound, unlockAudio, vibrateTap } from '../ui/feedback'
import TapTarget from '../ui/TapTarget'
import { exportCSV, importData } from '../model/programme'
import { importStrongLiftsCSV } from '../model/importCSV'
import { localDateString } from '../model/dates'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import NumberField from '../ui/NumberField'

interface SettingsProps {
  state: AppState
  onUpdateSettings: (updates: Partial<Pick<AppState, 'increments' | 'tapFeedback'>>) => void
  onUpdateLiftWeight: (liftId: LiftId, weight: number) => void
  onConvertUnits: (units: Units) => void
  onExport: () => string
  onReplaceState: (state: AppState) => void
  onReset: () => void
}

interface PendingImport {
  state: AppState
  source: string
}

function workoutCount(n: number): string {
  return `${n} workout${n === 1 ? '' : 's'}`
}

interface ToggleRowProps {
  id: string
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ id, label, hint, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm text-gray-300">{label}</label>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
      <TapTarget
        id={id}
        haptic
        label={label}
        checked={checked}
        onTap={() => onChange(!checked)}
        round="999px"
        className="w-11 h-6 shrink-0 rounded-full"
      >
        <span className={`relative w-full h-full rounded-full transition-colors ${checked ? 'bg-[#3da836]' : 'bg-gray-700'}`}>
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`}
          />
        </span>
      </TapTarget>
    </div>
  )
}

export default function Settings({
  state,
  onUpdateSettings,
  onUpdateLiftWeight,
  onConvertUnits,
  onExport,
  onReplaceState,
  onReset,
}: SettingsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [pendingUnits, setPendingUnits] = useState<Units | null>(null)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)
  const tapFeedback = state.tapFeedback ?? DEFAULT_TAP_FEEDBACK

  function updateTapFeedback(update: Partial<TapFeedback>) {
    onUpdateSettings({ tapFeedback: { ...tapFeedback, ...update } })
    if (update.sound) {
      unlockAudio()
      playTapSound('complete')
    }
    if (update.haptics) vibrateTap()
  }

  function confirmUnits() {
    if (!pendingUnits) return
    onConvertUnits(pendingUnits)
    setPendingUnits(null)
  }

  function handleExportJSON() {
    const json = onExport()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stronglifts-backup-${localDateString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportCSV() {
    const csv = exportCSV(state)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stronglifts-history-${localDateString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    parse: (text: string) => AppState | { error: string },
    source: string,
  ) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = parse(reader.result as string)
      setImportSuccess(false)
      if ('error' in result) {
        setImportError(result.error)
      } else {
        setImportError(null)
        setPendingImport({ state: result, source })
      }
    }
    reader.readAsText(file)
  }

  function confirmImport() {
    if (!pendingImport) return
    onReplaceState(pendingImport.state)
    setPendingImport(null)
    setImportSuccess(true)
    setTimeout(() => setImportSuccess(false), 3000)
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
              onClick={() => {
                if (u !== state.units) setPendingUnits(u)
              }}
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

      <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
        <h3 className="font-semibold text-gray-100">Set Tap Feedback</h3>
        <ToggleRow
          id="tap-sound"
          label="Sound"
          hint="May be muted when your phone is on silent."
          checked={tapFeedback.sound}
          onChange={sound => updateTapFeedback({ sound })}
        />
        <ToggleRow
          id="tap-haptics"
          label="Haptics"
          hint="On iPhone, needs iOS 18 or later."
          checked={tapFeedback.haptics}
          onChange={haptics => updateTapFeedback({ haptics })}
        />
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
              <NumberField
                id={`inc-${liftId}`}
                step={0.25}
                min={0.25}
                value={state.increments[liftId]}
                onCommit={num => onUpdateSettings({ increments: { ...state.increments, [liftId]: num } })}
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
              <NumberField
                id={`weight-${liftId}`}
                step={state.increments[liftId]}
                min={0}
                value={state.lifts[liftId].currentWeight}
                onCommit={num => onUpdateLiftWeight(liftId, num)}
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
          <Button variant="secondary" fullWidth onClick={() => fileInputRef.current?.click()}>
            Import JSON Backup
          </Button>
          <Button variant="secondary" fullWidth onClick={() => csvInputRef.current?.click()}>
            Import StrongLifts CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={e => handleFileSelect(e, importData, 'backup')}
            className="hidden"
          />
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={e => handleFileSelect(e, importStrongLiftsCSV, 'StrongLifts export')}
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

      {pendingUnits && (
        <ConfirmDialog
          title={`Switch to ${pendingUnits === 'kg' ? 'kilograms' : 'pounds'}?`}
          confirmLabel="Convert"
          onConfirm={confirmUnits}
          onCancel={() => setPendingUnits(null)}
        >
          <p>
            Your workout history and records will be converted to {pendingUnits}. Working weights are
            rounded to the nearest {pendingUnits === 'kg' ? '2.5 kg' : '5 lb'}, and increments reset to
            the {pendingUnits} defaults.
          </p>
        </ConfirmDialog>
      )}

      {pendingImport && (
        <ConfirmDialog
          title="Replace all data?"
          confirmLabel="Replace"
          destructive
          onConfirm={confirmImport}
          onCancel={() => setPendingImport(null)}
        >
          <p>
            This replaces your current data ({workoutCount(state.workouts.length)}, working weights and
            settings) with the {workoutCount(pendingImport.state.workouts.length)} in this {pendingImport.source}.
          </p>
          <p>Export a backup first if you might want your current data back.</p>
        </ConfirmDialog>
      )}

      {showResetConfirm && (
        <ConfirmDialog
          title="Reset all data?"
          confirmLabel="Reset"
          destructive
          onConfirm={onReset}
          onCancel={() => setShowResetConfirm(false)}
        >
          <p>This will delete all workouts and settings. Consider exporting a backup first.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
