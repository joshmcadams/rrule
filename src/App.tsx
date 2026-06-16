import { useMemo, useState } from 'react'
import { RRule } from 'rrule'
import { buildRule } from './rrule/buildRule'
import {
  DEFAULT_STATE,
  FREQ_OPTIONS,
  MONTHS,
  NUMERIC_FILTERS,
  WEEKDAYS,
  type BuilderState,
} from './rrule/types'
import { Field, NumberListInput, ToggleGroup } from './components/controls'
import { WeekdayPicker } from './components/WeekdayPicker'
import { Preview } from './components/Preview'
import { ThemeSwitcher, useTheme } from './components/ThemeSwitcher'
import { PRESETS } from './presets'

export default function App() {
  const [state, setState] = useState<BuilderState>(DEFAULT_STATE)
  const [theme, setTheme] = useTheme()

  const result = useMemo(() => buildRule(state), [state])

  // Generic field updater.
  const set = <K extends keyof BuilderState>(key: K, value: BuilderState[K]) =>
    setState((s) => ({ ...s, [key]: value }))

  const toggleNumber = (key: keyof BuilderState, value: number) => {
    const arr = state[key] as number[]
    set(
      key,
      (arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value].sort((a, b) => a - b)) as BuilderState[typeof key],
    )
  }

  return (
    // The theme rides on this component-owned wrapper (not <html>), and all CSS
    // is scoped under `.rrule-root`, so embedding the app in a larger page can't
    // clobber the host's own data-theme or global styles.
    <div
      className="rrule-root"
      data-theme={theme === 'midnight' ? undefined : theme}
    >
      <div className="app">
        <ThemeSwitcher theme={theme} onChange={setTheme} />
        <header className="app__header">
          <h1>RRULE Configuration Builder</h1>
          <p className="app__sub">
            A near-complete RFC 5545 recurrence editor. Every control below maps
            to a piece of the generated <code>RRULE</code>. Dates are treated as
            floating wall-clock time (no timezone conversion).
          </p>
          <div className="presets">
            <span className="presets__label">Try a preset:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="btn btn--small"
                title={p.description}
                onClick={() => setState(p.build())}
              >
                {p.name}
              </button>
            ))}
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setState(DEFAULT_STATE)}
            >
              Reset
            </button>
          </div>
        </header>

        <div className="layout">
          {/* ---------------- Config form ---------------- */}
          <form className="config" onSubmit={(e) => e.preventDefault()}>
            <fieldset className="card">
              <legend>Frequency</legend>
              <div className="row">
                <Field label="Repeats">
                  <select
                    className="select"
                    value={state.freq}
                    onChange={(e) => set('freq', Number(e.target.value))}
                  >
                    {FREQ_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Every (interval)" hint="e.g. 2 = every other">
                  <input
                    type="number"
                    min={1}
                    className="text-input"
                    value={state.interval}
                    onChange={(e) => set('interval', Number(e.target.value))}
                  />
                </Field>
              </div>
            </fieldset>

            <fieldset className="card">
              <legend>Anchor &amp; week start</legend>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={state.anchorEnabled}
                  onChange={(e) => set('anchorEnabled', e.target.checked)}
                />
                Specify a start anchor &amp; week start
              </label>
              <p className="card__note">
                Optional. <code>DTSTART</code> isn’t part of the{' '}
                <code>RRULE</code> property itself, so it can be omitted — the
                rule then serializes as a bare <code>RRULE:…</code> and
                occurrences are anchored to “now”.
              </p>
              {state.anchorEnabled && (
                <div className="row">
                  <Field label="Start (DTSTART)">
                    <input
                      type="datetime-local"
                      className="text-input"
                      value={state.dtstart}
                      onChange={(e) => set('dtstart', e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Week starts on (WKST)"
                    hint="Affects weekly INTERVAL math"
                  >
                    <select
                      className="select"
                      value={state.wkst ?? ''}
                      onChange={(e) =>
                        set('wkst', e.target.value === '' ? null : Number(e.target.value))
                      }
                    >
                      <option value="">Default (Monday)</option>
                      {WEEKDAYS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
            </fieldset>

            <fieldset className="card">
              <legend>Ends</legend>
              <div className="end-modes">
                <label className="radio">
                  <input
                    type="radio"
                    name="endMode"
                    checked={state.endMode === 'never'}
                    onChange={() => set('endMode', 'never')}
                  />
                  Never
                </label>
                <label className="radio">
                  <input
                    type="radio"
                    name="endMode"
                    checked={state.endMode === 'count'}
                    onChange={() => set('endMode', 'count')}
                  />
                  After
                  <input
                    type="number"
                    min={1}
                    className="text-input text-input--inline"
                    value={state.count}
                    disabled={state.endMode !== 'count'}
                    onChange={(e) => set('count', Number(e.target.value))}
                  />
                  occurrences (COUNT)
                </label>
                <label className="radio">
                  <input
                    type="radio"
                    name="endMode"
                    checked={state.endMode === 'until'}
                    onChange={() => set('endMode', 'until')}
                  />
                  On date (UNTIL)
                  <input
                    type="date"
                    className="text-input text-input--inline"
                    value={state.until}
                    disabled={state.endMode !== 'until'}
                    onChange={(e) => set('until', e.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="card">
              <legend>Days of week (BYDAY)</legend>
              <WeekdayPicker
                value={state.byweekday}
                onChange={(v) => set('byweekday', v)}
              />
            </fieldset>

            <fieldset className="card">
              <legend>Months (BYMONTH)</legend>
              <ToggleGroup
                options={MONTHS}
                selected={state.bymonth}
                onToggle={(v) => toggleNumber('bymonth', v)}
              />
            </fieldset>

            <fieldset className="card">
              <legend>Numeric filters</legend>
              <p className="card__note">
                Comma-separated lists. Negative values count from the end (e.g.{' '}
                <code>-1</code> = last). Press Enter or blur to apply.
              </p>
              <div className="grid">
                {NUMERIC_FILTERS.map((f) => (
                  <Field key={f.key} label={f.label} hint={f.hint}>
                    <NumberListInput
                      value={state[f.key]}
                      placeholder={f.placeholder}
                      onChange={(v) => set(f.key, v)}
                    />
                  </Field>
                ))}
              </div>
            </fieldset>
          </form>

          {/* ---------------- Live preview ---------------- */}
          <aside className="preview-pane">
            <Preview result={result} />
          </aside>
        </div>

        <footer className="app__footer">
          Built with{' '}
          <a href="https://github.com/jkbrzt/rrule" target="_blank" rel="noreferrer">
            rrule
          </a>{' '}
          · FREQ values:{' '}
          {FREQ_OPTIONS.map((f) => f.label).join(', ')} · Current FREQ ={' '}
          {RRule.FREQUENCIES[state.freq]}
        </footer>
      </div>
    </div>
  )
}
