/** @deprecated Utiliser {@link myQueueSelectedCeeSheetStorageKey} — conservé pour rétrocompat lecture. */
export const MY_QUEUE_CEE_SHEET_STORAGE_KEY = "lg-my-queue:selected-cee-sheet-id";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function myQueueSelectedCeeSheetStorageKey(userId: string): string {
  return `lg-my-queue:user:${userId}:selected-cee-sheet-id`;
}

/** Lit l’id stocké pour cet utilisateur ; migre l’ancienne clé globale si besoin. */
export function readMyQueueSelectedCeeSheetId(userId: string): string | null {
  const ls = safeStorage();
  if (!ls || !userId.trim()) {
    return null;
  }
  try {
    const key = myQueueSelectedCeeSheetStorageKey(userId);
    const next = ls.getItem(key)?.trim() ?? "";
    if (next) {
      return next;
    }
    const legacy = ls.getItem(MY_QUEUE_CEE_SHEET_STORAGE_KEY)?.trim() ?? "";
    if (legacy) {
      ls.setItem(key, legacy);
      ls.removeItem(MY_QUEUE_CEE_SHEET_STORAGE_KEY);
      return legacy;
    }
  } catch {
    /* quota / private mode */
  }
  return null;
}

export function writeMyQueueSelectedCeeSheetId(userId: string, ceeSheetId: string): void {
  const ls = safeStorage();
  if (!ls || !userId.trim()) {
    return;
  }
  try {
    const id = ceeSheetId.trim();
    if (!id) {
      ls.removeItem(myQueueSelectedCeeSheetStorageKey(userId));
      return;
    }
    ls.setItem(myQueueSelectedCeeSheetStorageKey(userId), id);
  } catch {
    /* */
  }
}
