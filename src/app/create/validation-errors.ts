type IssueMap = Partial<Record<string, string[]>>;
type FormValueMap = Record<string, unknown>;
type ValidationLocale = "ko" | "en";

type LocalValidationIssue = {
  fieldId: string;
  message: string;
};

const FIELD_LABELS: Record<ValidationLocale, Record<string, string>> = {
  ko: {
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
  },
  en: {
    breakupMoment: "Breakup moment",
    breakupReason: "Reason for the breakup",
    alternativeChoice: "What you wish you had said or done",
    lastScenePlace: "Place of the last scene",
    rememberedDetail: "Small detail you still remember",
    partnerBehavior: "Their familiar tone or behavior",
    emotion: "Current emotion",
    desiredEnding: "Desired ending direction",
    protagonistAlias: "Your alias",
    partnerAlias: "Their alias",
    agreedToFictionNotice: "Fiction notice agreement",
    agreedToPrivacyNotice: "Privacy notice agreement"
  }
};

const FIELD_HINTS: Record<ValidationLocale, Record<string, string>> = {
  ko: {
    alternativeChoice: "5자 이상",
    lastScenePlace: "2자 이상",
    rememberedDetail: "2자 이상",
    partnerBehavior: "2자 이상",
    protagonistAlias: "1자 이상",
    partnerAlias: "1자 이상",
    agreedToFictionNotice: "체크 필요",
    agreedToPrivacyNotice: "체크 필요"
  },
  en: {
    alternativeChoice: "at least 5 characters",
    lastScenePlace: "at least 2 characters",
    rememberedDetail: "at least 2 characters",
    partnerBehavior: "at least 2 characters",
    protagonistAlias: "at least 1 character",
    partnerAlias: "at least 1 character",
    agreedToFictionNotice: "required",
    agreedToPrivacyNotice: "required"
  }
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

export function formatStoryInputIssues(
  issues: unknown,
  locale: ValidationLocale = "ko"
) {
  const labels = FIELD_LABELS[locale];
  const hints = FIELD_HINTS[locale];

  if (!issues || typeof issues !== "object") {
    return locale === "en" ? "Please check your inputs." : "입력값을 확인해 주세요.";
  }

  const issueMap = issues as IssueMap;
  const fields = Object.entries(issueMap)
    .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
    .map(([field]) => {
      const label = labels[field] ?? field;
      const hint = hints[field];
      return hint ? `${label}(${hint})` : label;
    });

  if (fields.length === 0) {
    return locale === "en" ? "Please check your inputs." : "입력값을 확인해 주세요.";
  }

  return locale === "en"
    ? `Please check: ${fields.join(", ")}`
    : `다음 항목을 확인해 주세요: ${fields.join(", ")}`;
}

export function getLocalStoryInputIssue(
  form: FormValueMap,
  locale: ValidationLocale = "ko"
): LocalValidationIssue | null {
  const labels = FIELD_LABELS[locale];
  const hints = FIELD_HINTS[locale];

  for (const rule of LOCAL_FIELD_RULES) {
    const value = form[rule.fieldId];
    const text = typeof value === "string" ? value.trim() : "";

    if (text.length < rule.minLength) {
      const label = labels[rule.fieldId] ?? rule.fieldId;
      const hint =
        hints[rule.fieldId] ??
        (locale === "en"
          ? `at least ${rule.minLength} characters`
          : `${rule.minLength}자 이상`);

      return {
        fieldId: rule.fieldId,
        message:
          locale === "en"
            ? `Please enter ${label}: ${hint}.`
            : `${label}을 ${hint}으로 입력해 주세요.`
      };
    }
  }

  for (const fieldId of LOCAL_CHECKBOX_RULES) {
    if (form[fieldId] !== true) {
      return {
        fieldId,
        message:
          locale === "en"
            ? `Please check ${labels[fieldId]}.`
            : `${labels[fieldId]}를 체크해 주세요.`
      };
    }
  }

  return null;
}
