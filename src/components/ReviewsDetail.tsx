import { useRef, useState } from 'react'
import type { AppState, SavedReview } from '../model/types'
import { currentMonth, detectReviewMonth, formatReviewMonth, reviewSnippet } from '../model/reviews'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Markdown from '../ui/Markdown'

interface ReviewsDetailProps {
  state: AppState
  onSave: (review: SavedReview) => void
  onDelete: (month: string) => void
  onBack: () => void
}

export default function ReviewsDetail({ state, onSave, onDelete, onBack }: ReviewsDetailProps) {
  const [openMonth, setOpenMonth] = useState<string | null>(null)
  const [pasting, setPasting] = useState(false)
  const [draft, setDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reviews = state.reviews ?? []
  const open = reviews.find(r => r.month === openMonth)

  function save(markdown: string) {
    const trimmed = markdown.trim()
    if (!trimmed) return
    const month = detectReviewMonth(trimmed) ?? currentMonth()
    onSave({ month, markdown: trimmed, savedAt: new Date().toISOString() })
    setOpenMonth(month)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => save(String(reader.result))
    reader.readAsText(file)
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (open ? setOpenMonth(null) : onBack())}
          aria-label="Back"
          className="text-gray-400 hover:text-gray-200 p-1 -ml-1"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-100">
          {open ? formatReviewMonth(open.month) : 'Monthly Reviews'}
        </h1>
      </div>

      {open ? (
        <>
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <Markdown text={open.markdown} />
          </section>
          <Button variant="danger" onClick={() => setConfirmDelete(open.month)}>Delete review</Button>
        </>
      ) : (
        <>
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
            <p className="text-sm text-gray-400">
              Your monthly review is written into your private journal repo. Paste it here, or import the
              <code className="font-mono text-gray-300"> .md </code>
              file, to keep it on your phone and read it offline.
            </p>
            <div className="flex gap-3">
              <Button fullWidth onClick={() => { setDraft(''); setPasting(true) }}>Paste review</Button>
              <Button variant="secondary" fullWidth onClick={() => fileInputRef.current?.click()}>Import .md</Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              onChange={handleFile}
              className="hidden"
            />
          </section>

          {reviews.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No reviews saved yet.</p>
          ) : (
            <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden divide-y divide-gray-800">
              {reviews.map(review => (
                <button
                  key={review.month}
                  type="button"
                  onClick={() => setOpenMonth(review.month)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-800/50 active:bg-gray-800 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-100">{formatReviewMonth(review.month)}</div>
                    <div className="text-xs text-gray-500 truncate">{reviewSnippet(review.markdown)}</div>
                  </div>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </section>
          )}
        </>
      )}

      {pasting && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div role="dialog" aria-modal="true" aria-label="Paste review" className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full space-y-4 border border-gray-800">
            <h3 className="text-lg font-bold text-gray-100">Paste review</h3>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={8}
              placeholder="# September 2026 review…"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-[#47c23f] outline-none"
            />
            <p className="text-xs text-gray-500">The month is taken from the review's heading.</p>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setPasting(false)}>Cancel</Button>
              <Button
                fullWidth
                disabled={draft.trim().length === 0}
                onClick={() => { save(draft); setPasting(false) }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete review?"
          confirmLabel="Delete"
          destructive
          onConfirm={() => {
            onDelete(confirmDelete)
            setConfirmDelete(null)
            setOpenMonth(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        >
          <p>It stays in your journal repo, so you can paste it back in later.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
