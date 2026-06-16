import { ORDINALS, WEEKDAYS, type WeekdaySelection } from '../rrule/types'

/**
 * Edits the BYDAY portion of a rule. Supports two flavors that can coexist:
 *   1. plain weekdays (nth === null), e.g. "MO,WE,FR"
 *   2. ordinal weekdays (nth set), e.g. "1MO" (first Monday), "-1FR" (last Friday)
 */
export function WeekdayPicker({
  value,
  onChange,
}: {
  value: WeekdaySelection[]
  onChange: (next: WeekdaySelection[]) => void
}) {
  const plain = value.filter((w) => w.nth == null)
  const ordinals = value.filter((w) => w.nth != null)

  const togglePlain = (weekday: number) => {
    const exists = plain.some((w) => w.weekday === weekday)
    const nextPlain = exists
      ? plain.filter((w) => w.weekday !== weekday)
      : [...plain, { weekday, nth: null }]
    onChange([...nextPlain, ...ordinals])
  }

  const addOrdinal = () => {
    onChange([...value, { weekday: 0, nth: 1 }])
  }

  const updateOrdinal = (index: number, patch: Partial<WeekdaySelection>) => {
    const next = ordinals.map((w, i) => (i === index ? { ...w, ...patch } : w))
    onChange([...plain, ...next])
  }

  const removeOrdinal = (index: number) => {
    onChange([...plain, ...ordinals.filter((_, i) => i !== index)])
  }

  return (
    <div className="weekday-picker">
      <div className="toggle-group">
        {WEEKDAYS.map((d) => {
          const active = plain.some((w) => w.weekday === d.value)
          return (
            <button
              key={d.value}
              type="button"
              className={active ? 'toggle toggle--on' : 'toggle'}
              aria-pressed={active}
              onClick={() => togglePlain(d.value)}
            >
              {d.short}
            </button>
          )
        })}
      </div>

      <div className="ordinal-list">
        {ordinals.map((w, i) => (
          <div key={i} className="ordinal-row">
            <select
              className="select"
              value={w.nth ?? 1}
              onChange={(e) => updateOrdinal(i, { nth: Number(e.target.value) })}
            >
              {ORDINALS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={w.weekday}
              onChange={(e) =>
                updateOrdinal(i, { weekday: Number(e.target.value) })
              }
            >
              {WEEKDAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => removeOrdinal(i)}
              aria-label="Remove ordinal weekday"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn btn--small" onClick={addOrdinal}>
          + Add ordinal weekday (e.g. “1st Monday”)
        </button>
      </div>
    </div>
  )
}
