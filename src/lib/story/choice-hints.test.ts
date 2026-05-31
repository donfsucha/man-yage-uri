import { describe, expect, it } from "vitest";
import { getChoicePurchaseHint } from "./choice-hints";

describe("choice purchase hints", () => {
  it("frames each first choice as a paid-story curiosity hook", () => {
    expect(getChoicePurchaseHint({ choice_id: "A" }).teaser).toContain("읽음");
    expect(getChoicePurchaseHint({ choice_id: "A" }).teaser).toContain("입력 중");
    expect(getChoicePurchaseHint({ choice_id: "B" }).teaser).toContain("마지막 하루");
    expect(getChoicePurchaseHint({ choice_id: "C" }).teaser).toContain("한 문장");
  });

  it("explains the premium payoff without encouraging real-world contact", () => {
    const hints = [
      getChoicePurchaseHint({ choice_id: "A" }),
      getChoicePurchaseHint({ choice_id: "B" }),
      getChoicePurchaseHint({ choice_id: "C" })
    ];

    for (const hint of hints) {
      const combined = `${hint.teaser}\n${hint.consequence}\n${hint.premiumPromise}`;

      expect(combined).not.toMatch(/연락|찾아가|전화|카톡/);
      expect(combined.length).toBeGreaterThan(30);
    }
  });
});
