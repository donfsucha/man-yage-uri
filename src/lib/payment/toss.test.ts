import { describe, expect, it } from "vitest";
import {
  createTossOrderId,
  getTossAuthHeader,
  isExpectedTossPayment,
  normalizeTossAmount
} from "./toss";

describe("toss payment adapter", () => {
  it("normalizes Toss amounts as positive KRW integers", () => {
    expect(normalizeTossAmount(7900)).toBe(7900);
    expect(() => normalizeTossAmount(4.99)).toThrow(
      "Toss amount must be a positive integer."
    );
    expect(() => normalizeTossAmount(0)).toThrow(
      "Toss amount must be a positive integer."
    );
  });

  it("creates Toss-compatible order IDs", () => {
    const orderId = createTossOrderId("1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7");

    expect(orderId).toMatch(/^toss_1cc40ee98ae1488a89b95ff7d12cc1e7_\d+$/);
    expect(orderId.length).toBeLessThanOrEqual(64);
  });

  it("creates the Basic authorization header from the secret key", () => {
    expect(getTossAuthHeader("test_secret")).toBe(
      `Basic ${Buffer.from("test_secret:").toString("base64")}`
    );
  });

  it("checks confirmation details before unlocking a story", () => {
    expect(
      isExpectedTossPayment(
        {
          paymentKey: "payment-key",
          orderId: "order-1",
          status: "DONE",
          method: "카드",
          currency: "KRW",
          totalAmount: 7900
        },
        { orderId: "order-1", amount: 7900, currency: "KRW" }
      )
    ).toBe(true);

    expect(
      isExpectedTossPayment(
        {
          paymentKey: "payment-key",
          orderId: "other-order",
          status: "DONE",
          method: "카드",
          currency: "KRW",
          totalAmount: 7900
        },
        { orderId: "order-1", amount: 7900, currency: "KRW" }
      )
    ).toBe(false);
  });
});
