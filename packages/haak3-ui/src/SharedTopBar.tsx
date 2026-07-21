import React, { useEffect, useState } from 'react';

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
  // Beim Scrollen die Marken-Zeile einklappen, damit auf Tablets mehr
  // Dokument sichtbar bleibt. focus-within klappt sie für Tastatur wieder auf.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Hysterese statt einzelner Schwelle: Das Einklappen ändert die Kopfhöhe
    // und damit scrollY selbst — mit nur einer Schwelle oszilliert die Zeile
    // nahe dem Schwellwert (sichtbares Flackern, instabile Klickziele).
    const onScroll = () =>
      setCollapsed((prev) => (prev ? window.scrollY > 40 : window.scrollY > 120));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur print:hidden">
      {/* Reihe 1: Marke + Status/Sprache/Lehrkräfte — klappt beim Scrollen ein */}
      <div
        className={`mx-auto flex max-w-screen-lg items-center justify-between gap-4 overflow-hidden px-4 transition-all duration-200 focus-within:max-h-24 focus-within:py-2.5 focus-within:opacity-100 ${
          collapsed ? 'max-h-0 py-0 opacity-0' : 'max-h-24 py-2.5 opacity-100'
        }`}
      >
        {brandArea}
        <div className="flex items-center gap-2 sm:gap-3">
          {controlsArea}
        </div>
      </div>
      {/* Reihe 2: globale Aktionen */}
      {actionsArea && (
        <div className="border-t border-slate-100 bg-slate-50/60">
          <nav
            aria-label={actionsAriaLabel}
            className="mx-auto flex max-w-screen-lg items-center gap-2 px-4 py-2 max-sm:grid max-sm:grid-cols-2"
          >
            {actionsArea}
          </nav>
        </div>
      )}
    </header>
  );
}
