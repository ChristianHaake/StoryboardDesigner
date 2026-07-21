import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import { ArrowLeft, ArrowRight, Settings } from 'lucide-react';
import { useState } from 'react';
import type { Complexity } from '../../domain/types';
import { buttonPrimary, inputClass } from '../../shared/ui/fieldStyles';

export default function SetupScreen() {
  const { t } = useTranslation();
  const metaData = useStoryboardStore((s) => s.metaData);
  const updateMetaData = useStoryboardStore((s) => s.updateMetaData);
  const setWizardStep = useStoryboardStore((s) => s.setWizardStep);

  const [groupMembersStr, setGroupMembersStr] = useState(metaData.groupMembers.join(', '));
  const [prevGroupMembers, setPrevGroupMembers] = useState(metaData.groupMembers);

  if (metaData.groupMembers !== prevGroupMembers) {
    setPrevGroupMembers(metaData.groupMembers);
    setGroupMembersStr(metaData.groupMembers.join(', '));
  }

  const handleNext = () => {
    // Validate if necessary
    setWizardStep('editor');
  };

  return (
    <div className="mx-auto max-w-3xl py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="mb-8">
        <button
          onClick={() => setWizardStep('start')}
          className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('wizard.setupBack')}
        </button>
      </div>

      <div className="mb-10 flex items-center gap-4">
        <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 ring-1 ring-inset ring-blue-500/20">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('wizard.setupTitle')}
          </h1>
          <p className="mt-1 text-slate-500">
            {t(`format.${metaData.productType}`)} · {t('wizard.setupStep')}
          </p>
        </div>
      </div>

      <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Basic Info */}
        <div className="space-y-6">
          <div>
            <label htmlFor="projectName" className="block text-sm font-semibold text-slate-900">
              {t('wizard.projectNameRequired')} <span className="text-red-500">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              value={metaData.projectName}
              onChange={(e) => updateMetaData({ projectName: e.target.value })}
              className={`mt-2 ${inputClass} text-lg py-3`}
              placeholder={t('wizard.projectNameExample')}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="topic" className="block text-sm font-semibold text-slate-900">
                {t('wizard.topicOptional')}
              </label>
              <input
                id="topic"
                type="text"
                value={metaData.topic}
                onChange={(e) => updateMetaData({ topic: e.target.value })}
                className={`mt-2 ${inputClass}`}
                placeholder={t('wizard.topicExample')}
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-slate-900">
                {t('wizard.subjectOptional')}
              </label>
              <input
                id="subject"
                type="text"
                value={metaData.subject}
                onChange={(e) => updateMetaData({ subject: e.target.value })}
                className={`mt-2 ${inputClass}`}
                placeholder={t('wizard.subjectExample')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="groupMembers" className="block text-sm font-semibold text-slate-900">
              {t('wizard.groupMembersOptional')}
            </label>
            <input
              id="groupMembers"
              type="text"
              value={groupMembersStr}
              onChange={(e) => setGroupMembersStr(e.target.value)}
              onBlur={() => {
                updateMetaData({
                  groupMembers: groupMembersStr
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                });
              }}
              className={`mt-2 ${inputClass}`}
              placeholder={t('wizard.groupMembersPlaceholder')}
            />
          </div>
        </div>

        <div className="my-8 border-t border-slate-100" />

        {/* Complexity Selection */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            {t('wizard.complexityHeading')}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                {
                  id: 'simple',
                  label: t('wizard.complexitySimple'),
                  desc: t('wizard.complexitySimpleDesc'),
                },
                {
                  id: 'standard',
                  label: t('wizard.complexityStandard'),
                  desc: t('wizard.complexityStandardDesc'),
                },
                {
                  id: 'advanced',
                  label: t('wizard.complexityAdvanced'),
                  desc: t('wizard.complexityAdvancedDesc'),
                },
              ] as const
            ).map((level) => (
              <button
                key={level.id}
                type="button"
                aria-pressed={metaData.complexity === level.id}
                onClick={() => updateMetaData({ complexity: level.id as Complexity })}
                className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                  metaData.complexity === level.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`text-sm font-semibold ${metaData.complexity === level.id ? 'text-blue-700' : 'text-slate-900'}`}
                >
                  {level.label}
                </span>
                <span
                  className={`mt-1 text-xs ${metaData.complexity === level.id ? 'text-blue-600' : 'text-slate-500'}`}
                >
                  {level.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end">
        <button
          onClick={handleNext}
          disabled={!metaData.projectName.trim()}
          className={`${buttonPrimary} text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {t('wizard.toEditor')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
