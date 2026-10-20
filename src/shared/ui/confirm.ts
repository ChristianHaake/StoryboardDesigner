import { create } from 'zustand';

interface ConfirmRequest {
  message: string;
  confirmLabel: string;
  resolve: (confirmed: boolean) => void;
}

/** Offene Bestätigungsanfrage; gerendert vom einmal gemounteten <ConfirmDialog />. */
export const useConfirmStore = create<{ request: ConfirmRequest | null }>(() => ({
  request: null,
}));

/**
 * Ersatz für window.confirm: übersetzter, per Tastatur und Screenreader
 * bedienbarer Dialog. Resolve mit true nur bei ausdrücklicher Bestätigung.
 */
export function confirmAction(message: string, confirmLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmStore.getState().request?.resolve(false); // vorherige Anfrage abbrechen
    useConfirmStore.setState({ request: { message, confirmLabel, resolve } });
  });
}
