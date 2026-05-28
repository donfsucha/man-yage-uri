import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const completeMockPaidStory = vi.fn();
let mockPayPal = true;

vi.mock("@/lib/config/runtime", () => ({
  getRuntimeConfig: () => ({ mockPayPal })
}));

vi.mock("@/lib/story/persistence", () => ({
  completeMockPaidStory: (...args: unknown[]) => completeMockPaidStory(...args)
}));

function request(body: unknown) {
  return new Request("http://localhost/api/payment/mock-confirm", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

describe("mock payment confirmation API", () => {
  beforeEach(() => {
    mockPayPal = true;
    completeMockPaidStory.mockReset();
  });

  it("rejects mock confirmation when real PayPal is enabled", async () => {
    mockPayPal = false;
    const { POST } = await import("./route");

    const response = await POST(
      request({ storyId: "00000000-0000-4000-8000-000000000001" })
    );

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(403);
    expect(completeMockPaidStory).not.toHaveBeenCalled();
  });
});
