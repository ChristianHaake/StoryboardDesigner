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
} from '../../styles/theme';
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
        className="relative inline-flex size-11 items-center justify-center rounded-lg text-slate-600 transition-[color,background-color,transform] motion-safe:active:scale-[0.96] hover:bg-slate-100 hover:text-slate-900"
      >
        {(
          [
            ['light', Sun],
            ['dark', Moon],
            ['contrast', Contrast],
          ] as const
        ).map(([mode, Icon]) => (
          <Icon
            key={mode}
            className={`absolute h-[18px] w-[18px] transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-0 motion-reduce:transition-none ${
              theme === mode ? 'scale-100 opacity-100 blur-0' : 'scale-25 opacity-0 blur-[4px]'
            }`}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        ))}
      </button>
      <button
        type="button"
        onClick={cycleFont}
        aria-label={t('display.fontLabel', { size: fontName })}
        title={t('display.fontLabel', { size: fontName })}
        className="inline-flex size-11 items-center justify-center rounded-lg text-slate-600 transition-[color,background-color,transform] motion-safe:active:scale-[0.96] hover:bg-slate-100 hover:text-slate-900"
      >
        <span aria-hidden="true" className="font-bold leading-none">
          <span className="text-xs">A</span>
          <span className="text-base">A</span>
        </span>
      </button>
    </div>
  );
}
