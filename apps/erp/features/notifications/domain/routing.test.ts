import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveSlackWebhookUrl } from "@/features/notifications/domain/routing";
import { resetSlackEnvCache } from "@/features/notifications/infra/slack-env";

describe("resolveSlackWebhookUrl", () => {
  beforeEach(() => {
    resetSlackEnvCache();
    vi.stubEnv("SLACK_ENABLED", "true");
    vi.stubEnv("SLACK_DEFAULT_WEBHOOK_URL", "https://hooks.slack.com/services/default");
  });

  afterEach(() => {
    resetSlackEnvCache();
    vi.unstubAllEnvs();
  });

  it("returns dedicated commercial URL when set", () => {
    vi.stubEnv("SLACK_COMMERCIAL_WEBHOOK_URL", "https://hooks.slack.com/services/commercial");
    resetSlackEnvCache();
    const r = resolveSlackWebhookUrl("commercial");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toContain("commercial");
      expect(r.usedFallback).toBe(false);
    }
  });

  it("falls back to default when channel URL missing", () => {
    resetSlackEnvCache();
    const r = resolveSlackWebhookUrl("finance");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toContain("default");
      expect(r.usedFallback).toBe(true);
    }
  });

  it("fails when Slack disabled", () => {
    vi.stubEnv("SLACK_ENABLED", "false");
    resetSlackEnvCache();
    const r = resolveSlackWebhookUrl("commercial");
    expect(r.ok).toBe(false);
  });
});
