import { describe, expect, it } from "vitest";
import { getPayPalBaseUrl, toPayPalOrderPayload } from "./paypal";

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
          description: "Story title - five episode pack",
          amount: {
            currency_code: "USD",
            value: "5.99"
          }
        }
      ]
    });
  });
});
