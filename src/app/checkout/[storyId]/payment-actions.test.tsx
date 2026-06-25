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
        mockPayApp={true}
        payAppApiEnabled={false}
        payAppCheckoutUrl=""
        mockToss={true}
        mockPayPal={true}
        paypalClientId=""
        paypalCurrency="USD"
        storyId="story-1"
        tossClientKey=""
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
        mockPayApp={true}
        payAppApiEnabled={false}
        payAppCheckoutUrl=""
        mockToss={true}
        mockPayPal={false}
        paypalClientId="paypal-client"
        paypalCurrency="USD"
        storyId="story-1"
        tossClientKey=""
      />
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  test("renders PayApp as the primary domestic checkout when a link is configured", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ eventId: "event-1" })
    });
    vi.stubGlobal("fetch", fetch);

    render(
      <PaymentActions
        locale="ko"
        mockPayApp={false}
        payAppApiEnabled={false}
        payAppCheckoutUrl="https://payapp.kr/link/test"
        mockToss={false}
        mockPayPal={true}
        paypalClientId=""
        paypalCurrency="USD"
        storyId="story-1"
        tossClientKey="toss-client"
      />
    );

    const payAppLink = screen.getByRole("link", {
      name: "국내 카드/간편결제로 결제"
    });

    expect(payAppLink.getAttribute("href")).toBe("https://payapp.kr/link/test");
    expect(screen.queryByRole("button", { name: "국내 카드/간편결제로 결제" })).toBeNull();
    expect(screen.queryByRole("button", { name: /7,900/ })).toBeNull();

    fireEvent.click(payAppLink);

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/events/track",
        expect.objectContaining({ method: "POST" })
      )
    );
  });

  test("creates a PayApp API payment and opens the returned checkout URL", async () => {
    const open = vi.fn();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ eventId: "event-1" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderId: "payapp_order_1",
          payUrl: "https://payapp.kr/L/generated"
        })
      });
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("open", open);

    render(
      <PaymentActions
        locale="en"
        mockPayApp={false}
        payAppApiEnabled={true}
        payAppCheckoutUrl="https://payapp.kr/link/fallback"
        mockToss={false}
        mockPayPal={true}
        paypalClientId=""
        paypalCurrency="USD"
        storyId="story-1"
        tossClientKey="toss-client"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Pay with Korean card or easy pay" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/payment/payapp/create-order",
        expect.objectContaining({ method: "POST" })
      )
    );
    expect(open).toHaveBeenCalledWith(
      "https://payapp.kr/L/generated",
      "_self",
      "noopener,noreferrer"
    );
  });

  test("starts a Toss payment when domestic payments are configured", async () => {
    const requestPayment = vi.fn().mockResolvedValue(undefined);
    const payment = vi.fn(() => ({ requestPayment }));
    const TossPayments = vi.fn(() => ({ payment }));
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ eventId: "event-1" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderId: "toss_story_1",
          orderName: "IfWe - complete story",
          amount: 7900,
          currency: "KRW",
          customerKey: "guest_story1",
          successUrl: "https://ifwe.cnanfc.com/checkout/story-1/toss/success",
          failUrl: "https://ifwe.cnanfc.com/checkout/story-1/toss/fail"
        })
      });
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("TossPayments", TossPayments);

    render(
      <PaymentActions
        locale="ko"
        mockPayApp={true}
        payAppApiEnabled={false}
        payAppCheckoutUrl=""
        mockToss={false}
        mockPayPal={false}
        paypalClientId=""
        paypalCurrency="USD"
        storyId="story-1"
        tossClientKey="toss-client"
      />
    );

    expect(screen.queryByRole("button", { name: /7,900/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "국내 카드/간편결제로 결제" }));

    await waitFor(() => expect(requestPayment).toHaveBeenCalled());
    expect(TossPayments).toHaveBeenCalledWith("toss-client");
    expect(payment).toHaveBeenCalledWith({ customerKey: "guest_story1" });
    expect(requestPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "CARD",
        orderId: "toss_story_1",
        amount: { currency: "KRW", value: 7900 }
      })
    );
  });
});
