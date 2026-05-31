import type { ChoiceId, NextChoice, StoryInput } from "./schema";

type StoryLanguage = NonNullable<StoryInput["outputLanguage"]>;

const initialChoices: Record<StoryLanguage, NextChoice[]> = {
  ko: [
    { choice_id: "A", label: "읽음으로 바뀐 문자의 진짜 이유를 확인한다" },
    { choice_id: "B", label: "마지막 하루에 숨은 다정함의 대가를 본다" },
    { choice_id: "C", label: "예림이 끝내 말하지 못한 한 문장을 읽는다" }
  ],
  en: [
    { choice_id: "A", label: "Find the real reason behind the read message" },
    { choice_id: "B", label: "Spend the final day and uncover its cost" },
    { choice_id: "C", label: "Read the sentence left unsaid" }
  ]
};

const chapterChoiceMap: Record<
  StoryLanguage,
  Record<ChoiceId, Record<number, NextChoice[]>>
> = {
  ko: {
    A: {
      2: [
        { choice_id: "A", label: "못 들은 말을 다시 확인한다" },
        { choice_id: "B", label: "내가 오해한 장면부터 인정한다" },
        { choice_id: "C", label: "상대가 침묵한 이유는 단정하지 않는다" }
      ],
      3: [
        { choice_id: "A", label: "마지막 통화의 빈칸을 꺼낸다" },
        { choice_id: "B", label: "정류장에 남은 시간을 다시 맞춘다" },
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
  },
  en: {
    A: {
      2: [
        { choice_id: "A", label: "Check the words that were never heard" },
        { choice_id: "B", label: "Admit the scene I misunderstood first" },
        { choice_id: "C", label: "Do not decide why the silence happened" }
      ],
      3: [
        { choice_id: "A", label: "Open the blank in the final call" },
        { choice_id: "B", label: "Reset the time left at the bus stop" },
        { choice_id: "C", label: "Sort out the facts before apologizing" }
      ],
      4: [
        { choice_id: "A", label: "Apologize without promising reunion" },
        { choice_id: "B", label: "Refuse to leave either person as the villain" },
        { choice_id: "C", label: "Choose the last goodbye precisely" }
      ]
    },
    B: {
      2: [
        { choice_id: "A", label: "Let the walk last a little longer" },
        { choice_id: "B", label: "Return to the place they last sat together" },
        { choice_id: "C", label: "Avoid saying the word reunion" }
      ],
      3: [
        { choice_id: "A", label: "Endure the awkward silence" },
        { choice_id: "B", label: "Bring out the object never returned" },
        { choice_id: "C", label: "Say what today means if it is the last day" }
      ],
      4: [
        { choice_id: "A", label: "Let the last bus pass" },
        { choice_id: "B", label: "Do not mistake kindness for reunion" },
        { choice_id: "C", label: "Leave gratitude instead of a promise" }
      ]
    },
    C: {
      2: [
        { choice_id: "A", label: "Write the first sentence that will not be sent" },
        { choice_id: "B", label: "Leave the recipient line empty" },
        { choice_id: "C", label: "Delete the line that assumes their heart" }
      ],
      3: [
        { choice_id: "A", label: "Choose the scene to leave in the envelope" },
        { choice_id: "B", label: "Spend a night that needs no reply" },
        { choice_id: "C", label: "Leave a sentence that arrives back to me" }
      ],
      4: [
        { choice_id: "A", label: "Fold it away without sending it" },
        { choice_id: "B", label: "Address the second envelope to myself" },
        { choice_id: "C", label: "Leave the final line as a record, not forgiveness" }
      ]
    }
  }
};

export function getStoryLanguage(input?: Pick<StoryInput, "outputLanguage"> | null) {
  return input?.outputLanguage === "en" ? "en" : "ko";
}

export function getInitialStoryChoices(language: StoryLanguage = "ko") {
  return initialChoices[language];
}

export function getChapterChoices(
  selectedChoiceId: ChoiceId | null,
  chapterNo: number,
  language: StoryLanguage = "ko"
) {
  if (chapterNo === 1) {
    return getInitialStoryChoices(language);
  }

  if (!selectedChoiceId || chapterNo >= 5) {
    return [];
  }

  return chapterChoiceMap[language][selectedChoiceId]?.[chapterNo] ?? [];
}
