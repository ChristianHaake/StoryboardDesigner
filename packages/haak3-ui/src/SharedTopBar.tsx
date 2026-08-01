import React from 'react';

export interface SharedTopBarProps {
  /** The top row left content (usually the BrandLogo) */
  brandArea: React.ReactNode;
  /** The top row right content (language, status, feedback toggles) */
  controlsArea: React.ReactNode;
  /** The second row containing the primary workflow actions */
  actionsArea?: React.ReactNode;
  /** Custom aria-label for the actions nav */
  actionsAriaLabel?: string;
}

export function SharedTopBar({
  brandArea,
  controlsArea,
  actionsArea,
  actionsAriaLabel,
}: SharedTopBarProps) {
  return (
    <header className="relative z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur sm:sticky sm:top-0 print:hidden">
      <div className="mx-auto flex max-w-screen-lg flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:flex-nowrap sm:gap-4">
        <div className="min-w-0 shrink-0">{brandArea}</div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 sm:gap-2 lg:gap-3">
          {controlsArea}
        </div>
      </div>
      {actionsArea && (
        <div className="border-t border-slate-100 bg-slate-50/60">
          <nav
            aria-label={actionsAriaLabel}
            className="mx-auto flex max-w-screen-lg flex-wrap items-center gap-2 px-4 py-2"
          >
            {actionsArea}
          </nav>
        </div>
      )}
    </header>
  );
}
