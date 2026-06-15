import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SceneComment } from '../../domain/types';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import { buttonPrimary } from '../../shared/ui/fieldStyles';
import { MessageSquare, X } from 'lucide-react';

interface CommentThreadProps {
  sceneId: string;
  sceneNumber: number;
  comments: SceneComment[];
}

// Feedback-Thread einer Szene (Lehrkraft-Sicht). Komplett print:hidden.
export default memo(function CommentThread({ sceneId, sceneNumber, comments }: CommentThreadProps) {
  const { t } = useTranslation();
  const addComment = useStoryboardStore((s) => s.addComment);
  const toggleCommentDone = useStoryboardStore((s) => s.toggleCommentDone);
  const deleteComment = useStoryboardStore((s) => s.deleteComment);
  const [draft, setDraft] = useState('');

  const open = comments.filter((comment) => !comment.done).length;

  function submit() {
    if (!draft.trim()) return;
    addComment(sceneId, draft);
    setDraft('');
  }

  return (
    <section
      aria-label={t('feedback.sceneHeading', { n: sceneNumber })}
      className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 print:hidden"
    >
      <div className="mb-2 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-amber-700" strokeWidth={1.8} aria-hidden="true" />
        <h4 className="text-xs font-bold tracking-[0.14em] text-amber-800 uppercase">
          {t('feedback.heading')}
        </h4>
        {open > 0 && (
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
            {t('feedback.openCount', { count: open })}
          </span>
        )}
      </div>

      {comments.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            >
              <label className="-m-1.5 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={comment.done}
                  onChange={() => toggleCommentDone(sceneId, comment.id)}
                  aria-label={t('feedback.markDone', { text: comment.text })}
                  className="size-5 accent-blue-600"
                />
              </label>
              <span
                className={`min-w-0 flex-1 break-words ${comment.done ? 'text-slate-400 line-through' : ''}`}
              >
                {comment.text}
              </span>
              <button
                type="button"
                onClick={() => deleteComment(sceneId, comment.id)}
                aria-label={t('feedback.delete', { text: comment.text })}
                className="-m-1.5 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-700"
              >
                <X className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 max-sm:flex-col">
        <input
          type="text"
          value={draft}
          placeholder={t('feedback.addPlaceholder')}
          aria-label={t('feedback.addLabel', { n: sceneNumber })}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          className="min-h-11 flex-1 rounded-lg border border-amber-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
        />
        <button type="button" onClick={submit} className={`${buttonPrimary} min-h-11`}>
          {t('feedback.add')}
        </button>
      </div>
    </section>
  );
});
