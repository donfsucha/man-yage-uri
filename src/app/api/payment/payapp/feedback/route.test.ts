import { beforeEach, describe, expect, it, vi } from "vitest";

const completePreparedPaidStory = vi.fn();
const recordAnalyticsEventSafely = vi.fn();
let config = {
  mockPayApp: false,
  payAppApiEnabled: true,
  payAppAmount: 7900,
  payAppLinkKey: "link-key",
  payAppLinkValue: "link-value",
  payAppUserId: "seller-id"
};

vi.mock("@/lib/config/runtime", () => ({
  getRuntimeConfig: () => config
}));

vi.mock("@/lib/story/persistence", () => ({
  completePreparedPaidStory: (...args: unknown[]) =>
    completePreparedPaidStory(...args),
  recordAnalyticsEventSafely: (...args: unknown[]) =>
    recordAnalyticsEventSafely(...args)
}));

function feedbackRequest(fields: Record<string, string>) {
  return new Request("http://localhost/api/payment/payapp/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields)
  });
}

describe("PayApp feedback API", () => {
  beforeEach(() => {
    config = {
      mockPayApp: false,
  payAppApiEnabled: true,
  payAppAmount: 7900,
      payAppLinkKey: "link-key",
      payAppLinkValue: "link-value",
      payAppUserId: "seller-id"
    };
    completePreparedPaidStory.mockReset();
    recordAnalyticsEventSafely.mockReset();
  });

  it("completes the paid story after a verified PayApp payment notification", async () => {
    completePreparedPaidStory.mockResolvedValue({
      id: "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7",
      input: { outputLanguage: "ko" },
      status: "completed"
    });
    const { POST } = await import("./route");

    const response = await POST(
      feedbackRequest({
        userid: "seller-id",
        linkkey: "link-key",
        linkval: "link-value",
        price: "7900",
        pay_state: "4",
        var1: "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7",
        var2: "payapp_order_1",
        mul_no: "2000"
      })
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("SUCCESS");
    expect(completePreparedPaidStory).toHaveBeenCalledWith(
      "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7",
      "payapp_order_1"
    );
    expect(recordAnalyticsEventSafely).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "payment_success",
        storyId: "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7"
      })
    );
  });

  it("does not unlock the story when PayApp feedback secrets do not match", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      feedbackRequest({
        userid: "seller-id",
        linkkey: "link-key",
        linkval: "wrong-value",
        price: "7900",
        pay_state: "4",
        var1: "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7",
        var2: "payapp_order_1"
      })
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("FAIL");
    expect(completePreparedPaidStory).not.toHaveBeenCalled();
  });
});



