import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import AutoResizeTextarea from '../../shared/ui/AutoResizeTextarea';
import { labelClass } from '../../shared/ui/fieldStyles';

export default function PrePlanningSection() {
  const { t } = useTranslation();
  const prePlanning = useStoryboardStore((s) => s.prePlanning);
  const updatePrePlanning = useStoryboardStore((s) => s.updatePrePlanning);

  const hasPrePlanningContent = Boolean(
    prePlanning.logline || prePlanning.objective || prePlanning.roles || prePlanning.resources,
  );

  return (
    <details className="group mt-8" open={hasPrePlanningContent || undefined}>
      <summary className="flex cursor-pointer items-center gap-3 list-none [&::-webkit-details-marker]:hidden print:hidden">
        <h2 className="text-xs font-bold tracking-[0.16em] text-slate-700 uppercase transition-colors group-open:text-blue-700">
          {t('editor.planning')}
        </h2>
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      {/* Print-only heading since summary is hidden for cleaner print */}
      <div className="hidden items-center gap-3 print:flex">
        <h2 className="text-xs font-bold tracking-[0.16em] text-slate-700 uppercase">
          {t('editor.planning')}
        </h2>
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
        <div>
          <label className={labelClass} htmlFor="logline">
            {t('editor.logline')}
          </label>
          <AutoResizeTextarea
            id="logline"
            placeholder={t('editor.loglinePlaceholder')}
            value={prePlanning.logline}
            onChange={(e) => updatePrePlanning({ logline: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="objective">
            {t('editor.objective')}
          </label>
          <AutoResizeTextarea
            id="objective"
            placeholder={t('editor.objectivePlaceholder')}
            value={prePlanning.objective}
            onChange={(e) => updatePrePlanning({ objective: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="roles">
            {t('editor.roles')}
          </label>
          <AutoResizeTextarea
            id="roles"
            placeholder={t('editor.rolesPlaceholder')}
            value={prePlanning.roles}
            onChange={(e) => updatePrePlanning({ roles: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="resources">
            {t('editor.resources')}
          </label>
          <AutoResizeTextarea
            id="resources"
            placeholder={t('editor.resourcesPlaceholder')}
            value={prePlanning.resources}
            onChange={(e) => updatePrePlanning({ resources: e.target.value })}
          />
        </div>
      </div>
    </details>
  );
}
