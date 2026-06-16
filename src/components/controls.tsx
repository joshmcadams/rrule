import type { ReactNode } from 'react'

/** Labeled field wrapper with an optional helper/hint line. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

/** Multi-select group of toggle buttons over a fixed set of options. */
export function ToggleGroup<T extends number>({
  options,
  selected,
  onToggle,
}: {
  options: { value: T; label: string }[]
  selected: T[]
  onToggle: (value: T) => void
}) {
  return (
    <div className="toggle-group">
      {options.map((opt) => {
        const active = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            className={active ? 'toggle toggle--on' : 'toggle'}
            aria-pressed={active}
            onClick={() => onToggle(opt.value)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A free-text input that parses a comma/space separated list of integers.
 * Invalid tokens are dropped. Used for all the numeric BY* filters.
 */
export function NumberListInput({
  value,
  onChange,
  placeholder,
}: {
  value: number[]
  onChange: (next: number[]) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      className="text-input"
      placeholder={placeholder}
      defaultValue={value.join(', ')}
      key={value.join(',')}
      onBlur={(e) => onChange(parseNumberList(e.target.value))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
    />
  )
}

export function parseNumberList(raw: string): number[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => Number(t))
    .filter((n) => Number.isInteger(n))
}
