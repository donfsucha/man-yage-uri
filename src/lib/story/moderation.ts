import type { StoryInput } from "./schema";

export type ModerationCategory =
  | "self_harm"
  | "stalking"
  | "threat"
  | "personal_data";

export type ModerationResult = {
  allowed: boolean;
  categories: ModerationCategory[];
  message: string;
  sanitizedInput: StoryInput;
};

const checks: Array<{
  category: ModerationCategory;
  pattern: RegExp;
}> = [
  {
    category: "self_harm",
    pattern: /(자해|죽고\s*싶|극단적\s*선택|사라지고\s*싶|못\s*살)/i
  },
  {
    category: "stalking",
    pattern: /(집\s*앞|회사\s*앞|몰래\s*따라|감시|위치\s*추적|찾아가|기다리던\s*밤)/i
  },
  {
    category: "threat",
    pattern: /(협박|복수|해치|죽여|망가뜨리|가만두지)/i
  },
  {
    category: "personal_data",
    pattern: /(\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4}|주소|주민등록|직장명)/i
  }
];

function serializeInput(input: StoryInput) {
  return [
    input.breakupMoment,
    input.breakupReason,
    input.alternativeChoice,
    input.lastScenePlace,
    input.rememberedDetail,
    input.partnerBehavior,
    input.protagonistAlias,
    input.partnerAlias
  ].join("\n");
}

function redactPersonalData(value: string) {
  return value.replace(/\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4}/g, "[연락처 삭제]");
}

export function moderateStoryInput(input: StoryInput): ModerationResult {
  const combined = serializeInput(input);
  const categories = checks
    .filter((check) => check.pattern.test(combined))
    .map((check) => check.category);

  const uniqueCategories = [...new Set(categories)];
  const sanitizedInput: StoryInput = {
    ...input,
    breakupMoment: redactPersonalData(input.breakupMoment),
    breakupReason: redactPersonalData(input.breakupReason),
    alternativeChoice: redactPersonalData(input.alternativeChoice),
    lastScenePlace: redactPersonalData(input.lastScenePlace),
    rememberedDetail: redactPersonalData(input.rememberedDetail),
    partnerBehavior: redactPersonalData(input.partnerBehavior),
    protagonistAlias: redactPersonalData(input.protagonistAlias),
    partnerAlias: redactPersonalData(input.partnerAlias)
  };

  if (uniqueCategories.length === 0) {
    return {
      allowed: true,
      categories: [],
      message: "생성 가능한 입력입니다.",
      sanitizedInput
    };
  }

  return {
    allowed: false,
    categories: uniqueCategories,
    message:
      "입력하신 내용은 안전한 픽션으로 생성하기 어렵습니다. 자해, 협박, 감시, 개인정보가 포함되지 않도록 내용을 바꿔주세요. 힘든 감정이 계속된다면 가까운 사람이나 전문 상담 기관에 도움을 요청해 주세요.",
    sanitizedInput
  };
}
