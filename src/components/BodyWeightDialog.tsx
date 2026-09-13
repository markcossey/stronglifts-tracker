import { useState } from 'react'
import type { BodyWeightEntry, BodyWeightUnits, Units } from '../model/types'
import { localDateString } from '../model/dates'
import { joinStones, numericUnits, splitStones, toShownWeight, toStoredWeight } from '../model/bodyWeight'
import Button from '../ui/Button'

interface BodyWeightDialogProps {
  units: Units
  bodyWeightUnits: BodyWeightUnits
  entry?: BodyWeightEntry
  suggestedWeight?: number
  onSave: (entry: BodyWeightEntry, previousDate: string | undefined, bodyWeightUnits: BodyWeightUnits) => void
  onDelete?: (date: string) => void
  onClose: () => void
}

const UNIT_OPTIONS: { id: BodyWeightUnits; label: string }[] = [
  { id: 'kg', label: 'kg' },
  { id: 'lb', label: 'lb' },
  { id: 'st', label: 'st & lb' },
]

interface Fields {
  weight: string
  stones: string
  pounds: string
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

// `weight` is in the shown units (pounds for stone).
function fieldsFor(weight: number | undefined, shown: BodyWeightUnits): Fields {
  if (weight === undefined) return { weight: '', stones: '', pounds: '' }
  if (shown !== 'st') return { weight: String(round1(weight)), stones: '', pounds: '' }
  const { stones, pounds } = splitStones(weight)
  return { weight: '', stones: String(stones), pounds: String(pounds) }
}

// Returns the weight in the shown units (pounds for stone), or null when the fields don't make one.
function parseFields(fields: Fields, shown: BodyWeightUnits): number | null {
  if (shown !== 'st') {
    const weight = parseFloat(fields.weight)
    return !isNaN(weight) && weight > 0 && weight < 1000 ? weight : null
  }
  if (fields.stones.trim() === '' && fields.pounds.trim() === '') return null
  const stones = fields.stones.trim() === '' ? 0 : Number(fields.stones)
  const pounds = fields.pounds.trim() === '' ? 0 : Number(fields.pounds)
  if (!Number.isInteger(stones) || stones < 0 || isNaN(pounds) || pounds < 0 || pounds >= 14) return null
  const total = joinStones(stones, pounds)
  return total > 0 && total < 1000 ? total : null
}

const inputClass =
  'flex-1 min-w-0 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-right text-lg font-mono text-gray-100 focus:border-[#47c23f] focus:ring-1 focus:ring-[#47c23f] outline-none'

export default function BodyWeightDialog({
  units,
  bodyWeightUnits,
  entry,
  suggestedWeight,
  onSave,
  onDelete,
  onClose,
}: BodyWeightDialogProps) {
  const today = localDateString()
  const [shown, setShown] = useState(bodyWeightUnits)
  const [fields, setFields] = useState(() => {
    const stored = entry?.weight ?? suggestedWeight
    return fieldsFor(stored === undefined ? undefined : toShownWeight(stored, units, bodyWeightUnits), bodyWeightUnits)
  })
  const [date, setDate] = useState(entry?.date ?? today)

  const parsed = parseFields(fields, shown)
  const valid = parsed !== null && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today

  function switchUnits(next: BodyWeightUnits) {
    if (next === shown) return
    const current = parseFields(fields, shown)
    const converted = current === null ? undefined : toShownWeight(current, numericUnits(shown), next)
    setFields(fieldsFor(converted, next))
    setShown(next)
  }

  function handleSave() {
    if (!valid || parsed === null) return
    onSave({ date, weight: toStoredWeight(parsed, shown, units) }, entry?.date, shown)
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

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-400">Weight</span>
            <div className="flex gap-1" role="group" aria-label="Units">
              {UNIT_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => switchUnits(option.id)}
                  aria-pressed={shown === option.id}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    shown === option.id ? 'bg-[#1a4a16]/50 text-[#47c23f]' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {shown === 'st' ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                aria-label="Stones"
                value={fields.stones}
                onChange={e => setFields({ ...fields, stones: e.target.value })}
                className={inputClass}
              />
              <span className="text-gray-500">st</span>
              <input
                type="number"
                inputMode="decimal"
                step={0.1}
                min={0}
                max={13.9}
                aria-label="Pounds"
                value={fields.pounds}
                onChange={e => setFields({ ...fields, pounds: e.target.value })}
                className={inputClass}
              />
              <span className="text-gray-500">lb</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                step={0.1}
                min={0}
                aria-label={`Weight in ${shown}`}
                value={fields.weight}
                onChange={e => setFields({ ...fields, weight: e.target.value })}
                className={inputClass}
              />
              <span className="text-gray-500">{shown}</span>
            </div>
          )}
        </div>

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
