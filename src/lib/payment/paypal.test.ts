import { describe, expect, it } from "vitest";
import {
  getPayPalBaseUrl,
  isExpectedPayPalCapture,
  normalizePayPalAmount,
  PAYPAL_PRODUCT_DESCRIPTION,
  PAYPAL_PRODUCT_NAME,
  toPaymentMinorUnits,
  toPayPalOrderPayload
} from "./paypal";

describe("paypal payment adapter", () => {
  it("uses sandbox and live API base URLs", () => {
    expect(getPayPalBaseUrl("sandbox")).toBe("https://api-m.sandbox.paypal.com");
    expect(getPayPalBaseUrl("live")).toBe("https://api-m.paypal.com");
  });

  it("creates an order payload for the five episode pack", () => {
    expect(
      toPayPalOrderPayload({
        storyId: "story-1",
        title: "Story title",
        amount: "5.99",
        currency: "USD"
      })
    ).toEqual({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: "story-1",
          description: PAYPAL_PRODUCT_NAME,
          items: [
            {
              name: PAYPAL_PRODUCT_NAME,
              description: PAYPAL_PRODUCT_DESCRIPTION,
              quantity: "1",
              unit_amount: {
                currency_code: "USD",
                value: "5.99"
              }
            }
          ],
          amount: {
            currency_code: "USD",
            value: "5.99",
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: "5.99"
              }
            }
          }
        }
      ]
    });
  });

  it("normalizes PayPal amounts and stores them as minor units", () => {
    expect(normalizePayPalAmount("5.9", "usd")).toBe("5.90");
    expect(toPaymentMinorUnits("5.99", "USD")).toBe(599);
    expect(toPaymentMinorUnits("7900", "JPY")).toBe(7900);
  });

  it("checks capture details before unlocking a story", () => {
    expect(
      isExpectedPayPalCapture(
        {
          orderId: "order-1",
          status: "COMPLETED",
          storyId: "story-1",
          captureId: "capture-1",
          amount: "5.99",
          currency: "USD"
        },
        { storyId: "story-1", amount: "5.99", currency: "USD" }
      )
    ).toBe(true);

    expect(
      isExpectedPayPalCapture(
        {
          orderId: "order-1",
          status: "COMPLETED",
          storyId: "other-story",
          captureId: "capture-1",
          amount: "5.99",
          currency: "USD"
        },
        { storyId: "story-1", amount: "5.99", currency: "USD" }
      )
    ).toBe(false);
  });
});
