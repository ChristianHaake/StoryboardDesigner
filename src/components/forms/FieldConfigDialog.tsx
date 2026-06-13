import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../store/useStoryboardStore';
import { MAX_CUSTOM_FIELDS, MAX_CUSTOM_FIELD_LABEL_LENGTH } from '../../utils/customFields';
import { buttonPrimary, buttonSecondary } from './fieldStyles';
import type { CustomFieldDefinition, CustomFieldType, MetaData } from '../../types';

const dialogInputClass =
  'min-h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-100';

interface FieldConfigDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_DEFINITIONS: never[] = [];

function FieldDefinitionRow({
  definition,
  onSave,
  onDelete,
}: {
  definition: CustomFieldDefinition;
  onSave: (key: string, label: string, options?: string[]) => void;
  onDelete: (key: string, label: string) => void;
}) {
  const { t } = useTranslation();
  const isSelect = definition.type === 'select';
  const [label, setLabel] = useState(definition.label);
  const [optionsText, setOptionsText] = useState((definition.options ?? []).join('\n'));

  function save() {
    onSave(definition.key, label, isSelect ? optionsText.split('\n') : undefined);
  }

  return (
    <div className="rounded-xl border border-slate-200 p-2">
      <div className="flex items-center gap-2 max-sm:flex-wrap">
        <input
          type="text"
          value={label}
          maxLength={MAX_CUSTOM_FIELD_LABEL_LENGTH}
          aria-label={t('fieldConfig.rowLabel', { label: definition.label })}
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              save();
            }
          }}
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-transparent bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-100 max-sm:w-full max-sm:flex-none"
        />
        {isSelect && (
          <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
            {t('fieldConfig.typeSelect')}
          </span>
        )}
        <button
          type="button"
          onClick={save}
          className="min-h-11 rounded-lg px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          {t('fieldConfig.saveRow')}
        </button>
        <button
          type="button"
          onClick={() => onDelete(definition.key, definition.label)}
          aria-label={t('fieldConfig.deleteField', { label: definition.label })}
          className="inline-flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
          </svg>
        </button>
      </div>
      {isSelect && (
        <textarea
          value={optionsText}
          onChange={(event) => setOptionsText(event.target.value)}
          rows={3}
          aria-label={t('fieldConfig.optionsLabel', { label: definition.label })}
          placeholder={t('fieldConfig.optionsPlaceholder')}
          className={`${dialogInputClass} mt-2 resize-y py-2 leading-6`}
        />
      )}
    </div>
  );
}

const FORMAT_KEYS: Record<MetaData['formatType'], string> = {
  film: 'format.film',
  fotostory: 'format.fotostory',
  rede: 'format.rede',
  custom: 'format.custom',
};

