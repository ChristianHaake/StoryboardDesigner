import React from 'react';
import { BrandLogo } from './BrandLogo';

export interface FooterProps {
  /** The application title for the logo */
  appTitle: string;
  /** The note about local processing/privacy */
  localNote: string;
  /** Aria label for the navigation section */
  navAriaLabel: string;
  /** Navigation links (e.g. standard <a> or react-router <Link>) */
  children: React.ReactNode;
}

export function Footer({ appTitle, localNote, navAriaLabel, children }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-screen-lg flex-wrap items-center justify-between gap-4 px-4 py-6">
        <BrandLogo appTitle={appTitle} showTagline={false} />
        <nav
          aria-label={navAriaLabel}
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600 [&_a]:font-medium [&_a]:hover:text-slate-950 [&_a]:hover:underline"
        >
          {children}
        </nav>
        <p className="text-xs text-slate-500 max-sm:w-full">{localNote}</p>
      </div>
    </footer>
  );
}
