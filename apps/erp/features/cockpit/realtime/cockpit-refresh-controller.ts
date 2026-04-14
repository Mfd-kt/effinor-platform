/**
 * Planification de refresh RSC : throttle + anti re-entrée court après router.refresh().
 * Logique pure testable (pas de dépendance React).
 */
export type CockpitRefreshScheduler = {
  /** Demande un refresh (sera ignoré ou différé selon throttle / file d’attente). */
  request: (reason?: string) => void;
  dispose: () => void;
};

export type CreateCockpitRefreshSchedulerParams = {
  minIntervalMs: number;
  postRunLockMs: number;
  onRefresh: () => void;
  /** Si défini, logue en dev uniquement. */
  debugLabel?: string;
};

export function createCockpitRefreshScheduler(params: CreateCockpitRefreshSchedulerParams): CockpitRefreshScheduler {
  const { minIntervalMs, postRunLockMs, onRefresh, debugLabel } = params;
  let lastRunAt = 0;
  let inFlight = false;
  let pending = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let postLockTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  function debug(msg: string, extra?: unknown) {
    if (debugLabel && process.env.NODE_ENV === "development") {
      console.debug(`[${debugLabel}]`, msg, extra ?? "");
    }
  }

  function dispose() {
    disposed = true;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (postLockTimer) {
      clearTimeout(postLockTimer);
      postLockTimer = null;
    }
    pending = false;
    inFlight = false;
  }

  function attempt(reason?: string) {
    if (disposed) return;
    if (reason) debug("event", reason);
    const now = Date.now();

    if (inFlight) {
      pending = true;
      debug("queue (in-flight)");
      return;
    }

    if (now - lastRunAt < minIntervalMs) {
      const wait = minIntervalMs - (now - lastRunAt);
      if (!debounceTimer) {
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          attempt("debounced");
        }, wait);
      }
      debug("debounce", { waitMs: wait });
      return;
    }

    inFlight = true;
    lastRunAt = now;
    debug("refresh");
    onRefresh();

    if (postLockTimer) clearTimeout(postLockTimer);
    postLockTimer = setTimeout(() => {
      postLockTimer = null;
      if (disposed) return;
      inFlight = false;
      if (pending) {
        pending = false;
        attempt("pending-after-run");
      }
    }, postRunLockMs);
  }

  return {
    request: (reason) => attempt(reason),
    dispose,
  };
}
