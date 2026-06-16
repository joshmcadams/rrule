import { RRule } from 'rrule'

/** How the recurrence terminates. */
export type EndMode = 'never' | 'count' | 'until'

/**
 * A weekday selection that may optionally carry an ordinal (the "nth"),
 * e.g. nth = 1 -> "1st Monday", nth = -1 -> "last Friday".
 * `weekday` is rrule's numbering: MO=0, TU=1, ... SU=6.
 */
export interface WeekdaySelection {
  weekday: number
  nth: number | null
}

/**
 * The full editable state of the builder. Every field maps to a piece of an
 * RFC 5545 RRULE. Empty arrays / nulls mean "not set" and are omitted from the
 * generated rule.
 */
export interface BuilderState {
  // Core
  freq: number // RRule.YEARLY | MONTHLY | WEEKLY | DAILY | HOURLY | MINUTELY | SECONDLY
  interval: number
  // DTSTART is a separate iCalendar property, not part of the RRULE itself, so
  // it's optional. When `anchorEnabled` is false we omit both DTSTART and WKST
  // and the rule serializes as a bare "RRULE:..." (occurrences anchor to now).
  anchorEnabled: boolean
  dtstart: string // value from <input type="datetime-local">, e.g. "2026-01-01T09:00"
  wkst: number | null // week start: MO=0 ... SU=6, or null for library default

  // Termination (count and until are mutually exclusive)
  endMode: EndMode
  count: number
  until: string // value from <input type="date">, e.g. "2026-12-31"

  // BY* filters
  byweekday: WeekdaySelection[]
  bymonth: number[] // 1-12
  bymonthday: number[] // 1-31 or -31..-1
  byyearday: number[] // 1-366 or negative
  byweekno: number[] // 1-53 or negative (yearly only)
  byhour: number[] // 0-23
  byminute: number[] // 0-59
  bysecond: number[] // 0-59
  bysetpos: number[] // nth from the filtered set, may be negative
}

export const FREQ_OPTIONS = [
  { value: RRule.YEARLY, label: 'Yearly' },
  { value: RRule.MONTHLY, label: 'Monthly' },
  { value: RRule.WEEKLY, label: 'Weekly' },
  { value: RRule.DAILY, label: 'Daily' },
  { value: RRule.HOURLY, label: 'Hourly' },
  { value: RRule.MINUTELY, label: 'Minutely' },
  { value: RRule.SECONDLY, label: 'Secondly' },
]

/** Display order MO..SU matching rrule's weekday numbering 0..6. */
export const WEEKDAYS = [
  { value: 0, short: 'Mon', label: 'Monday' },
  { value: 1, short: 'Tue', label: 'Tuesday' },
  { value: 2, short: 'Wed', label: 'Wednesday' },
  { value: 3, short: 'Thu', label: 'Thursday' },
  { value: 4, short: 'Fri', label: 'Friday' },
  { value: 5, short: 'Sat', label: 'Saturday' },
  { value: 6, short: 'Sun', label: 'Sunday' },
]

export const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
]

/** Keys of the free-text numeric BY* filters (all hold a `number[]`). */
export type NumericFilterKey =
  | 'bymonthday'
  | 'byyearday'
  | 'byweekno'
  | 'bysetpos'
  | 'byhour'
  | 'byminute'
  | 'bysecond'

/** Drives the "Numeric filters" card — one comma-list input per entry. */
export const NUMERIC_FILTERS: {
  key: NumericFilterKey
  label: string
  hint: string
  placeholder: string
}[] = [
  { key: 'bymonthday', label: 'Day of month (BYMONTHDAY)', hint: '1…31 or -31…-1', placeholder: '1, 15, -1' },
  { key: 'byyearday', label: 'Day of year (BYYEARDAY)', hint: '1…366 or negative', placeholder: '1, 100, -1' },
  { key: 'byweekno', label: 'Week number (BYWEEKNO)', hint: 'Yearly only, 1…53', placeholder: '1, 26, -1' },
  { key: 'bysetpos', label: 'Set position (BYSETPOS)', hint: 'Nth of the matched set', placeholder: '1, -1' },
  { key: 'byhour', label: 'Hour (BYHOUR)', hint: '0…23', placeholder: '9, 17' },
  { key: 'byminute', label: 'Minute (BYMINUTE)', hint: '0…59', placeholder: '0, 30' },
  { key: 'bysecond', label: 'Second (BYSECOND)', hint: '0…59', placeholder: '0' },
]

export const ORDINALS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: '5th' },
  { value: -1, label: 'Last' },
  { value: -2, label: '2nd to last' },
]

export const DEFAULT_STATE: BuilderState = {
  freq: RRule.WEEKLY,
  interval: 1,
  anchorEnabled: true,
  dtstart: '2026-01-05T09:00',
  wkst: null,
  endMode: 'never',
  count: 10,
  until: '2026-12-31',
  byweekday: [],
  bymonth: [],
  bymonthday: [],
  byyearday: [],
  byweekno: [],
  byhour: [],
  byminute: [],
  bysecond: [],
  bysetpos: [],
}
