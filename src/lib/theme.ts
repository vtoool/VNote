export type ThemeMode = 'light' | 'dark'
export type Accent = 'indigo' | 'violet'

const THEME_KEY = 'vnote-theme'

export interface ThemeState {
  mode: ThemeMode
  accent: Accent
}

export function loadTheme(): ThemeState {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Unable to load theme', error)
  }
  return { mode: 'light', accent: 'indigo' }
}

export function saveTheme(theme: ThemeState) {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme))
  } catch (error) {
    console.warn('Unable to save theme', error)
  }
}

export function applyTheme(theme: ThemeState) {
  const root = document.documentElement
  if (theme.mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.dataset.accent = theme.accent
}
