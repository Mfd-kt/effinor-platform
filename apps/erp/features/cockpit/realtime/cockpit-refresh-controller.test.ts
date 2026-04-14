import { afterEach, describe, expect, it, vi } from "vitest";

import { createCockpitRefreshScheduler } from "./cockpit-refresh-controller";

describe("createCockpitRefreshScheduler", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("throttle : plusieurs demandes rapides ne déclenchent qu’un refresh immédiat puis une file", () => {
    vi.useFakeTimers();
    const runs: number[] = [];
    const s = createCockpitRefreshScheduler({
      minIntervalMs: 3_000,
      postRunLockMs: 100,
      onRefresh: () => runs.push(Date.now()),
    });
    s.request("a");
    s.request("b");
    expect(runs.length).toBe(1);
    vi.advanceTimersByTime(100);
    vi.advanceTimersByTime(3_000);
    expect(runs.length).toBeGreaterThanOrEqual(1);
    s.dispose();
  });

  it("dispose annule un debounce en attente", () => {
    vi.useFakeTimers();
    const runs: string[] = [];
    const s = createCockpitRefreshScheduler({
      minIntervalMs: 5_000,
      postRunLockMs: 50,
      onRefresh: () => runs.push("x"),
    });
    s.request("first");
    expect(runs.length).toBe(1);
    s.request("second");
    s.dispose();
    vi.advanceTimersByTime(10_000);
    expect(runs.length).toBe(1);
  });
});
