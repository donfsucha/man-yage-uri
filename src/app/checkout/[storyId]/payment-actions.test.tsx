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

  test("creates and captures a mock PayPal order before opening the completed story", async () => {
    const fetch = vi
      .fn()
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
        mockPayPal={true}
        paypalClientId=""
        paypalCurrency="USD"
        storyId="story-1"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "PayPal 모의 결제" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/stories/story-1"));
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/payment/paypal/create-order",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/payment/paypal/capture-order",
      expect.objectContaining({ method: "POST" })
    );
  });
});
