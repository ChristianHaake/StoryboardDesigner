export function generateId(): string {
  // randomUUID existiert nur im Secure Context (https/localhost). Fallback für
  // z. B. http://<LAN-IP> im Schulnetz — IDs müssen nur projektintern eindeutig sein.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
