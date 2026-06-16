import { RRule, Weekday, type Options } from 'rrule'
import type { BuilderState } from './types'

/**
 * rrule operates on UTC date components. To make the builder behave like a
 * "floating" wall-clock (what you type is what you see), we anchor every date
 * at its UTC components and format occurrences back using UTC getters.
 */
function parseLocalAsUTC(datetimeLocal: string): Date | null {
  // Accepts "YYYY-MM-DDТHH:mm" (or with seconds) or "YYYY-MM-DD".
  const m = datetimeLocal.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  )
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  return new Date(
    Date.UTC(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h ?? 0),
      Number(mi ?? 0),
      Number(s ?? 0),
    ),
  )
}

/** Format an rrule occurrence (whose UTC parts hold the wall-clock) for display. */
export function formatOccurrence(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export interface BuildResult {
  rule: RRule | null
  rruleString: string // full DTSTART + RRULE text, ready to store
  text: string // human-readable ("every week on Monday")
  occurrences: Date[] // first N matches (or [] if infinite-with-no-anchor errors)
  infinite: boolean
  error: string | null
}

const PREVIEW_LIMIT = 12

/** Translate the editable state into rrule Options, omitting unset fields. */
function toOptions(state: BuilderState): Partial<Options> {
  const opts: Partial<Options> = {
    freq: state.freq,
    interval: state.interval > 0 ? state.interval : 1,
  }

  if (state.anchorEnabled) {
    const dtstart = parseLocalAsUTC(state.dtstart)
    if (dtstart) opts.dtstart = dtstart

    if (state.wkst !== null) opts.wkst = state.wkst
  }

  if (state.endMode === 'count') {
    opts.count = state.count
  } else if (state.endMode === 'until') {
    const until = parseLocalAsUTC(state.until)
    if (until) opts.until = until
  }

  if (state.byweekday.length > 0) {
    opts.byweekday = state.byweekday.map((w) =>
      w.nth == null ? new Weekday(w.weekday) : new Weekday(w.weekday, w.nth),
    )
  }

  // The remaining BY* filters all map 1:1 from a `number[]` in state to the same
  // option key; copy across any that are set, omitting empties.
  const NUMERIC_BY_KEYS = [
    'bymonth',
    'bymonthday',
    'byyearday',
    'byweekno',
    'byhour',
    'byminute',
    'bysecond',
    'bysetpos',
  ] as const satisfies readonly (keyof BuilderState & keyof Options)[]

  for (const key of NUMERIC_BY_KEYS) {
    const values = state[key] as number[]
    if (values.length > 0) opts[key] = values
  }

  return opts
}

export function buildRule(state: BuilderState): BuildResult {
  try {
    const rule = new RRule(toOptions(state))
    const infinite = state.endMode === 'never'

    // For infinite rules we cap with an iterator; for finite ones .all() is safe
    // but we still cap the preview so we never render thousands of rows.
    const occurrences: Date[] = []
    rule.all((date, i) => {
      occurrences.push(date)
      return i + 1 < PREVIEW_LIMIT
    })

    let text = ''
    try {
      text = rule.toText()
    } catch {
      text = '(no human-readable form available for this rule)'
    }

    return {
      rule,
      rruleString: rule.toString(),
      text,
      occurrences,
      infinite,
      error: null,
    }
  } catch (err) {
    return {
      rule: null,
      rruleString: '',
      text: '',
      occurrences: [],
      infinite: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export { PREVIEW_LIMIT }
