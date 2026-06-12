import type { ReactNode } from 'react';

// Bildschirm: weißes "Papier" auf grauem Grund. Druck: Browser übernimmt
// Seitenformat via @page (index.css), daher dort ohne feste Maße/Schatten.
export default function A4Page({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto my-8 w-[210mm] max-w-full min-h-[297mm] bg-white p-[15mm] shadow-md max-sm:p-6 print:my-0 print:min-h-0 print:w-auto print:p-0 print:shadow-none">
      {children}
    </section>
  );
}
