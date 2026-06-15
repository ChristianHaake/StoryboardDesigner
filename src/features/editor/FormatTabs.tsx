import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import type { MetaData } from '../../domain/types';

const FORMATS: { id: MetaData['formatType']; labelKey: string }[] = [
  { id: 'film', labelKey: 'format.film' },
  { id: 'fotostory', labelKey: 'format.fotostory' },
  { id: 'rede', labelKey: 'format.rede' },
  { id: 'custom', labelKey: 'format.custom' },
];

// Prominente Formatwahl als Tablist (SMC-Modul-Tabs). Synchron mit dem
// Format-Select in den Metadaten — beide rufen setFormatType. Nicht im Druck.
export default function FormatTabs() {
  const { t } = useTranslation();
  const formatType = useStoryboardStore((s) => s.metaData.formatType);
  const setFormatType = useStoryboardStore((s) => s.setFormatType);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const dir = event.key === 'ArrowRight' ? 1 : -1;
    const next = (index + dir + FORMATS.length) % FORMATS.length;
    tabsRef.current[next]?.focus();
    setFormatType(FORMATS[next].id);
  }

  return (
    <div className="mx-auto mt-6 max-w-screen-lg max-sm:mx-4 print:hidden">
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {t('format.choose')}
      </p>
      <div role="tablist" aria-label={t('format.choose')} className="flex flex-wrap gap-2">
        {FORMATS.map((format, index) => {
          const active = formatType === format.id;
          return (
            <button
              key={format.id}
              ref={(el) => {
                tabsRef.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => setFormatType(format.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-100 ${
                active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              {t(format.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
