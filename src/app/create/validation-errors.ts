type IssueMap = Partial<Record<string, string[]>>;
type FormValueMap = Record<string, unknown>;

type LocalValidationIssue = {
  fieldId: string;
  message: string;
};

const FIELD_LABELS: Record<string, string> = {
  breakupMoment: "이별의 순간",
  breakupReason: "이별의 이유",
  alternativeChoice: "그때 다르게 하고 싶었던 말이나 행동",
  lastScenePlace: "마지막 장면의 장소",
  rememberedDetail: "아직 기억나는 작은 디테일",
  partnerBehavior: "상대가 자주 보이던 말투나 행동",
  emotion: "지금의 감정",
  desiredEnding: "원하는 결말 방향",
  protagonistAlias: "나의 별명",
  partnerAlias: "상대의 별명",
  agreedToFictionNotice: "픽션 안내 동의",
  agreedToPrivacyNotice: "개인정보 미입력 동의"
};

const FIELD_HINTS: Record<string, string> = {
  alternativeChoice: "5자 이상",
  lastScenePlace: "2자 이상",
  rememberedDetail: "2자 이상",
  partnerBehavior: "2자 이상",
  protagonistAlias: "1자 이상",
  partnerAlias: "1자 이상",
  agreedToFictionNotice: "체크 필요",
  agreedToPrivacyNotice: "체크 필요"
};

const LOCAL_FIELD_RULES = [
  { fieldId: "alternativeChoice", minLength: 5 },
  { fieldId: "lastScenePlace", minLength: 2 },
  { fieldId: "rememberedDetail", minLength: 2 },
  { fieldId: "partnerBehavior", minLength: 2 },
  { fieldId: "protagonistAlias", minLength: 1 },
  { fieldId: "partnerAlias", minLength: 1 }
];

const LOCAL_CHECKBOX_RULES = ["agreedToFictionNotice", "agreedToPrivacyNotice"];

export function formatStoryInputIssues(issues: unknown) {
  if (!issues || typeof issues !== "object") {
    return "입력값을 확인해 주세요.";
  }

  const issueMap = issues as IssueMap;
  const fields = Object.entries(issueMap)
    .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
    .map(([field]) => {
      const label = FIELD_LABELS[field] ?? field;
      const hint = FIELD_HINTS[field];
      return hint ? `${label}(${hint})` : label;
    });

  if (fields.length === 0) {
    return "입력값을 확인해 주세요.";
  }

  return `다음 항목을 확인해 주세요: ${fields.join(", ")}`;
}

export function getLocalStoryInputIssue(form: FormValueMap): LocalValidationIssue | null {
  for (const rule of LOCAL_FIELD_RULES) {
    const value = form[rule.fieldId];
    const text = typeof value === "string" ? value.trim() : "";

    if (text.length < rule.minLength) {
      const label = FIELD_LABELS[rule.fieldId] ?? rule.fieldId;
      const hint = FIELD_HINTS[rule.fieldId] ?? `${rule.minLength}자 이상`;

      return {
        fieldId: rule.fieldId,
        message: `${label}을 ${hint}으로 입력해 주세요.`
      };
    }
  }

  for (const fieldId of LOCAL_CHECKBOX_RULES) {
    if (form[fieldId] !== true) {
      return {
        fieldId,
        message: `${FIELD_LABELS[fieldId]}를 체크해 주세요.`
      };
    }
  }

  return null;
}
