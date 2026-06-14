import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../store/useStoryboardStore';
import { MAX_CUSTOM_FIELDS, MAX_CUSTOM_FIELD_LABEL_LENGTH } from '../../utils/customFields';
import { buttonPrimary, buttonSecondary } from './fieldStyles';
import type { CustomFieldDefinition, CustomFieldType, MetaData } from '../../types';
import { Trash2, X } from 'lucide-react';

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
  onSave: (key: string, label: string, options?: string[], description?: string) => void;
  onDelete: (key: string, label: string) => void;
}) {
  const { t } = useTranslation();
  const isSelect = definition.type === 'select';
  const [label, setLabel] = useState(definition.label);
  const [description, setDescription] = useState(definition.description ?? '');
  const [optionsText, setOptionsText] = useState((definition.options ?? []).join('\n'));

  function save() {
    onSave(definition.key, label, isSelect ? optionsText.split('\n') : undefined, description);
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={`field-${definition.key}`} className="text-xs font-semibold text-slate-700">
          {t('fieldConfig.rowLabelText', 'Feld konfigurieren')}
        </label>
        {isSelect && (
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {t('fieldConfig.typeSelect')}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 max-sm:flex-wrap">
          <input
            id={`field-${definition.key}`}
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
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 max-sm:w-full max-sm:flex-none"
          />
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
            title={t('fieldConfig.deleteField', { label: definition.label })}
            className="inline-flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-2 max-sm:flex-wrap">
          <input
            type="text"
            value={description}
            maxLength={100}
            placeholder={t('fieldConfig.newDescPlaceholder', 'Erklärung des Feldes')}
            aria-label={t('fieldConfig.newDescLabel', 'Hilfstext (optional)')}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                save();
              }
            }}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 max-sm:w-full max-sm:flex-none"
          />
        </div>
      </div>
      {isSelect && (
        <div className="mt-3">
          <label htmlFor={`options-${definition.key}`} className="mb-1.5 block text-xs font-semibold text-slate-700">
            {t('fieldConfig.optionsAdd', 'Optionen (eine pro Zeile)')}
          </label>
          <textarea
            id={`options-${definition.key}`}
            value={optionsText}
            onChange={(event) => setOptionsText(event.target.value)}
            rows={3}
            placeholder={t('fieldConfig.optionsPlaceholder')}
            className={`${dialogInputClass} resize-y py-2 leading-6 w-full`}
          />
        </div>
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
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const definitions = useStoryboardStore((state) => state.fieldDefinitions ?? EMPTY_DEFINITIONS);
  const formatType = useStoryboardStore((state) => state.metaData.formatType);
  const addCustomField = useStoryboardStore((state) => state.addCustomField);
  const renameCustomField = useStoryboardStore((state) => state.renameCustomField);
  const updateCustomFieldOptions = useStoryboardStore((state) => state.updateCustomFieldOptions);
  const deleteCustomField = useStoryboardStore((state) => state.deleteCustomField);
  const applyCurrentFormatPreset = useStoryboardStore((state) => state.applyCurrentFormatPreset);
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
    if (!newLabel.trim()) {
      setMessage(t('fields.labelEmpty'));
      return;
    }
    const options = newType === 'select' ? newOptions.split('\n') : [];
    const error = addCustomField(newLabel, newType, options, newDescription);
    if (error) {
      setMessage(error);
      addInputRef.current?.focus();
      return;
    } else {
      setNewLabel('');
      setNewDescription('');
      setNewOptions('');
      setNewType('text');
      setMessage(t('fieldConfig.added'));
      addInputRef.current?.focus();
    }
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
      className="m-auto max-h-[min(90vh,760px)] w-[min(92vw,640px)] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
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
            title={t('fieldConfig.close')}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
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
            <div className="mt-4 space-y-3">
              <div className="flex items-end gap-3 max-sm:flex-col max-sm:items-stretch">
                <div className="flex-1">
                  <label htmlFor="newFieldName" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {t('fieldConfig.newLabel', 'Feldname')}
                  </label>
                  <input
                    id="newFieldName"
                    ref={addInputRef}
                    type="text"
                    value={newLabel}
                    maxLength={MAX_CUSTOM_FIELD_LABEL_LENGTH}
                    placeholder={t('fieldConfig.newPlaceholder')}
                    aria-invalid={message && message !== t('fieldConfig.added') && message !== t('fieldConfig.deleted') && message !== t('fieldConfig.renamed') && !message.includes('preset') ? 'true' : undefined}
                    aria-describedby={message ? 'field-config-message' : undefined}
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
                    className={`${dialogInputClass} w-full ${message && message !== t('fieldConfig.added') && message !== t('fieldConfig.deleted') && message !== t('fieldConfig.renamed') && !message.includes('preset') ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}`}
                  />
                  {message && message !== t('fieldConfig.added') && message !== t('fieldConfig.deleted') && message !== t('fieldConfig.renamed') && !message.includes('preset') && (
                    <p id="field-config-message" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                      {message}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="newFieldDesc" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {t('fieldConfig.newDescLabel', 'Hilfstext (optional)')}
                  </label>
                  <input
                    id="newFieldDesc"
                    type="text"
                    value={newDescription}
                    maxLength={100}
                    placeholder={t('fieldConfig.newDescPlaceholder', 'Erklärung des Feldes')}
                    onChange={(event) => setNewDescription(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && newType === 'text') {
                        event.preventDefault();
                        handleAdd();
                      }
                    }}
                    className={`${dialogInputClass} w-full`}
                  />
                </div>
                <div className="sm:w-40">
                  <label htmlFor="newFieldType" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {t('fieldConfig.typeLabel', 'Feldtyp')}
                  </label>
                  <select
                    id="newFieldType"
                    value={newType}
                    onChange={(event) => {
                      setNewType(event.target.value as CustomFieldType);
                      setMessage(null);
                    }}
                    className={`${dialogInputClass} w-full appearance-none`}
                  >
                    <option value="text">{t('fieldConfig.typeText')}</option>
                    <option value="select">{t('fieldConfig.typeSelect')}</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={definitions.length >= MAX_CUSTOM_FIELDS}
                  className={`${buttonPrimary} min-h-11 shrink-0`}
                >
                  {t('fieldConfig.add')}
                </button>
              </div>
              {newType === 'select' && (
                <div>
                  <label htmlFor="newFieldOptions" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {t('fieldConfig.optionsAdd', 'Optionen (eine pro Zeile)')}
                  </label>
                  <textarea
                    id="newFieldOptions"
                    value={newOptions}
                    onChange={(event) => {
                      setNewOptions(event.target.value);
                      setMessage(null);
                    }}
                    rows={3}
                    placeholder={t('fieldConfig.optionsPlaceholder')}
                    className={`${dialogInputClass} w-full resize-y py-2 leading-6`}
                  />
                </div>
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
