export type ColorTheme = 'system' | 'dark' | 'light'
const themes: ColorTheme[] = ['system', 'dark', 'light']

export function getTheme(): ColorTheme {
  const stored = localStorage.getItem('theme')
  return themes.includes(stored as ColorTheme) ? (stored as ColorTheme) : 'system'
}

export function setTheme(theme?: ColorTheme, save = false): ColorTheme {
  const selected =
    theme ?? (save ? themes[(themes.indexOf(getTheme()) + 1) % themes.length] : getTheme())
  if (save) localStorage.setItem('theme', selected)
  document.documentElement.dataset.themePreference = selected
  const dark =
    selected === 'dark' ||
    (selected === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  const background = getComputedStyle(document.documentElement)
    .getPropertyValue('--background')
    .trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `hsl(${background})`)
  return selected
}

/** Follow the OS only while system mode is selected. Returns cleanup for callers. */
export function listenThemeChange() {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (getTheme() === 'system') setTheme('system')
  }
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
