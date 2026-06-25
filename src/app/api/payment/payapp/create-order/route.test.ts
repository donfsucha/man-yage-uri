import { beforeEach, describe, expect, it, vi } from "vitest";

const createPayAppPayment = vi.fn();
const getStory = vi.fn();
const prepareExternalPayment = vi.fn();
const recordAnalyticsEventSafely = vi.fn();

vi.mock("@/lib/config/runtime", () => ({
  getRuntimeConfig: () => ({
    appUrl: "https://ifwe.cnanfc.com",
    mockPayApp: false,
    payAppAmount: 7900,
    payAppApiEnabled: true,
    payAppDefaultRecvPhone: "01000000000",
    payAppOpenPayTypes: "card,kakaopay,naverpay",
    payAppUserId: "seller-id"
  })
}));

vi.mock("@/lib/payment/payapp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payment/payapp")>();

  return {
    ...actual,
    createPayAppPayment: (...args: unknown[]) => createPayAppPayment(...args)
  };
});

vi.mock("@/lib/story/persistence", () => ({
  getStory: (...args: unknown[]) => getStory(...args),
  prepareExternalPayment: (...args: unknown[]) => prepareExternalPayment(...args),
  recordAnalyticsEventSafely: (...args: unknown[]) =>
    recordAnalyticsEventSafely(...args)
}));

function request(body: unknown) {
  return new Request("http://localhost/api/payment/payapp/create-order", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

describe("PayApp create-order API", () => {
  beforeEach(() => {
    createPayAppPayment.mockReset();
    getStory.mockReset();
    prepareExternalPayment.mockReset();
    recordAnalyticsEventSafely.mockReset();
  });

  it("creates a PayApp request after storing a pending payment", async () => {
    const storyId = "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7";
    getStory.mockResolvedValue({
      id: storyId,
      input: { outputLanguage: "ko" },
      selectedChoiceId: "A",
      story: { title: "비 오는 날, 그 한 마디" }
    });
    prepareExternalPayment.mockResolvedValue({ id: storyId });
    createPayAppPayment.mockResolvedValue({
      mulNo: "2000",
      orderId: "payapp_order_1",
      payUrl: "https://payapp.kr/L/generated",
      state: "1"
    });
    const { POST } = await import("./route");

    const response = await POST(request({ storyId }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.payUrl).toBe("https://payapp.kr/L/generated");
    expect(prepareExternalPayment).toHaveBeenCalledWith(
      storyId,
      expect.stringMatching(/^payapp_1cc40ee98ae1488a89b95ff7d12cc1e7_\d+$/),
      7900
    );
    expect(createPayAppPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 7900,
        recvPhone: "01000000000",
        storyId,
        userId: "seller-id"
      })
    );
  });
});
