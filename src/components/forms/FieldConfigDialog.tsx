import { useCallback, useEffect, useRef, useState } from 'react';
import { useStoryboardStore } from '../../store/useStoryboardStore';
import { MAX_CUSTOM_FIELDS, MAX_CUSTOM_FIELD_LABEL_LENGTH } from '../../utils/customFields';
import type { CustomFieldDefinition } from '../../types';

interface FieldConfigDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_DEFINITIONS: never[] = [];

function FieldDefinitionRow({
  definition,
  onRename,
  onDelete,
}: {
  definition: CustomFieldDefinition;
  onRename: (key: string, label: string) => void;
  onDelete: (key: string, label: string) => void;
}) {
  const [label, setLabel] = useState(definition.label);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 p-2 max-sm:flex-wrap">
      <input
        type="text"
        value={label}
        maxLength={MAX_CUSTOM_FIELD_LABEL_LENGTH}
        aria-label={`Feldbezeichnung ${definition.label}`}
        onChange={(event) => setLabel(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onRename(definition.key, label);
          }
        }}
        className="min-h-11 min-w-0 flex-1 rounded-lg border border-transparent bg-gray-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-100 max-sm:w-full max-sm:flex-none"
      />
      <button
        type="button"
        onClick={() => onRename(definition.key, label)}
        className="min-h-11 rounded-lg px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
      >
        Speichern
      </button>
      <button
        type="button"
        onClick={() => onDelete(definition.key, definition.label)}
        aria-label={`Feld ${definition.label} löschen`}
        className="inline-flex size-11 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700"
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
  );
}

export default function FieldConfigDialog({ open, onClose }: FieldConfigDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const definitions = useStoryboardStore((state) => state.fieldDefinitions ?? EMPTY_DEFINITIONS);
  const formatType = useStoryboardStore((state) => state.metaData.formatType);
  const addCustomField = useStoryboardStore((state) => state.addCustomField);
  const renameCustomField = useStoryboardStore((state) => state.renameCustomField);
  const deleteCustomField = useStoryboardStore((state) => state.deleteCustomField);
  const applyCurrentFormatPreset = useStoryboardStore((state) => state.applyCurrentFormatPreset);
  const [newLabel, setNewLabel] = useState('');
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
    const error = addCustomField(newLabel);
    if (error) {
      setMessage(error);
      return;
    }
    setNewLabel('');
    setMessage('Feld hinzugefügt.');
    addInputRef.current?.focus();
  }

  function handleRename(key: string, label: string) {
    const error = renameCustomField(key, label);
    setMessage(error ?? 'Feldbezeichnung gespeichert.');
  }

  function handleDelete(key: string, label: string) {
    if (
      !window.confirm(
        `Feld „${label}“ löschen? Die Inhalte dieses Feldes werden aus allen Szenen entfernt.`,
      )
    ) {
      return;
    }
    deleteCustomField(key);
    setMessage('Feld und zugehörige Inhalte gelöscht.');
  }

  function handleApplyPreset() {
    const added = applyCurrentFormatPreset();
    setMessage(
      added > 0
        ? `${added} Vorlagenfeld${added === 1 ? '' : 'er'} ergänzt.`
        : 'Alle Felder der aktuellen Formatvorlage sind bereits vorhanden.',
    );
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="field-config-title"
      className="m-auto max-h-[min(90vh,760px)] w-[min(92vw,640px)] overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-gray-950/50"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className="flex max-h-[min(90vh,760px)] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id="field-config-title" className="text-lg font-bold tracking-tight">
              Felder konfigurieren
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Zusatzfelder erscheinen in jeder Szene und werden mit dem Projekt gespeichert.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            aria-label="Dialog schließen"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
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
                <h3 id="add-field-title" className="text-sm font-semibold text-gray-900">
                  Eigenes Feld hinzufügen
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {definitions.length} von {MAX_CUSTOM_FIELDS} Feldern verwendet
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 max-sm:flex-col">
              <input
                ref={addInputRef}
                type="text"
                value={newLabel}
                maxLength={MAX_CUSTOM_FIELD_LABEL_LENGTH}
                placeholder="z. B. Lichtstimmung"
                aria-label="Bezeichnung des neuen Feldes"
                onChange={(event) => {
                  setNewLabel(event.target.value);
                  setMessage(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAdd();
                  }
                }}
                className="min-h-11 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={definitions.length >= MAX_CUSTOM_FIELDS}
                className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hinzufügen
              </button>
            </div>
          </section>

          <section className="mt-6 border-t border-gray-200 pt-5" aria-labelledby="preset-title">
            <div className="flex items-center justify-between gap-4 max-sm:items-start">
              <div>
                <h3 id="preset-title" className="text-sm font-semibold text-gray-900">
                  Formatvorlage
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Fehlende Felder für „
                  {formatType === 'fotostory'
                    ? 'Fotostory'
                    : formatType === 'rede'
                      ? 'Rede'
                      : formatType === 'film'
                        ? 'Film'
                        : 'Eigenes Format'}
                  “ ergänzen
                </p>
              </div>
              <button
                type="button"
                onClick={handleApplyPreset}
                disabled={formatType === 'custom' || definitions.length >= MAX_CUSTOM_FIELDS}
                className="min-h-11 shrink-0 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ergänzen
              </button>
            </div>
          </section>

          <section className="mt-6 border-t border-gray-200 pt-5" aria-labelledby="fields-title">
            <h3 id="fields-title" className="text-sm font-semibold text-gray-900">
              Aktive Zusatzfelder
            </h3>
            {definitions.length === 0 ? (
              <p className="mt-3 rounded-lg bg-gray-50 px-4 py-4 text-sm text-gray-600">
                Noch keine Zusatzfelder angelegt.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {definitions.map((definition) => (
                  <FieldDefinitionRow
                    key={definition.key}
                    definition={definition}
                    onRename={handleRename}
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

        <footer className="flex justify-end border-t border-gray-200 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={closeDialog}
            className="min-h-11 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Fertig
          </button>
        </footer>
      </div>
    </dialog>
  );
}
