// Anzeige-Einstellungen (#2): Theme + Schriftgröße. Persistiert in localStorage,
// als data-Attribute auf <html> gespiegelt (CSS in index.css greift darauf zu).
// Der Initialwert wird bereits im Boot-Script in index.html gesetzt, damit kein
// Flash entsteht; dieses Modul hält React-State und localStorage synchron.

export const THEMES = ['light', 'dark', 'contrast'] as const;
export type Theme = (typeof THEMES)[number];

export const FONT_SCALES = ['normal', 'large', 'xlarge'] as const;
export type FontScale = (typeof FONT_SCALES)[number];

const THEME_KEY = 'storyboard-creator:theme';
const FONT_KEY = 'storyboard-creator:fontScale';
const LEGACY_THEME_KEY = 'theme';
const LEGACY_FONT_KEY = 'fontScale';

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

function isFontScale(value: unknown): value is FontScale {
  return typeof value === 'string' && (FONT_SCALES as readonly string[]).includes(value);
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // localStorage kann blockiert sein (Privatmodus) — Default genügt.
  }
  return 'light';
}

export function readFontScale(): FontScale {
  try {
    const stored = localStorage.getItem(FONT_KEY) ?? localStorage.getItem(LEGACY_FONT_KEY);
    if (isFontScale(stored)) return stored;
  } catch {
    // s. o.
  }
  return 'normal';
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'light') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignorieren
  }
}

export function applyFontScale(scale: FontScale): void {
  const root = document.documentElement;
  if (scale === 'normal') root.removeAttribute('data-font');
  else root.setAttribute('data-font', scale);
  try {
    localStorage.setItem(FONT_KEY, scale);
  } catch {
    // ignorieren
  }
}
