import { useLayoutEffect, useRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { inputClass } from './fieldStyles';

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
      className={`${inputClass} resize-none overflow-hidden leading-6 ${className}`}
    />
  );
}
