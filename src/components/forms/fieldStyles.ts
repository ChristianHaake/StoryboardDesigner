// Gemeinsame Feld-Styles für EditorView und SceneCard.
export const inputClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 print:rounded-none print:border-0 print:bg-transparent print:px-0 print:py-0 print:ring-0 print:placeholder:text-transparent';

export const labelClass =
  'mb-1.5 block text-sm font-medium text-slate-700 print:mb-0 print:text-xs';

// Button-Tokens: einheitliche Hierarchie über alle Aktionen (primär/sekundär/ghost).
// Höhe (min-h-*) wird je Verwendung gesetzt, damit 44-px-Touch-Ziele erhalten bleiben.
const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50';
export const buttonPrimary = `${buttonBase} bg-blue-600 px-4 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700`;
export const buttonSecondary = `${buttonBase} border border-slate-300 bg-white px-3 text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50`;
export const buttonGhost = `${buttonBase} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;
