import { useLayoutEffect, useRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

function resize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  // Leer: natürliche Höhe (rows) statt scrollHeight — der ist beim Mount
  // unzuverlässig, solange das Stylesheet noch nicht angewendet ist.
  if (el.value === '') {
    el.style.height = '';
    return;
  }
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export default function AutoResizeTextarea({ className = '', onInput, ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Deckt auch programmatische Wertänderungen ab (z. B. Autosave-Restore,
  // Projekt-Import), bei denen kein input-Event feuert.
  useLayoutEffect(() => {
    resize(ref.current);
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      onInput={(e) => {
        resize(e.currentTarget);
        onInput?.(e);
      }}
      className={`w-full resize-none overflow-hidden rounded-lg border border-transparent bg-gray-50 px-3 py-2.5 text-sm leading-6 text-gray-900 transition-colors placeholder:text-gray-400 hover:bg-gray-100 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 print:rounded-none print:border-0 print:bg-transparent print:px-0 print:py-0 print:ring-0 print:placeholder:text-transparent ${className}`}
    />
  );
}
