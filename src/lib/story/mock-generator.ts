import type { NextChoice, PreviewStory, StoryChapter, StoryInput } from "./schema";

const emotionTone: Record<StoryInput["emotion"], string> = {
  regret: "후회가 남아 있지만 차분하게 진심을 마주하는 분위기",
  longing: "그리움은 짙지만 상대를 붙잡기보다 마음을 정리하는 분위기",
  anger: "분노를 지나 스스로의 감정을 이해해 가는 분위기",
  calm: "담담하고 성숙하게 지난 관계를 바라보는 분위기",
  gratitude: "고마움과 아쉬움이 함께 남은 따뜻한 분위기"
};

const endingLabel: Record<StoryInput["desiredEnding"], string> = {
  reunion: "재회의 가능성",
  growth: "각자의 성장",
  farewell: "완전한 이별",
  parallel_world: "평행세계의 다른 하루"
};

function hasFinalConsonant(value: string) {
  const lastChar = [...value.trim()].at(-1);

  if (!lastChar) {
    return false;
  }

  const code = lastChar.charCodeAt(0);
  const hangulStart = 0xac00;
  const hangulEnd = 0xd7a3;

  if (code < hangulStart || code > hangulEnd) {
    return false;
  }

  return (code - hangulStart) % 28 !== 0;
}

function subject(value: string) {
  return `${value}${hasFinalConsonant(value) ? "은" : "는"}`;
}

function object(value: string) {
  return `${value}${hasFinalConsonant(value) ? "을" : "를"}`;
}

export function generateMockPreview(input: StoryInput): PreviewStory {
  const title =
    input.desiredEnding === "parallel_world"
      ? "우리가 헤어지지 않았던 밤"
      : `${input.protagonistAlias}의 다른 마지막`;

  return {
    title,
    genre: endingLabel[input.desiredEnding],
    emotional_tone: emotionTone[input.emotion],
    summary: `${input.breakupMoment}에서 ${subject(
      input.protagonistAlias
    )} 다른 선택을 한다. "${input.alternativeChoice}"라는 문장은 ${input.breakupReason}로 멀어진 마음을 안전한 픽션 안에서 다시 바라보게 만든다.`,
    chapters: [
      {
        chapter_no: 1,
        chapter_title: "다시 열린 장면",
        body: `${subject(input.breakupMoment)} 이미 끝난 장면이라고 생각했다. ${subject(
          input.partnerAlias
        )} 남긴 표정과 말투, 그리고 ${input.breakupReason}라는 이유가 오래 마음에 남아 있었다.\n\n하지만 이번 이야기에서 ${subject(
          input.protagonistAlias
        )} 그날 하지 못했던 선택을 한다. "${input.alternativeChoice}" 그 말은 관계를 되돌리는 주문이 아니었다. 스스로를 더 다치게 두지 않기 위한 작은 문장이었다.\n\n두 사람 사이의 공기는 여전히 조심스러웠다. 그래도 이번에는 침묵이 모든 것을 대신 말하게 두지 않았다. ${subject(
          input.protagonistAlias
        )} 떨리는 목소리로 자기 마음의 가장 안전한 부분부터 꺼냈고, ${subject(
          input.partnerAlias
        )} 처음으로 도망치지 않고 그 말을 들었다.`,
        ending_hook: `${subject(
          input.partnerAlias
        )} 한참 뒤에야 낮은 목소리로 대답했다. "나도 사실 그 말을 기다렸어."`
      }
    ],
    next_choices: [
      { choice_id: "A", label: "오해를 하나씩 풀어본다" },
      { choice_id: "B", label: "마지막 하루를 함께 보낸다" },
      { choice_id: "C", label: "각자의 진심을 편지로 남긴다" }
    ],
    safety_flags: {
      contains_self_harm_risk: false,
      contains_stalking_risk: false,
      requires_manual_review: false
    }
  };
}

export function generateMockPaidChapters(
  input: StoryInput,
  selectedChoice: NextChoice
): StoryChapter[] {
  const direction = selectedChoice.label;

  return [
    {
      chapter_no: 2,
      chapter_title: "선택이 만든 문",
      body: `${subject(input.protagonistAlias)} ${direction}는 방향을 골랐다. 이미 지나간 시간을 고칠 수는 없었지만, 그 장면을 다시 바라보는 방식은 달라질 수 있었다.\n\n${subject(
        input.partnerAlias
      )} 처음에는 쉽게 대답하지 못했다. 두 사람은 서로를 설득하려 하지 않고, 그날의 말들이 어디에서 엇갈렸는지 천천히 확인했다. ${subject(
        input.protagonistAlias
      )} 알게 된 것은 단순했다. 사랑이 끝났다는 사실보다, 끝나는 동안 서로의 마음을 너무 오래 짐작했다는 사실이 더 아팠다.`,
      ending_hook: `${subject(
        input.partnerAlias
      )} 작은 숨을 고른 뒤 처음으로 그날의 진짜 이유를 말했다.`
    },
    {
      chapter_no: 3,
      chapter_title: "말하지 못한 이유",
      body: `${input.breakupReason}라는 말 안에는 서로 다른 두려움이 숨어 있었다. ${subject(
        input.protagonistAlias
      )} 상처받지 않으려고 먼저 담담한 척했고, ${subject(
        input.partnerAlias
      )} 붙잡히지 않을까 봐 먼저 차가운 사람이 되었다.\n\n이번 세계에서 두 사람은 그 사실을 변명으로 쓰지 않았다. 대신 각자의 마음을 더 정확히 설명하려 애썼다. 그 과정에서 사랑보다 더 어려운 것이 정직함이라는 것도 배웠다.`,
      ending_hook:
        "그 순간, 두 사람은 같은 생각을 했다. 삶이 바뀌지 않더라도 마음은 정리될 수 있다고."
    },
    {
      chapter_no: 4,
      chapter_title: "다른 하루",
      body: `다음 날은 현실과 닮아 있었지만 조금 달랐다. ${subject(
        input.protagonistAlias
      )} 더 이상 지난 메시지를 붙잡고 밤을 새우지 않았다. ${subject(
        input.partnerAlias
      )} 침묵을 친절로 착각하지 않기로 했다.\n\n두 사람은 천천히 걸었고, 어떤 결말도 서둘러 이름 붙이지 않았다. 재회든, 성장든, 이별이든 중요한 것은 끝까지 자신을 잃지 않는 일이었다.`,
      ending_hook: `${subject(
        input.protagonistAlias
      )} 마지막 장면 앞에서 처음으로 후회보다 가벼운 숨을 쉬었다.`
    },
    {
      chapter_no: 5,
      chapter_title: "우리가 남긴 문장",
      body: `완결의 밤, ${subject(
        input.protagonistAlias
      )} 이 이야기가 과거를 고치는 기계가 아니라는 것을 알았다. 이 세계에서 두 사람은 조금 더 오래 대화했고, 조금 더 아프게 서로를 이해했다. 그래도 현실의 이별까지 모두 사라지는 것은 아니었다.\n\n하지만 마음속에 남은 마지막 문장은 달라졌다. "그때 아무것도 하지 못했어"가 아니라, "나는 적어도 내 진심을 외면하지 않았어"가 되었다. 그것만으로도 이 이야기는 충분히 다른 결말이었다.`,
      ending_hook: `${object(
        input.partnerAlias
      )} 떠올릴 때마다 아픔만 올라오지는 않았다. 이제 그 이름은 진심을 배운 계절의 이름이 되었다.`
    }
  ];
}
