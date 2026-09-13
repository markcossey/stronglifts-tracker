import type { ReactNode } from 'react'

// Renders the small subset of markdown the monthly reviews use: headings, paragraphs, bullet
// lists and bold. Everything becomes React elements, so page text can never inject HTML.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-100">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="font-mono text-[0.95em] text-gray-200">{part.slice(1, -1)}</code>
    }
    return <span key={i}>{part}</span>
  })
}

export default function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let paragraph: string[] = []
  let bullets: string[] = []

  function flushParagraph() {
    if (paragraph.length === 0) return
    blocks.push(
      <p key={`p${blocks.length}`} className="text-sm text-gray-300 leading-relaxed">
        {inline(paragraph.join(' '))}
      </p>,
    )
    paragraph = []
  }

  function flushBullets() {
    if (bullets.length === 0) return
    blocks.push(
      <ul key={`u${blocks.length}`} className="space-y-1">
        {bullets.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
            <span className="text-[#47c23f]" aria-hidden="true">•</span>
            <span>{inline(item)}</span>
          </li>
        ))}
      </ul>,
    )
    bullets = []
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (line.length === 0) {
      flushParagraph()
      flushBullets()
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      flushBullets()
      const level = heading[1].length
      const className = level === 1
        ? 'text-lg font-bold text-gray-100 pt-1'
        : 'text-sm font-semibold text-gray-400 uppercase tracking-wide pt-2'
      blocks.push(<h3 key={`h${blocks.length}`} className={className}>{inline(heading[2])}</h3>)
      continue
    }

    const bullet = line.match(/^[-*]\s+(.*)$/)
    if (bullet) {
      flushParagraph()
      bullets.push(bullet[1])
      continue
    }

    flushBullets()
    paragraph.push(line)
  }

  flushParagraph()
  flushBullets()

  return <div className="space-y-3">{blocks}</div>
}
