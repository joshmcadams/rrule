import { useEffect, useState } from 'react'

/**
 * Theme picker. The selected theme is applied by `App` as a `data-theme`
 * attribute on the component-owned `.rrule-root` wrapper (theme CSS lives in
 * themes.css, scoped under `.rrule-root`), so embedding the app can't clobber
 * the host page. The choice persists to localStorage and honors a `?theme=` URL
 * param so a specific look can be linked directly. Adding a theme = a new
 * `.rrule-root[data-theme]` block in themes.css plus an entry below.
 */
const THEME_GROUPS = [
  {
    label: 'Dark',
    themes: [
      { id: 'midnight', label: 'Midnight' },
      { id: 'nord', label: 'Nord' },
      { id: 'terminal', label: 'Terminal' },
      { id: 'glass', label: 'Glass' },
    ],
  },
  {
    label: 'Light',
    themes: [
      { id: 'paper', label: 'Paper' },
      { id: 'soft', label: 'Soft' },
      { id: 'sepia', label: 'Sepia' },
      { id: 'brutalist', label: 'Brutalist' },
      { id: 'contrast', label: 'High contrast' },
    ],
  },
] as const

const THEME_IDS = THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.id))
export type ThemeId = (typeof THEME_IDS)[number]

// Namespaced so the key can't collide with the host page's own storage.
const STORAGE_KEY = 'rrule:theme'

function initialTheme(): ThemeId {
  const fromUrl = new URLSearchParams(window.location.search).get('theme')
  const stored = window.localStorage.getItem(STORAGE_KEY)
  const candidate = fromUrl ?? stored ?? 'midnight'
  return (THEME_IDS as readonly string[]).includes(candidate)
    ? (candidate as ThemeId)
    : 'midnight'
}

/** Theme state + persistence. App owns the value and applies it to the wrapper. */
export function useTheme(): [ThemeId, (next: ThemeId) => void] {
  const [theme, setTheme] = useState<ThemeId>(initialTheme)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return [theme, setTheme]
}

export function ThemeSwitcher({
  theme,
  onChange,
}: {
  theme: ThemeId
  onChange: (next: ThemeId) => void
}) {
  return (
    <div className="theme-switcher">
      <label className="theme-switcher__label" htmlFor="theme-select">
        Theme
      </label>
      <select
        id="theme-select"
        className="select theme-switcher__select"
        value={theme}
        onChange={(e) => onChange(e.target.value as ThemeId)}
      >
        {THEME_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
