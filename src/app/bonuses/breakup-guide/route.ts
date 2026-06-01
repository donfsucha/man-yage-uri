import { pdfResponse } from "@/lib/bonus/pdf";

const BREAKUP_GUIDES = {
  ko: {
    filename: "ifwe-breakup-guide-ko.pdf",
    title: "이별 후 절대 해서는 안 될 3가지 행동",
    lines: [
      "완결편을 읽은 뒤 마음을 안전하게 정리하기 위한 작은 가이드입니다.",
      "",
      "1. 아픔을 연락으로 바꾸지 않기",
      "   보내고 싶은 말은 먼저 비공개 메모장에 적어보세요.",
      "   24시간이 지난 뒤에도 꼭 필요한 말인지 다시 확인하세요.",
      "",
      "2. 침묵을 전부 증거로 해석하지 않기",
      "   답장이 없다는 사실은 여러 뜻을 가질 수 있습니다.",
      "   결론이 아니라 아직 모르는 상태로 남겨두세요.",
      "",
      "3. 후련함을 상대에게만 맡기지 않기",
      "   내가 상처받은 지점을 이름 붙이고 오늘의 작은 행동을 정하세요.",
      "",
      "작은 원칙: 대답을 쫓기 전에 내 존엄을 먼저 지키기."
    ]
  },
  en: {
    filename: "ifwe-breakup-guide-en.pdf",
    title: "3 Things Not To Do After a Breakup",
    lines: [
      "A small guide for keeping your heart safe after reading your story.",
      "",
      "1. Do not turn pain into contact.",
      "   If you want to send a message, write it in a private note first.",
      "   Wait 24 hours before deciding whether it still needs to be sent.",
      "",
      "2. Do not reread every silence as proof.",
      "   A silence can mean many things. Treat it as unknown, not as a verdict.",
      "",
      "3. Do not make the other person responsible for your closure.",
      "   Closure often starts when you name what hurt and choose one next step.",
      "",
      "Gentle rule: protect your dignity before you chase an answer."
    ]
  }
} as const;

function getLocale(request: Request) {
  return new URL(request.url).searchParams.get("lang") === "ko" ? "ko" : "en";
}

export function GET(request: Request) {
  const guide = BREAKUP_GUIDES[getLocale(request)];

  return pdfResponse(guide.filename, guide.title, guide.lines);
}
