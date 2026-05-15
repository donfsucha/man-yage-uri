import type { NextChoice, PreviewStory, StoryChapter, StoryInput } from "./schema";

const emotionTone: Record<StoryInput["emotion"], string> = {
  regret: "후회가 남아 있지만 차분하게 진심을 마주하는 분위기",
  longing: "그리움이 짙지만 상대를 붙잡기보다 마음을 정리하는 분위기",
  anger: "분노를 지나 스스로의 감정을 이해해가는 분위기",
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

function topic(value: string) {
  return `${value}${hasFinalConsonant(value) ? "은" : "는"}`;
}

export function generateMockPreview(input: StoryInput): PreviewStory {
  const title =
    input.desiredEnding === "parallel_world"
      ? "우리가 헤어지지 않았던 밤"
      : `${input.protagonistAlias}의 늦은 대답`;

  return {
    title,
    genre: endingLabel[input.desiredEnding],
    emotional_tone: emotionTone[input.emotion],
    summary: `${input.breakupMoment}에서 ${topic(input.protagonistAlias)} 다른 선택을 한다. "${input.alternativeChoice}" 이야기는 ${input.breakupReason}로 멀어졌던 두 사람이 감정을 안전하게 돌아보는 방향으로 이어진다.`,
    chapters: [
      {
        chapter_no: 1,
        chapter_title: "다시 열린 장면",
        body: `${topic(input.breakupMoment)} 끝난 장면이라고 생각했다. ${input.partnerAlias}의 표정과 말투, 그리고 ${input.breakupReason}라는 이유가 오래 마음에 남아 있었다. 하지만 이번 이야기에서 ${topic(input.protagonistAlias)} 그때 하지 못했던 선택을 한다. "${input.alternativeChoice}" 그 말은 관계를 되돌리는 주문이 아니라, 스스로를 속이지 않기 위한 작은 문장이었다. 둘 사이의 공기는 곧장 달라지지 않았지만, 적어도 침묵이 모든 것을 대신하게 두지는 않았다. 그날 밤은 현실과 조금 다른 길로 접어들었다.`,
        ending_hook: `${topic(input.partnerAlias)} 한참 뒤에야 낮은 목소리로 대답했다. "나도 사실 그 말을 기다렸어."`
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
      chapter_title: "선택이 만든 틈",
      body: `${topic(input.protagonistAlias)} ${direction}라는 방향을 마음속으로 고른 뒤, 끝났다고 믿었던 장면을 조금 더 오래 바라보았다. ${input.partnerAlias} 역시 쉽게 대답하지 못했다. 두 사람은 관계를 되돌리겠다고 약속하지 않았다. 다만 서로의 말이 어디에서 어긋났는지, 그리고 왜 그날 그렇게 멀어졌는지를 한 문장씩 확인하기 시작했다. 그 느린 대화 안에서 오래 굳어 있던 감정이 조금씩 제 이름을 되찾았다.`,
      ending_hook: `${input.partnerAlias}은 작은 숨을 고른 뒤, 처음으로 그날의 진짜 이유를 말했다.`
    },
    {
      chapter_no: 3,
      chapter_title: "말하지 못한 이유",
      body: `오해는 한 번에 풀리지 않았다. ${input.breakupReason}라는 말 뒤에는 서로 다른 두려움이 숨어 있었다. ${topic(input.protagonistAlias)} 상처받지 않으려고 먼저 담담한 척했고, ${topic(input.partnerAlias)} 붙잡히지 않을까 봐 먼저 차가운 사람이 되었다. 이번 세계의 둘은 그 사실을 변명으로 쓰지 않았다. 대신 각자의 마음을 정확히 설명하려 애썼고, 그 과정에서 사랑보다 더 어려운 것이 솔직함이라는 걸 배웠다.`,
      ending_hook: `그 순간, 두 사람 모두 같은 생각을 했다. 끝이 바뀌지 않더라도 이 대화는 필요했다고.`
    },
    {
      chapter_no: 4,
      chapter_title: "다른 하루",
      body: `다음 날은 현실과 닮았지만 조금 달랐다. ${input.protagonistAlias}은 더 이상 지난 메시지를 붙잡고 밤을 새우지 않았다. ${input.partnerAlias}도 침묵을 친절로 착각하지 않기로 했다. 두 사람은 함께 걷거나, 혹은 각자의 자리에서 마지막 인사를 준비했다. 중요한 건 결말의 이름이 아니었다. 재회든 성장의 이별이든, 이번에는 누구도 자신의 마음을 숨긴 채 사라지지 않는다는 사실이었다.`,
      ending_hook: `마지막 장면을 앞두고, ${topic(input.protagonistAlias)} 처음으로 후회보다 가벼운 숨을 쉬었다.`
    },
    {
      chapter_no: 5,
      chapter_title: "우리가 남긴 문장",
      body: `완결의 밤, ${input.protagonistAlias}은 이 이야기가 과거를 고치는 기계가 아니라는 것을 알았다. 이 세계에서 두 사람은 조금 더 오래 대화했고, 조금 덜 아프게 서로를 이해했다. 그래서 현실의 이별까지 모두 사라진 것은 아니었다. 하지만 마음속에 남은 마지막 문장은 달라졌다. "그때 아무것도 하지 못했다"가 아니라, "나는 적어도 내 진심을 외면하지 않았다"가 되었다. 그것만으로도 이 이야기는 충분히 다른 결말이었다.`,
      ending_hook: `그리고 ${input.partnerAlias}의 이름은 더 이상 상처만을 뜻하지 않았다. 한때 진심이 머물렀던 계절의 이름이 되었다.`
    }
  ];
}
