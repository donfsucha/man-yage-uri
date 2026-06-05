import { pdfResponse } from "@/lib/bonus/pdf";
import { recordAnalyticsEventSafely } from "@/lib/story/persistence";

const JOURNAL_TEMPLATES = {
  ko: {
    filename: "ifwe-emotional-journal-ko.pdf",
    title: "미련을 끊어내는 감성 일기장 템플릿",
    lines: [
      "같은 기억이 자꾸 돌아올 때 이 페이지를 사용하세요.",
      "",
      "1. 내가 계속 다시 떠올리는 장면:",
      "   ________________________________________________",
      "   ________________________________________________",
      "",
      "2. 그때 말하지 못해 남아 있는 한 문장:",
      "   ________________________________________________",
      "   ________________________________________________",
      "",
      "3. 두려움이 아니라 사실로 알고 있는 것:",
      "   ________________________________________________",
      "   ________________________________________________",
      "",
      "4. 오늘 나 자신에게 하지 않을 행동:",
      "   ________________________________________________",
      "",
      "5. 내 삶으로 돌아오기 위한 작은 행동:",
      "   ________________________________________________"
    ]
  },
  en: {
    filename: "ifwe-emotional-journal-en.pdf",
    title: "Emotional Journal Template",
    lines: [
      "Use this page when a memory keeps returning.",
      "",
      "1. The scene I keep replaying:",
      "   ________________________________________________",
      "   ________________________________________________",
      "",
      "2. The sentence I wish I had said:",
      "   ________________________________________________",
      "   ________________________________________________",
      "",
      "3. What I know as fact, not fear:",
      "   ________________________________________________",
      "   ________________________________________________",
      "",
      "4. What I will not do to myself today:",
      "   ________________________________________________",
      "",
      "5. One small action that returns me to my life:",
      "   ________________________________________________"
    ]
  }
} as const;

function getLocale(request: Request) {
  return new URL(request.url).searchParams.get("lang") === "ko" ? "ko" : "en";
}

export async function GET(request: Request) {
  const locale = getLocale(request);
  const template = JOURNAL_TEMPLATES[locale];

  await recordAnalyticsEventSafely({
    eventName: "bonus_download",
    metadata: { bonus: "journal_template", locale }
  });

  return pdfResponse(template.filename, template.title, template.lines);
}
