import { useState } from 'react'
import { formatOccurrence, PREVIEW_LIMIT, type BuildResult } from '../rrule/buildRule'

export function Preview({ result }: { result: BuildResult }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.rruleString)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be unavailable in some contexts; ignore */
    }
  }

  if (result.error) {
    return (
      <div className="preview">
        <div className="preview__error">
          <strong>Invalid rule:</strong> {result.error}
        </div>
      </div>
    )
  }

  return (
    <div className="preview">
      <section className="preview__block">
        <h3>Human readable</h3>
        <p className="preview__text">{result.text}</p>
      </section>

      <section className="preview__block">
        <div className="preview__head">
          <h3>RRULE string</h3>
          <button type="button" className="btn btn--small" onClick={copy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="preview__code">{result.rruleString}</pre>
      </section>

      <section className="preview__block">
        <h3>
          Next occurrences{' '}
          <span className="preview__muted">
            {result.infinite
              ? `(showing first ${PREVIEW_LIMIT} — rule is infinite)`
              : `(${result.occurrences.length} total shown, capped at ${PREVIEW_LIMIT})`}
          </span>
        </h3>
        {result.occurrences.length === 0 ? (
          <p className="preview__muted">No occurrences match this rule.</p>
        ) : (
          <ol className="occurrences">
            {result.occurrences.map((d, i) => (
              <li key={i}>{formatOccurrence(d)}</li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
