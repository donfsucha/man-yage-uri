import type { ChoiceId, NextChoice } from "./schema";

const initialChoices: NextChoice[] = [
  { choice_id: "A", label: "내가 오해했던 장면을 다시 본다" },
  { choice_id: "B", label: "끝까지 말하지 못한 진심을 꺼낸다" },
  { choice_id: "C", label: "그 사람이 남긴 침묵의 의미를 다시 읽는다" }
];

const chapterChoiceMap: Record<ChoiceId, Record<number, NextChoice[]>> = {
  A: {
    2: [
      { choice_id: "A", label: "못 들은 말을 다시 확인한다" },
      { choice_id: "B", label: "내가 오해한 장면부터 인정한다" },
      { choice_id: "C", label: "상대가 침묵한 이유는 단정하지 않는다" }
    ],
    3: [
      { choice_id: "A", label: "마지막 통화의 빈칸을 꺼낸다" },
      { choice_id: "B", label: "정류장에서 놓친 표정을 떠올린다" },
      { choice_id: "C", label: "사과보다 사실을 먼저 정리한다" }
    ],
    4: [
      { choice_id: "A", label: "재회를 약속하지 않고 사과한다" },
      { choice_id: "B", label: "서로를 나쁜 사람으로 남기지 않는다" },
      { choice_id: "C", label: "마지막 인사를 정확히 고른다" }
    ]
  },
  B: {
    2: [
      { choice_id: "A", label: "같이 걷는 시간을 더 늦춘다" },
      { choice_id: "B", label: "마지막으로 앉았던 자리에 간다" },
      { choice_id: "C", label: "재회라는 말을 일부러 피한다" }
    ],
    3: [
      { choice_id: "A", label: "어색한 침묵을 견뎌본다" },
      { choice_id: "B", label: "돌려주지 못한 물건을 꺼낸다" },
      { choice_id: "C", label: "오늘이 마지막이라면을 말한다" }
    ],
    4: [
      { choice_id: "A", label: "마지막 버스를 그냥 보낸다" },
      { choice_id: "B", label: "다정함을 재회로 착각하지 않는다" },
      { choice_id: "C", label: "약속 대신 고맙다는 말을 남긴다" }
    ]
  },
  C: {
    2: [
      { choice_id: "A", label: "보내지 않을 첫 문장을 쓴다" },
      { choice_id: "B", label: "받는 사람 이름을 비워둔다" },
      { choice_id: "C", label: "상대 마음을 단정한 문장을 지운다" }
    ],
    3: [
      { choice_id: "A", label: "봉투 안에 남길 장면을 고른다" },
      { choice_id: "B", label: "답장이 없어도 되는 밤을 보낸다" },
      { choice_id: "C", label: "나에게 도착할 문장을 남긴다" }
    ],
    4: [
      { choice_id: "A", label: "끝까지 보내지 않고 접어둔다" },
      { choice_id: "B", label: "두 번째 봉투를 자기 앞으로 쓴다" },
      { choice_id: "C", label: "마지막 문장을 용서가 아닌 기록으로 남긴다" }
    ]
  }
};

export function getInitialStoryChoices() {
  return initialChoices;
}

export function getChapterChoices(
  selectedChoiceId: ChoiceId | null,
  chapterNo: number
) {
  if (chapterNo === 1) {
    return getInitialStoryChoices();
  }

  if (!selectedChoiceId || chapterNo >= 5) {
    return [];
  }

  return chapterChoiceMap[selectedChoiceId]?.[chapterNo] ?? [];
}
