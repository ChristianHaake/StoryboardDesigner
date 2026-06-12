import type { ReactNode } from 'react';

// Bildschirm: weißes "Papier" auf grauem Grund. Druck: Browser übernimmt
// Seitenformat via @page (index.css), daher dort ohne feste Maße/Schatten.
export default function A4Page({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto my-6 min-h-[297mm] w-[210mm] max-w-[calc(100%-2rem)] rounded-xl bg-white p-[15mm] shadow-[0_18px_50px_-12px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5 max-sm:my-0 max-sm:min-h-screen max-sm:w-full max-sm:max-w-none max-sm:rounded-none max-sm:p-5 max-sm:shadow-none max-sm:ring-0 print:my-0 print:min-h-0 print:w-auto print:max-w-none print:rounded-none print:p-0 print:shadow-none print:ring-0">
      {children}
    </section>
  );
}
