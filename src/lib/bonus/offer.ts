export type BonusLocale = "ko" | "en";

export const BONUS_LINKS = {
  breakupGuideKo: "/bonuses/breakup-guide?lang=ko",
  breakupGuideEn: "/bonuses/breakup-guide?lang=en",
  journalTemplateKo: "/bonuses/journal-template?lang=ko",
  journalTemplateEn: "/bonuses/journal-template?lang=en"
} as const;

export const BONUS_OFFER_COPY = {
  ko: {
    curiosityTitle: "결제 직후 풀리는 핵심 궁금증",
    curiosityBody:
      "1화에서 멈춘 긴장감을 바로 이어 받아, 결말까지 따라가게 만드는 장면들입니다.",
    curiosityItems: ["읽음 표시", "입력 중", "끝내 말하지 못한 한 문장"],
    bonusTitle: "무료 디지털 보너스",
    bonusBody:
      "완결편을 읽은 뒤 감정을 정리할 수 있도록 국문/영문 PDF 보너스 2종을 함께 제공합니다.",
    guideTitle: "PDF 가이드북",
    guideDescription: "이별 후 절대 해서는 안 될 3가지 행동",
    journalTitle: "감성 일기장 템플릿",
    journalDescription: "미련을 끊어내는 감정 정리 노트",
    downloadGuide: "PDF 가이드북 받기",
    downloadJournal: "감성 일기장 템플릿 받기",
    koreanBonus: "국문 보너스",
    englishBonus: "English bonus",
    guaranteeTitle: "7일 안심 환불 보증",
    guaranteeBody: "끝까지 읽고도 후련하지 않으면 환불",
    includedAfterPayment: "결제 완료 후 바로 제공"
  },
  en: {
    curiosityTitle: "Questions unlocked right after checkout",
    curiosityBody:
      "These are the emotional payoffs that carry the chapter 1 tension into the ending.",
    curiosityItems: ["Read receipt", "Typing indicator", "The sentence left unsaid"],
    bonusTitle: "Free digital bonuses",
    bonusBody:
      "Two PDF bonuses are included in both Korean and English so readers can process the story after the ending.",
    guideTitle: "PDF guidebook",
    guideDescription: "3 things not to do after a breakup",
    journalTitle: "Emotional journal template",
    journalDescription: "A guided page for letting go without losing yourself",
    downloadGuide: "Download PDF guidebook",
    downloadJournal: "Download journal template",
    koreanBonus: "Korean bonus",
    englishBonus: "English bonus",
    guaranteeTitle: "7-day refund guarantee",
    guaranteeBody: "If the ending does not bring any relief, ask for a refund.",
    includedAfterPayment: "Included after payment"
  }
} satisfies Record<
  BonusLocale,
  {
    curiosityTitle: string;
    curiosityBody: string;
    curiosityItems: string[];
    bonusTitle: string;
    bonusBody: string;
    guideTitle: string;
    guideDescription: string;
    journalTitle: string;
    journalDescription: string;
    downloadGuide: string;
    downloadJournal: string;
    koreanBonus: string;
    englishBonus: string;
    guaranteeTitle: string;
    guaranteeBody: string;
    includedAfterPayment: string;
  }
>;
