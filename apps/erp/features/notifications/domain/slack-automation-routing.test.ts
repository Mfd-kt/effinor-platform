import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetSlackEnvCache } from "@/features/notifications/infra/slack-env";
import { resolveSlackWebhookForEvent } from "./slack-automation-routing";

describe("resolveSlackWebhookForEvent", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    resetSlackEnvCache();
    process.env.SLACK_ENABLED = "true";
    process.env.SLACK_COMMERCIAL_WEBHOOK_URL = "https://hooks.slack.com/services/COMM/01/xxx";
    process.env.SLACK_ADMIN_WEBHOOK_URL = "https://hooks.slack.com/services/ADM/03/zzz";
    process.env.SLACK_DEFAULT_WEBHOOK_URL = "https://hooks.slack.com/services/DEF/99/fallback";
  });

  afterEach(() => {
    process.env = { ...prev };
    resetSlackEnvCache();
  });

  it("new_lead → commercial", () => {
    const r = resolveSlackWebhookForEvent("new_lead");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.targets).toHaveLength(1);
      expect(r.targets[0]?.channelKey).toBe("commercial");
      expect(r.targets[0]?.url).toContain("COMM");
    }
  });

  it("docs_missing → administratif", () => {
    const r = resolveSlackWebhookForEvent("docs_missing");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.targets.length).toBeGreaterThanOrEqual(1);
      const keys = r.targets.map((t) => t.channelKey);
      expect(keys).toContain("administratif");
    }
  });

  it("fallback default si canal manquant", () => {
    delete process.env.SLACK_COMMERCIAL_WEBHOOK_URL;
    resetSlackEnvCache();
    const r = resolveSlackWebhookForEvent("new_lead");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.targets[0]?.usedFallback).toBe(true);
      expect(r.targets[0]?.url).toContain("fallback");
    }
  });

  it("Slack désactivé → échec", () => {
    process.env.SLACK_ENABLED = "false";
    resetSlackEnvCache();
    const r = resolveSlackWebhookForEvent("new_lead");
    expect(r.ok).toBe(false);
  });
});