export default function FieldConfigDialog({ open, onClose }: FieldConfigDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const definitions = useStoryboardStore((state) => state.fieldDefinitions ?? EMPTY_DEFINITIONS);
  const formatType = useStoryboardStore((state) => state.metaData.formatType);
  const addCustomField = useStoryboardStore((state) => state.addCustomField);
  const renameCustomField = useStoryboardStore((state) => state.renameCustomField);
  const updateCustomFieldOptions = useStoryboardStore((state) => state.updateCustomFieldOptions);
  const deleteCustomField = useStoryboardStore((state) => state.deleteCustomField);
  const applyCurrentFormatPreset = useStoryboardStore((state) => state.applyCurrentFormatPreset);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<CustomFieldType>('text');
  const [newOptions, setNewOptions] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
    setMessage(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    window.setTimeout(() => addInputRef.current?.focus(), 0);

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      closeDialog();
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeDialog, open]);

  function handleAdd() {
    const options = newType === 'select' ? newOptions.split('\n') : [];
    const error = addCustomField(newLabel, newType, options);
    if (error) {
      setMessage(error);
      return;
    }
    setNewLabel('');
    setNewOptions('');
    setNewType('text');
    setMessage(t('fieldConfig.added'));
    addInputRef.current?.focus();
  }

  function handleSave(key: string, label: string, options?: string[]) {
    const renameError = renameCustomField(key, label);
    if (renameError) {
      setMessage(renameError);
      return;
    }
    if (options) {
      const optionsError = updateCustomFieldOptions(key, options);
      setMessage(optionsError ?? t('fieldConfig.renamed'));
      return;
    }
    setMessage(t('fieldConfig.renamed'));
  }

  function handleDelete(key: string, label: string) {
    if (!window.confirm(t('fieldConfig.confirmDelete', { label }))) {
      return;
    }
    deleteCustomField(key);
    setMessage(t('fieldConfig.deleted'));
  }

  function handleApplyPreset() {
    const added = applyCurrentFormatPreset();
    setMessage(
      added > 0
        ? t('fieldConfig.presetAdded', { count: added })
        : t('fieldConfig.presetComplete'),
    );
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="field-config-title"
      className="m-auto max-h-[min(90vh,760px)] w-[min(92vw,640px)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className="flex max-h-[min(90vh,760px)] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id="field-config-title" className="text-lg font-bold tracking-tight">
              {t('fieldConfig.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{t('fieldConfig.description')}</p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            aria-label={t('fieldConfig.close')}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <section aria-labelledby="add-field-title">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 id="add-field-title" className="text-sm font-semibold text-slate-900">
                  {t('fieldConfig.addHeading')}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {t('fieldConfig.usage', { count: definitions.length, max: MAX_CUSTOM_FIELDS })}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex gap-2 max-sm:flex-col">
                <input
                  ref={addInputRef}
                  type="text"
                  value={newLabel}
                  maxLength={MAX_CUSTOM_FIELD_LABEL_LENGTH}
                  placeholder={t('fieldConfig.newPlaceholder')}
                  aria-label={t('fieldConfig.newLabel')}
                  onChange={(event) => {
                    setNewLabel(event.target.value);
                    setMessage(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && newType === 'text') {
                      event.preventDefault();
                      handleAdd();
                    }
                  }}
                  className={`${dialogInputClass} flex-1`}
                />
                <select
                  value={newType}
                  aria-label={t('fieldConfig.typeLabel')}
                  onChange={(event) => {
                    setNewType(event.target.value as CustomFieldType);
                    setMessage(null);
                  }}
                  className={`${dialogInputClass} appearance-none sm:w-40`}
                >
                  <option value="text">{t('fieldConfig.typeText')}</option>
                  <option value="select">{t('fieldConfig.typeSelect')}</option>
                </select>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={definitions.length >= MAX_CUSTOM_FIELDS}
                  className={`${buttonPrimary} min-h-11`}
                >
                  {t('fieldConfig.add')}
                </button>
              </div>
              {newType === 'select' && (
                <textarea
                  value={newOptions}
                  onChange={(event) => {
                    setNewOptions(event.target.value);
                    setMessage(null);
                  }}
                  rows={3}
                  aria-label={t('fieldConfig.optionsAdd')}
                  placeholder={t('fieldConfig.optionsPlaceholder')}
                  className={`${dialogInputClass} resize-y py-2 leading-6`}
                />
              )}
            </div>
          </section>

          <section className="mt-6 border-t border-slate-200 pt-5" aria-labelledby="preset-title">
            <div className="flex items-center justify-between gap-4 max-sm:items-start">
              <div>
                <h3 id="preset-title" className="text-sm font-semibold text-slate-900">
                  {t('fieldConfig.presetHeading')}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {t('fieldConfig.presetDescription', { format: t(FORMAT_KEYS[formatType]) })}
                </p>
              </div>
              <button
                type="button"
                onClick={handleApplyPreset}
                disabled={formatType === 'custom' || definitions.length >= MAX_CUSTOM_FIELDS}
                className={`${buttonSecondary} min-h-11 shrink-0`}
              >
                {t('fieldConfig.apply')}
              </button>
            </div>
          </section>

          <section className="mt-6 border-t border-slate-200 pt-5" aria-labelledby="fields-title">
            <h3 id="fields-title" className="text-sm font-semibold text-slate-900">
              {t('fieldConfig.activeHeading')}
            </h3>
            {definitions.length === 0 ? (
              <p className="mt-3 rounded-lg bg-slate-50 px-4 py-4 text-sm text-slate-600">
                {t('fieldConfig.empty')}
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {definitions.map((definition) => (
                  <FieldDefinitionRow
                    key={definition.key}
                    definition={definition}
                    onSave={handleSave}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>

          {message && (
            <p role="status" className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
              {message}
            </p>
          )}
        </div>

        <footer className="flex justify-end border-t border-slate-200 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={closeDialog}
            className="min-h-11 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {t('fieldConfig.done')}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
