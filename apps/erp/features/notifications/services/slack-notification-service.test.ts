import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendSlackNotification } from "@/features/notifications/services/slack-notification-service";
import { resetSlackEnvCache } from "@/features/notifications/infra/slack-env";

vi.mock("@/features/notifications/services/notification-log-service", () => ({
  insertNotificationLog: vi.fn().mockResolvedValue(undefined),
}));

describe("sendSlackNotification", () => {
  beforeEach(() => {
    resetSlackEnvCache();
  });

  afterEach(() => {
    resetSlackEnvCache();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("skips when Slack disabled without throwing", async () => {
    vi.stubEnv("SLACK_ENABLED", "false");
    resetSlackEnvCache();
    const out = await sendSlackNotification(
      {
        title: "Test",
        severity: "info",
        channelKey: "commercial",
      },
      { eventType: "test", entityType: "x", entityId: "1" },
    );
    expect(out.status).toBe("skipped");
  });

  it("sends webhook when enabled and logs success path", async () => {
    vi.stubEnv("SLACK_ENABLED", "true");
    vi.stubEnv("SLACK_DEFAULT_WEBHOOK_URL", "https://hooks.slack.com/services/xxx/yyy/zzz");
    resetSlackEnvCache();

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve("ok"),
        }),
      ),
    );

    const out = await sendSlackNotification(
      {
        title: "Hello",
        severity: "success",
        channelKey: "direction",
      },
      { eventType: "test.ok", entityType: "lead", entityId: "abc" },
    );

    expect(out.status).toBe("sent");
    expect(fetch).toHaveBeenCalled();
  });
});
