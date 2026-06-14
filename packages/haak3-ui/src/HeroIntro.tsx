import React from 'react';

export interface HeroIntroProps {
  kicker: string;
  title: string;
  subtitle: string;
  eduNotice: React.ReactNode;
}

// Kompakter Einstieg über dem A4-Dokument (SMC-Hero-Stil): Kicker, Headline,
// ein Satz und eine einzeilige Bildungs-Fußnote. Nicht im Druck.
export function HeroIntro({ kicker, title, subtitle, eduNotice }: HeroIntroProps) {
  return (
    <section className="mx-auto mt-6 max-w-screen-lg max-sm:mx-4 print:hidden">
      <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase">
        {kicker}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">{subtitle}</p>
      <p className="mt-3 text-xs text-slate-500">
        {eduNotice}
      </p>
    </section>
  );
}
