import type { ShortsMakerInput, ShortsPackage } from "./schema";
import { getAllowedStatusPhrase } from "./status";

const audienceLabels: Record<ShortsMakerInput["audience"], string> = {
  seniors_parents: "부모님과 시니어 성도",
  church_teams: "교회 사역팀과 미디어 담당자",
  ordinary_believers: "매일 성경통독을 다시 시작하고 싶은 성도",
  gift_buyers: "믿음의 선물을 찾는 가족"
};

const purposeLabels: Record<ShortsMakerInput["purpose"], string> = {
  launch_notice: "출시 준비 소식",
  product_explainer: "제품 설명",
  usage_guide: "사용법 안내",
  church_adoption: "교회 도입 문의",
  parent_empathy: "부모님 공감"
};

const toneLabels: Record<ShortsMakerInput["tone"], string> = {
  warm: "따뜻하게",
  trustworthy: "신뢰감 있게",
  simple_friendly: "쉽고 친근하게",
  church_proposal: "교회 제안서 톤으로"
};

export function generateMockShortsPackage(
  input: ShortsMakerInput
): ShortsPackage {
  const statusPhrase = getAllowedStatusPhrase(input);
  const audience = audienceLabels[input.audience];
  const purpose = purposeLabels[input.purpose];
  const tone = toneLabels[input.tone];
  const memoLine = input.memo ? `오늘 강조점: ${input.memo}` : "";

  return {
    hooks: [
      "성경통독이 어려운 이유, 의지가 아니라 시작 과정일 수 있습니다.",
      "부모님이 앱 찾기 어려워하신다면, 말씀 루틴을 더 쉽게 만들어보세요.",
      "폰을 거치대에 올리는 작은 행동이 오늘의 통독 시작이 됩니다."
    ],
    script: [
      "성경통독을 하고 싶은 마음은 있는데,",
      "폰을 켜고 앱을 찾고 메뉴를 누르는 과정이 번거로울 때가 있습니다.",
      "성경통독 거치대야는 폰을 거치대에 올리는 행동으로",
      "매일 말씀 루틴을 더 쉽게 시작하도록 돕습니다.",
      `${statusPhrase}, 지금은 ${audience}에게 ${purpose}를 전하기 좋은 시기입니다.`,
      memoLine,
      "출시 소식이나 교회 도입 문의가 필요하시면 메시지를 남겨주세요."
    ]
      .filter(Boolean)
      .join("\n"),
    subtitles: [
      "성경통독, 시작이 어려우셨나요?",
      "앱 찾고 메뉴 누르는 과정 대신",
      "폰을 거치대에 올리면",
      "말씀 루틴을 더 쉽게 시작",
      statusPhrase,
      "문의는 메시지로 남겨주세요"
    ],
    storyboard: [
      {
        scene: "1",
        visual: "책상 위 성경책과 거치대를 함께 보여준다.",
        narration: "성경통독을 결심해도 시작 과정이 번거로울 때가 있습니다.",
        onScreenText: "성경통독, 시작이 어려우셨나요?"
      },
      {
        scene: "2",
        visual: "손이 스마트폰을 거치대 위에 천천히 올린다.",
        narration: "성경통독 거치대야는 폰을 올리는 행동을 루틴의 시작점으로 만듭니다.",
        onScreenText: "폰만 올리면 말씀 루틴 시작"
      },
      {
        scene: "3",
        visual: "폰 화면에서 성경통독 콘텐츠가 준비되는 느낌을 클로즈업한다.",
        narration: "부모님과 시니어 성도도 더 쉽게 매일 말씀을 만날 수 있습니다.",
        onScreenText: "부모님께도 쉬운 통독 습관"
      },
      {
        scene: "4",
        visual: "제품을 침대 옆이나 식탁 위에 놓은 생활 장면으로 마무리한다.",
        narration: `${statusPhrase}. ${tone} 전할 수 있는 소식입니다.`,
        onScreenText: "성경통독 거치대야 출시 준비 중"
      }
    ],
    shotList: [
      "거치대 위에 폰을 올리는 손 장면",
      "성경책, 노트, 거치대가 함께 보이는 생활 장면",
      "앱 화면 또는 통독 콘텐츠가 보이는 클로즈업",
      "부모님 세대를 떠올릴 수 있는 차분한 사용 장면",
      "문의 CTA를 넣을 마지막 제품 정면 컷"
    ],
    titleOptions: [
      "부모님 성경통독, 앱 찾기부터 어려우셨다면",
      "폰을 올리는 순간 시작되는 말씀 루틴",
      "성경통독 거치대야 출시 준비 중"
    ],
    caption: [
      "성경통독은 마음만큼 시작 과정도 중요합니다.",
      "성경통독 거치대야는 폰을 거치대에 올리는 작은 행동으로 매일 말씀 루틴을 돕는 제품입니다.",
      `${statusPhrase}.`,
      "출시 소식이나 교회 단체 도입 문의가 필요하시면 댓글 또는 메시지로 알려주세요."
    ].join("\n"),
    hashtags: [
      "#성경통독",
      "#성경통독거치대야",
      "#XCANPLAYER",
      "#말씀루틴",
      "#기독교콘텐츠",
      "#부모님선물",
      "#교회미디어"
    ],
    ctaOptions: [
      "출시 소식이 궁금하시면 댓글에 통독이라고 남겨주세요.",
      "교회 단체 도입 문의는 메시지로 남겨주세요.",
      "부모님께 필요한 기능인지 저장해두고 함께 확인해보세요."
    ],
    thumbnailTextOptions: [
      "폰만 올리면 통독 시작",
      "부모님 성경통독 쉽게",
      "말씀 루틴 출시 준비 중"
    ],
    reviewChecklist: [
      "플레이스토어에 보이는 개발자명과 앱 상태를 확인했는가?",
      "정식 출시 완료처럼 보이는 표현을 쓰지 않았는가?",
      "교회나 파트너 이름 사용 허가가 있는가?",
      "영상 속 폰 화면에 개인정보가 노출되지 않는가?",
      "음악, 이미지, 폰 화면 사용 권리를 확인했는가?",
      "CTA 링크 또는 문의 채널이 현재 유효한가?"
    ]
  };
}
