import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PaymentActions } from "./payment-actions";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push })
}));

describe("PaymentActions", () => {
  beforeEach(() => {
    push.mockReset();
    vi.unstubAllGlobals();
  });

  test("records checkout click, then creates and captures a mock PayPal order", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ eventId: "event-1" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orderId: "mock_paypal_story-1" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ storyId: "story-1", status: "completed" })
      });
    vi.stubGlobal("fetch", fetch);

    render(
      <PaymentActions
        locale="en"
        mockPayPal={true}
        paypalClientId=""
        paypalCurrency="USD"
        storyId="story-1"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm with mock PayPal" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/stories/story-1?lang=en")
    );
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/events/track",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/payment/paypal/create-order",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "/api/payment/paypal/capture-order",
      expect.objectContaining({ method: "POST" })
    );
  });

  test("does not render mock payment buttons when real PayPal is enabled", () => {
    vi.stubGlobal("fetch", vi.fn());

    render(
      <PaymentActions
        locale="en"
        mockPayPal={false}
        paypalClientId="paypal-client"
        paypalCurrency="USD"
        storyId="story-1"
      />
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
