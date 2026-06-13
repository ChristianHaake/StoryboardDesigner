import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FONT_SCALES,
  THEMES,
  applyFontScale,
  applyTheme,
  readFontScale,
  readTheme,
  type FontScale,
  type Theme,
} from '../../theme';

const THEME_LABEL: Record<Theme, string> = {
  light: 'display.themeLight',
  dark: 'display.themeDark',
  contrast: 'display.themeContrast',
};

const FONT_LABEL: Record<FontScale, string> = {
  normal: 'display.fontNormal',
  large: 'display.fontLarge',
  xlarge: 'display.fontXlarge',
};

function next<T>(list: readonly T[], current: T): T {
  return list[(list.indexOf(current) + 1) % list.length];
}

// Anzeige-Umschalter (#2): Theme (hell/dunkel/Kontrast) + Schriftgröße.
// Beide zyklisch; je ein Button mit aria-label + Tooltip.
export default function DisplaySettings() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [font, setFont] = useState<FontScale>(readFontScale);

  function cycleTheme() {
    const value = next(THEMES, theme);
    applyTheme(value);
    setTheme(value);
  }

  function cycleFont() {
    const value = next(FONT_SCALES, font);
    applyFontScale(value);
    setFont(value);
  }

  const themeName = t(THEME_LABEL[theme]);
  const fontName = t(FONT_LABEL[font]);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={cycleTheme}
        aria-label={t('display.themeLabel', { mode: themeName })}
        title={t('display.themeLabel', { mode: themeName })}
        className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        {theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
          </svg>
        ) : theme === 'contrast' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v18Z" fill="currentColor" />
            <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={cycleFont}
        aria-label={t('display.fontLabel', { size: fontName })}
        title={t('display.fontLabel', { size: fontName })}
        className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <span aria-hidden="true" className="font-bold leading-none">
          <span className="text-xs">A</span>
          <span className="text-base">A</span>
        </span>
      </button>
    </div>
  );
}
