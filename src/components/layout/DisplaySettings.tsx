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
import { Moon, Contrast, Sun } from 'lucide-react';

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
          <Moon className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
        ) : theme === 'contrast' ? (
          <Contrast className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
        ) : (
          <Sun className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
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
