import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { selectProject, useStoryboardStore } from '../../store/useStoryboardStore';
import { exportProject, importProject, ImportError } from '../../utils/zipHandler';
import LanguageToggle from './LanguageToggle';
import BrandLogo from './BrandLogo';
import StatusPill from './StatusPill';

export default function TopBar() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const state = useStoryboardStore.getState();
    try {
      await exportProject(selectProject(state), state.images);
    } catch (err: unknown) {
      console.warn('Export fehlgeschlagen:', err);
      state.setErrorMessage(t('topbar.exportFailed'));
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const state = useStoryboardStore.getState();
    if (state.hasContent && !window.confirm(t('topbar.confirmReplace'))) {
      return;
    }
    try {
      const { project, images } = await importProject(file);
      useStoryboardStore.getState().loadProject(project, images, true);
      state.clearErrorMessage();
    } catch (err: unknown) {
      state.setErrorMessage(err instanceof ImportError ? err.message : t('topbar.importFailed'));
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur print:hidden">
      {/* Reihe 1: Marke + Status/Sprache/Lehrkräfte */}
      <div className="mx-auto flex max-w-screen-lg items-center justify-between gap-4 px-4 py-2.5">
        <BrandLogo />
        <div className="flex items-center gap-2 sm:gap-3">
          <StatusPill label={t('brand.localPill')} className="max-sm:hidden" />
          <Link
            to="/hilfe"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 max-[420px]:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 9l9-5 9 5-9 5-9-5Z" />
              <path d="M7 11v4c0 1.5 2.5 3 5 3s5-1.5 5-3v-4" />
            </svg>
            <span className="max-sm:hidden">{t('brand.forEducators')}</span>
          </Link>
          <LanguageToggle />
        </div>
      </div>
      {/* Reihe 2: globale Aktionen */}
      <div className="border-t border-slate-100 bg-slate-50/60">
        <nav
          aria-label={t('topbar.actions')}
          className="mx-auto flex max-w-screen-lg items-center gap-2 px-4 py-2 max-sm:grid max-sm:grid-cols-3"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <span className="max-[430px]:text-xs">{t('topbar.load')}</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 21V9m0 0 4 4m-4-4-4 4" />
              <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
            </svg>
            <span className="max-[430px]:text-xs">{t('topbar.save')}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 max-sm:col-span-1"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M7 8V3h10v5" />
              <path d="M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M7 14h10v7H7z" />
            </svg>
            <span className="max-[430px]:text-xs">{t('topbar.print')}</span>
          </button>
        </nav>
        <input
          ref={fileInputRef}
          type="file"
          accept=".storyboard,.zip"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </header>
  );
}
