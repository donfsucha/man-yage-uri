import type { NextChoice } from "./schema";

export type ChoiceHintLocale = "ko" | "en";

type ChoicePurchaseHint = {
  teaser: string;
  consequence: string;
  premiumPromise: string;
};

const KO_HINTS: Record<NextChoice["choice_id"], ChoicePurchaseHint> = {
  A: {
    teaser: "읽음 표시와 입력 중 문구 뒤에 숨은 그날의 진짜 이유",
    consequence: "오해를 따라갈수록, 두 사람이 다르게 기억한 한 장면이 선명해집니다.",
    premiumPromise: "2화 첫 장면에서 왜 읽음 표시와 입력 중 문구가 동시에 떴는지 확인합니다."
  },
  B: {
    teaser: "마지막 하루가 다정할수록 더 아프게 남는 이유",
    consequence: "평범한 하루를 다시 걷는 동안 재회와 작별의 경계가 흔들립니다.",
    premiumPromise: "아무 일도 없던 하루 끝에 숨어 있던 예림의 마지막 선택을 따라갑니다."
  },
  C: {
    teaser: "예림이 끝내 말하지 못한 한 문장의 정체",
    consequence: "침묵을 다시 읽는 순간, 기림이 믿었던 이별의 이유가 바뀝니다.",
    premiumPromise: "보내지 못한 문장과 남겨진 기록이 전혀 다른 결말을 엽니다."
  }
};

const EN_HINTS: Record<NextChoice["choice_id"], ChoicePurchaseHint> = {
  A: {
    teaser: "The real reason behind the read receipt and typing indicator",
    consequence: "The more they untangle the misunderstanding, the sharper one ignored scene becomes.",
    premiumPromise: "Chapter 2 opens by revealing why the read receipt and typing indicator appeared together."
  },
  B: {
    teaser: "Why one gentle final day can hurt more than goodbye",
    consequence: "Every ordinary moment makes the line between reunion and farewell less certain.",
    premiumPromise: "Follow the last choice hidden inside an otherwise ordinary day."
  },
  C: {
    teaser: "The one sentence the other person never managed to say",
    consequence: "Reading the silence again changes what the breakup seemed to mean.",
    premiumPromise: "An unsent letter and a remaining record open a different ending."
  }
};

export function getChoicePurchaseHint(
  choice: Pick<NextChoice, "choice_id">,
  locale: ChoiceHintLocale = "ko"
) {
  return (locale === "en" ? EN_HINTS : KO_HINTS)[choice.choice_id];
}
