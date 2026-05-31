import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CheckoutPage from "./page";

vi.mock("./payment-actions", () => ({
  PaymentActions: () => <div data-testid="payment-actions" />
}));

vi.mock("@/lib/config/runtime", () => ({
  getRuntimeConfig: () => ({
    mockPayPal: true,
    mockToss: true,
    paypalAmount: "4.99",
    paypalCurrency: "USD",
    paypalClientId: ""
  })
}));

vi.mock("@/lib/story/persistence", () => ({
  getStory: async () => ({
    id: "story-1",
    selectedChoiceId: "A",
    story: {
      title: "비 오는 정류장",
      next_choices: [
        { choice_id: "A", label: "읽음으로 바뀐 문자의 진짜 이유를 확인한다" },
        { choice_id: "B", label: "마지막 하루에 숨은 다정함의 대가를 본다" },
        { choice_id: "C", label: "예림이 끝내 말하지 않은 한 문장을 읽는다" }
      ]
    }
  })
}));

describe("CheckoutPage", () => {
  it("shows paid-story payoff hints near the price", async () => {
    render(
      await CheckoutPage({
        params: Promise.resolve({ storyId: "story-1" }),
        searchParams: Promise.resolve({})
      })
    );

    expect(screen.getByText("결제 후 바로 열리는 단서")).toBeTruthy();
    expect(screen.getByText("읽음과 입력 중 표시 뒤에 숨은 그날의 진짜 이유")).toBeTruthy();
    expect(
      screen.getByText("2화 첫 장면에서 읽음 표시와 입력 중 문구가 왜 동시에 떴는지 확인합니다.")
    ).toBeTruthy();
    expect(screen.getByText("7,900원")).toBeTruthy();
  });
});
