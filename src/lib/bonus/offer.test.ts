import { describe, expect, it } from "vitest";
import { BONUS_LINKS, BONUS_OFFER_COPY } from "./offer";

describe("BONUS_OFFER_COPY", () => {
  it("keeps Korean and English purchase-support copy available", () => {
    expect(BONUS_OFFER_COPY.ko.curiosityItems).toEqual([
      "읽음 표시",
      "입력 중",
      "끝내 말하지 못한 한 문장"
    ]);
    expect(BONUS_OFFER_COPY.ko.guideTitle).toBe("PDF 가이드북");
    expect(BONUS_OFFER_COPY.ko.journalTitle).toBe("감성 일기장 템플릿");
    expect(BONUS_OFFER_COPY.ko.guaranteeTitle).toBe("7일 안심 환불 보증");
    expect(BONUS_OFFER_COPY.ko.guaranteeBody).toBe(
      "끝까지 읽고도 후련하지 않으면 환불"
    );

    expect(BONUS_OFFER_COPY.en.curiosityItems).toEqual([
      "Read receipt",
      "Typing indicator",
      "The sentence left unsaid"
    ]);
    expect(BONUS_OFFER_COPY.en.guaranteeTitle).toBe("7-day refund guarantee");
  });

  it("provides separate Korean and English bonus PDF links", () => {
    expect(BONUS_LINKS.breakupGuideKo).toBe("/bonuses/breakup-guide?lang=ko");
    expect(BONUS_LINKS.breakupGuideEn).toBe("/bonuses/breakup-guide?lang=en");
    expect(BONUS_LINKS.journalTemplateKo).toBe(
      "/bonuses/journal-template?lang=ko"
    );
    expect(BONUS_LINKS.journalTemplateEn).toBe(
      "/bonuses/journal-template?lang=en"
    );
  });
});
