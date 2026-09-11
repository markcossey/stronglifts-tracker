import { useState } from 'react'
import type { BodyWeightEntry } from '../model/types'
import { localDateString } from '../model/dates'
import Button from '../ui/Button'

interface BodyWeightDialogProps {
  units: string
  entry?: BodyWeightEntry
  suggestedWeight?: number
  onSave: (entry: BodyWeightEntry, previousDate?: string) => void
  onDelete?: (date: string) => void
  onClose: () => void
}

export default function BodyWeightDialog({ units, entry, suggestedWeight, onSave, onDelete, onClose }: BodyWeightDialogProps) {
  const today = localDateString()
  const [weight, setWeight] = useState(String(entry?.weight ?? suggestedWeight ?? ''))
  const [date, setDate] = useState(entry?.date ?? today)

  const parsed = parseFloat(weight)
  const valid = !isNaN(parsed) && parsed > 0 && parsed < 1000 && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today

  function handleSave() {
    if (!valid) return
    onSave({ date, weight: Math.round(parsed * 10) / 10 }, entry?.date)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="body-weight-dialog-title"
        onSubmit={e => {
          e.preventDefault()
          handleSave()
        }}
        className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full space-y-4 border border-gray-800"
      >
        <h3 id="body-weight-dialog-title" className="text-lg font-bold text-gray-100">
          {entry ? 'Edit weigh-in' : 'Log body weight'}
        </h3>

        <label className="block space-y-1">
          <span className="text-sm text-gray-400">Weight</span>
          <span className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              step={0.1}
              min={0}
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-right text-lg font-mono text-gray-100 focus:border-[#47c23f] focus:ring-1 focus:ring-[#47c23f] outline-none"
            />
            <span className="text-gray-500">{units}</span>
          </span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-400">Date</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-[#47c23f] outline-none"
          />
        </label>

        <div className="flex gap-3">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth disabled={!valid}>Save</Button>
        </div>

        {entry && onDelete && (
          <button
            type="button"
            onClick={() => {
              onDelete(entry.date)
              onClose()
            }}
            className="w-full text-sm font-medium text-red-400 hover:text-red-300 py-1"
          >
            Delete weigh-in
          </button>
        )}
      </form>
    </div>
  )
}
