import type {
  NextChoice,
  PreviewStory,
  StoryChapter,
  StoryInput,
  StoryScene
} from "./schema";
import {
  getChapterChoices,
  getInitialStoryChoices,
  getStoryLanguage
} from "./story-choices";
import { countReadableChars, LONG_FORM_TARGETS } from "./story-length";

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

function nominative(value: string) {
  return `${value}${hasFinalConsonant(value) ? "이" : "가"}`;
}

function also(value: string) {
  return `${value}도`;
}

function objectMarkedPhrase(value: string) {
  return `${value}${hasFinalConsonant(value) ? "을" : "를"}`;
}

function behaviorPredicate(value: string) {
  const behavior = value.trim().replace(/[.。]$/, "");

  if (!behavior) {
    return "쉽게 대답하지 못하는 편이었다";
  }

  if (/(했다|였다|이었다|이다)$/.test(behavior)) {
    return behavior;
  }

  if (behavior.endsWith("편")) {
    return `${behavior}이었다`;
  }

  if (/(모습|표정|얼굴|웃음|미소)$/.test(behavior)) {
    return `${objectMarkedPhrase(behavior)} 보였다`;
  }

  if (behavior.endsWith("어")) {
    return `${behavior.slice(0, -1)}던 모습을 보였다`;
  }

  if (behavior.endsWith("어요")) {
    return `${behavior.slice(0, -2)}던 모습을 보였다`;
  }

  return `${behavior} 모습을 보였다`;
}

function behaviorFact(value: string) {
  const predicate = behaviorPredicate(value);

  if (predicate.endsWith("다")) {
    return `${predicate.slice(0, -1)}다는 사실`;
  }

  return `${predicate}는 사실`;
}

function rememberedDetailPhrases(input: StoryInput) {
  const detail = input.rememberedDetail.trim().replace(/[.。]$/, "");
  const prettyMatch = detail.match(/^(.+?)\s*예뻐(?:요)?$/);

  if (prettyMatch?.[1]) {
    const personDescription = `${prettyMatch[1].trim()} 예쁜 ${input.partnerAlias}`;

    return {
      visual: personDescription,
      asSubject: nominative(personDescription),
      asTopic: `${personDescription}의 모습은`,
      asObject: `${personDescription}의 모습을`
    };
  }

  return {
    visual: detail,
    asSubject: nominative(detail),
    asTopic: subject(detail),
    asObject: object(detail)
  };
}

function buildEnglishScenes(input: StoryInput): StoryScene[] {
  return [
    {
      scene_no: 1,
      scene_title: "The Message Turns",
      setting: input.lastScenePlace,
      body: `The last place still holds ${input.rememberedDetail}. ${input.protagonistAlias} looks at the old message and realizes the breakup did not end as neatly as memory claimed.`,
      dialogue: `"I should have said this differently," ${input.protagonistAlias} whispers.`,
      visual_prompt:
        "Cinematic mobile web novel scene, rainy urban night, phone screen glowing, emotional but safe fictional breakup reflection",
      emotion: "regret and suspense"
    },
    {
      scene_no: 2,
      scene_title: "A Tired Pattern",
      setting: "A remembered ordinary day",
      body: `${input.partnerAlias} used to show it through ${input.partnerBehavior}. What once looked like distance now feels like a scene ${input.protagonistAlias} never fully understood.`,
      dialogue: `"You always decide what I mean before I finish."`,
      visual_prompt:
        "Quiet cafe memory, two people across a small table, restrained emotion, realistic modern romance",
      emotion: "unfinished tenderness"
    },
    {
      scene_no: 3,
      scene_title: "The Typing Indicator",
      setting: "A phone screen in the rain",
      body: `The read receipt appears first. Then a small line flickers at the top of the screen: ${input.partnerAlias} is typing. The story stops exactly where a choice becomes necessary.`,
      dialogue: `"[${input.partnerAlias} is typing...]"`,
      visual_prompt:
        "Close-up phone interface with typing indicator, rain reflections, high-tension romantic cliffhanger",
      emotion: "cliffhanger"
    }
  ];
}

function englishPreviewBody(input: StoryInput, scenes: StoryScene[]) {
  return buildEnglishLongBody(
    `If ${input.protagonistAlias} had chosen one sentence differently, the night of ${input.breakupMoment} might not have become the same wound. This is not a way to predict ${input.partnerAlias}'s real heart. It is a safe fictional room where regret can be replayed without chasing anyone in the real world. ${input.breakupReason} had sounded simple at the time, but the scene kept refusing to stay simple.`,
    [
      () =>
        `${scenes[0].body} The detail that returns first is ${input.rememberedDetail}. It is small enough to seem harmless, but precise enough to pull the whole night back into focus.`,
      () =>
        `The relationship had not broken in one dramatic argument. It had thinned through delayed replies, postponed promises, and ordinary days where both people acted fine while quietly keeping score.`,
      () =>
        `${scenes[1].body} The old version of ${input.protagonistAlias} treated every silence as proof. The new version lets the silence stay unknown long enough to become a question.`,
      () =>
        `"${input.alternativeChoice}" The sentence feels too late and too necessary at once. It does not ask for reunion. It only asks the story to stop lying about what hurt.`,
      () =>
        `The screen lights up again. The message that had stayed frozen suddenly changes to read, and the word looks almost physical, as if the phone has become a door with light under it.`,
      () =>
        `${scenes[2].body} ${input.protagonistAlias} cannot know what it means yet. That is why the next choice matters: fact, final day, or unsent truth.`
    ],
    LONG_FORM_TARGETS.freePreview.minChars + 250
  );
}

function generateEnglishMockPreview(input: StoryInput): PreviewStory {
  const scenes = buildEnglishScenes(input);
  const nextChoices = getInitialStoryChoices("en");

  return {
    title: "The Night the Message Turned Read",
    genre: "alternate-ending romance",
    emotional_tone: "regretful, cinematic, and emotionally safe",
    summary:
      "A fictional breakup preview about the one sentence that might have changed the night, ending on a read receipt and a typing indicator that opens three paid story directions.",
    chapters: [
      {
        chapter_no: 1,
        chapter_title: "The Scene Opens Again",
        body: englishPreviewBody(input, scenes),
        ending_hook: `The old message suddenly changed to read. A second later, a small line flickered at the top of the screen: [${input.partnerAlias} is typing...] Between the rain and the light of the phone, ${input.protagonistAlias} had to decide which direction of the story to touch next.`,
        next_choices: nextChoices
      }
    ],
    scenes,
    next_choices: nextChoices,
    safety_flags: {
      contains_self_harm_risk: false,
      contains_stalking_risk: false,
      requires_manual_review: false
    }
  };
}

type BeatFactory = (round: number) => string;

function buildLongBody(
  opening: string,
  beats: BeatFactory[],
  targetChars: number
) {
  const paragraphs = [opening.trim()];
  let index = 0;
  const sceneTurns = [
    "이번 장면의 초점은 대답이 아니라 손끝의 망설임이었다.",
    "다음 순간에는 유리창에 비친 표정이 먼저 흔들렸다.",
    "조용한 숨소리 사이로 말하지 않은 문장이 한 박자 늦게 떠올랐다.",
    "바닥에 고인 물빛이 두 사람의 거리를 더 분명하게 보여주었다.",
    "그때 멀리서 들려온 안내음이 대화를 잠깐 끊어 놓았다.",
    "작은 소지품 하나가 기억의 방향을 예상 밖으로 돌려놓았다.",
    "한 번 삼킨 말은 곧바로 사라지지 않고 목 안쪽에 남았다.",
    "시선이 엇갈린 자리에는 대답보다 먼저 피로가 내려앉았다.",
    "누군가 웃는 소리가 지나가자 두 사람은 동시에 말을 멈췄다.",
    "잠깐의 정적이 지나간 뒤, 장면은 조금 다른 온도로 이어졌다."
  ];
  const paragraphLeads = [
    "유리창에 남은 빗물 너머로,",
    "정류장 바닥의 작은 물빛 때문에,",
    "꺼지지 않는 휴대폰 화면 앞에서,",
    "말끝이 한번 흔들린 뒤에,",
    "멀리 지나가는 안내음 사이로,",
    "젖은 소매 끝을 내려다보며,",
    "서로의 시선이 잠깐 엇갈리자,",
    "식어가는 공기가 어깨에 닿을 때,",
    "가방 끈을 고쳐 잡는 짧은 순간,",
    "문득 너무 평범한 소음이 들려오자,",
    "숨을 고르는 박자가 조금 늦어지며,",
    "말하지 않은 문장이 먼저 떠오르자,"
  ];
  const extraParagraphLeads = [
    "잠긴 목소리가 조금 풀리기 시작하자,",
    "가로등 아래로 물방울이 떨어질 때,",
    "두 사람이 같은 쪽을 보지 못한 사이,",
    "손등 위로 차가운 공기가 스치자,",
    "짧은 숨이 대답보다 먼저 흘러나오며,",
    "익숙한 침묵이 낯설게 느껴지는 동안,",
    "발밑의 작은 그림자가 흔들리자,",
    "지나간 말 하나가 뒤늦게 자리를 잡자,",
    "상대의 표정을 해석하려던 순간,",
    "마지막이라고 믿었던 시간이 조금 늘어나자,",
    "닫힌 문장 사이에 틈이 생기자,",
    "흐린 유리 너머 풍경이 번질 때,",
    "괜찮다는 말이 쉽게 나오지 않자,",
    "오래 묵은 오해가 모양을 바꾸자,",
    "서둘러 정리한 마음이 다시 멈춰 서자,",
    "작은 물건 하나가 기억을 건드리자,"
  ];
  const allParagraphLeads = [...paragraphLeads, ...extraParagraphLeads];
  const detailTurns = [
    "그 작고 구체적인 감각이 장면을 설명이 아니라 실제 기억처럼 붙잡았다.",
    "그래서 감정은 같은 자리를 맴돌지 않고 다른 물건과 다른 표정으로 옮겨 갔다.",
    "두 사람은 결론보다 먼저, 방금 지나간 몇 초를 서로 다르게 받아들였다는 사실을 보았다.",
    "이 작은 차이가 다음 선택을 미루게 만들었고, 미룬 만큼 장면은 더 팽팽해졌다.",
    "예전 같으면 바로 해석했을 행동도 이번에는 그대로 남겨 두었다.",
    "한 문장이 끝나기도 전에 다른 기억이 끼어들었지만, 이야기는 서두르지 않았다.",
    "그 덕분에 같은 후회도 조금씩 다른 방향으로 갈라졌다.",
    "무엇을 말하지 않았는지가 무엇을 말했는지만큼 중요해지는 순간이었다."
  ];

  while (countReadableChars(paragraphs.join("\n\n")) < targetChars) {
    const beat = beats[index % beats.length];
    const round = Math.floor(index / beats.length) + 1;
    const lead = allParagraphLeads[index % allParagraphLeads.length];
    const sceneTurn = sceneTurns[index % sceneTurns.length];
    const detailTurn = detailTurns[index % detailTurns.length];
    paragraphs.push(`${lead} ${beat(round)} ${sceneTurn} ${detailTurn}`);
    index += 1;

    if (index > 80) {
      break;
    }
  }

  return paragraphs.join("\n\n");
}

function buildEnglishLongBody(
  opening: string,
  beats: BeatFactory[],
  targetChars: number
) {
  const paragraphs = [opening.trim()];
  let index = 0;
  const leads = [
    "Under the dim reflection of the phone screen,",
    "When the rain softened the edge of the street,",
    "At the exact place where memory usually becomes unfair,",
    "Before either person could become the villain again,",
    "As the ordinary noise of the night came back,",
    "With one small object returning to the center of the scene,",
    "After a silence that no longer needed to be solved,",
    "When the old message stopped feeling like proof,"
  ];
  const turns = [
    "This time, the scene moves through a new action instead of repeating the same ache.",
    "The detail returns with a different meaning, so the regret has somewhere to go.",
    "No one guesses the other person's real heart; the story stays inside visible facts and remembered moments.",
    "A small reversal makes the memory feel less flat and more worth following.",
    "The branch matters because the same breakup now opens a different consequence."
  ];

  while (countReadableChars(paragraphs.join("\n\n")) < targetChars) {
    const beat = beats[index % beats.length];
    const lead = leads[index % leads.length];
    const turn = turns[index % turns.length];

    paragraphs.push(`${lead} ${beat(index + 1)} ${turn}`);
    index += 1;

    if (index > 80) {
      break;
    }
  }

  return paragraphs.join("\n\n");
}

function previewBeats(input: StoryInput): BeatFactory[] {
  const rememberedDetail = rememberedDetailPhrases(input);

  return [
    (round) =>
      `${round === 1 ? "처음에는" : "다시 한 번"} ${input.lastScenePlace}의 소리들이 선명해졌다. 지나가는 차가 물웅덩이를 밟는 소리, 젖은 바닥 위로 미끄러지는 발소리, 그리고 끊길 듯 이어지는 숨소리까지. ${subject(
        input.protagonistAlias
      )} 그 모든 것을 늦게 도착한 증거처럼 바라봤다. ${rememberedDetail.asTopic} 아무 일도 없었다는 듯 그 자리에 있었고, 그 평범함이 오히려 마음을 더 흔들었다.`,
    () =>
      `${subject(input.partnerAlias)} 늘 ${behaviorPredicate(
        input.partnerBehavior
      )}. 예전의 ${subject(
        input.protagonistAlias
      )} 그 모습을 보면 곧바로 거절이라고 생각했다. 하지만 이번 장면에서는 그 마음을 단정하지 않았다. 상대의 침묵을 해석하려는 순간마다, 이야기는 한 걸음씩 멈춰 섰다. 모르는 것은 모르는 채로 두는 일이 두 사람을 더 안전하게 만들었다.`,
    () =>
      `${input.breakupReason}라는 말은 처음 들었을 때보다 더 복잡했다. 그 말 안에는 사실도 있었고, 서로가 미처 확인하지 못한 짐작도 있었다. ${subject(
        input.protagonistAlias
      )} 이번에는 이별을 한 문장으로 정리하지 않았다. 대신 그 문장 아래에 숨어 있던 작은 장면들을 하나씩 펼쳐 보았다. 그제야 아픔은 덩어리가 아니라 여러 겹의 얇은 종이처럼 보였다.`,
    () =>
      `"${input.alternativeChoice}" ${subject(
        input.protagonistAlias
      )} 그 말을 속으로만 반복하지 않고 천천히 꺼냈다. 말이 밖으로 나오는 순간, 세상이 극적으로 바뀌지는 않았다. 다만 목 안쪽에 오래 걸려 있던 것이 조금 내려갔다. 이 이야기는 누군가를 붙잡기 위한 장면이 아니라, 자기 마음을 거칠게 버려두지 않기 위한 장면이었다.`,
    () =>
      `긴장감은 큰 사건에서 오지 않았다. ${subject(
        input.partnerAlias
      )} 대답하려다 멈추는 손끝, ${subject(
        input.protagonistAlias
      )} 한 박자 늦게 고개를 드는 순간, 그리고 두 사람 사이에 놓인 빈자리에서 왔다. 아무도 먼저 결론을 말하지 않았기 때문에 장면은 더 오래 살아 있었다. 헤어짐이 확정된 뒤에도 마음에는 아직 확인되지 않은 문장이 남아 있었다.`,
    () =>
      `그 밤의 공기는 쉽게 풀리지 않았다. 한 문장을 말하면 다른 문장이 뒤늦게 따라왔고, 사과를 하면 변명처럼 들릴까 봐 둘 다 조심스러워졌다. ${subject(
        input.protagonistAlias
      )} 관계를 되돌릴 수 있다고 믿지는 않았다. 그래도 이번만큼은 자기 안에서 혼자 재판을 끝내지 않기로 했다. 그 결정이 1화의 가장 작은 반전이었다.`
  ];
}

function buildPreviewChapterBody(input: StoryInput, scenes: StoryScene[]) {
  const opening = `그때 딱 한 문장만 다르게 말했더라면, ${subject(input.breakupMoment)} 완전히 다른 기억이 되었을지도 모른다. ${subject(
    input.protagonistAlias
  )} 그 가능성이 아직 마음속에서 끝나지 않은 장면처럼 남아 있다는 사실을 인정했다. 다시 만나자는 말이 아니라, 적어도 그날의 나를 덜 미워하기 위해 필요한 문장부터 꺼내야 했다.\n\n${scenes[0].body}\n\n${scenes[1].body}\n\n${scenes[2].body}\n\n두 사람 사이의 공기는 여전히 조심스러웠다. 그래도 이번에는 침묵이 모든 것을 대신 말하게 두지 않았다. ${subject(
    input.protagonistAlias
  )} 떨리는 목소리로 자기 마음의 가장 안전한 부분부터 꺼냈고, ${subject(
    input.partnerAlias
  )} 처음으로 그 말을 끝까지 들었다.`;

  return buildLongBody(
    opening,
    previewBeats(input),
    LONG_FORM_TARGETS.freePreview.minChars
  );
}

function buildScenes(input: StoryInput): StoryScene[] {
  const rememberedDetail = rememberedDetailPhrases(input);

  return [
    {
      scene_no: 1,
      scene_title: "다시 켜진 마지막 장면",
      setting: `${input.lastScenePlace}, ${subject(
        input.breakupMoment
      )} 아직 끝나지 않은 순간`,
      body: `${input.lastScenePlace}에는 이상할 만큼 작은 소리까지 남아 있었다. 지나가는 사람들의 발소리는 멀어졌다가 다시 가까워졌고, 꺼질 듯하던 불빛은 끝내 꺼지지 않았다. ${rememberedDetail.asSubject} 눈에 들어오자, ${subject(
        input.protagonistAlias
      )} 그날의 끝을 처음부터 다시 보는 기분이 들었다. 이미 끝났다고 믿었던 ${subject(
        input.breakupMoment
      )} 아직 한 문장만큼 남아 있었다. 그 한 문장을 놓치면, 이번에도 같은 방식으로 무너질 것 같았다.`,
      dialogue: "잠깐만, 나 이번에는 그냥 넘기지 않고 말할게.",
      visual_prompt: `Korean emotional web novel card, ${input.lastScenePlace}, ${rememberedDetail.visual}, soft realistic lighting`,
      emotion: "후회와 용기가 동시에 올라오는 장면"
    },
    {
      scene_no: 2,
      scene_title: "침묵을 짐작하지 않는 법",
      setting: `${input.lastScenePlace}의 공기가 조금 가라앉은 뒤`,
      body: `${subject(input.partnerAlias)} 늘 ${behaviorPredicate(
        input.partnerBehavior
      )}. 예전의 ${subject(
        input.protagonistAlias
      )} 그 반응을 차가움이라고만 받아들였지만, 이번 이야기에서는 함부로 마음을 단정하지 않는다. 두 사람 사이에 놓인 침묵은 판결이 아니라, 아직 이름 붙이지 못한 감정처럼 조용히 흔들렸다. 대답이 늦어질수록 불안은 커졌지만, 그 불안을 상대에게 던지지 않는 것이 이번 장면의 첫 번째 약속이었다.`,
      dialogue: "대답을 기다릴게. 대신 내가 네 마음을 마음대로 정하지는 않을게.",
      visual_prompt: `quiet Korean breakup fiction scene, two people apart, ${input.partnerBehavior}, restrained emotion`,
      emotion: "불안하지만 안전한 거리감을 만드는 장면"
    },
    {
      scene_no: 3,
      scene_title: "그때의 다른 선택",
      setting: `${input.breakupReason}라는 말이 다시 꺼내진 자리`,
      body: `${subject(input.protagonistAlias)} 숨을 고르고 그날 하지 못한 선택을 꺼냈다. "${input.alternativeChoice}" 그 말은 관계를 되돌리는 주문이 아니었다. 스스로를 더 다치게 두지 않기 위해, 그리고 상대를 붙잡지 않으면서도 자기 진심을 버리지 않기 위해 꺼낸 문장이었다.`,
      dialogue: input.alternativeChoice,
      visual_prompt: `paper-like romance fiction card, emotional confession, ${input.breakupReason}, cinematic Korean novel preview`,
      emotion: "후회가 진심으로 바뀌는 장면"
    },
    {
      scene_no: 4,
      scene_title: "대답보다 먼저 온 흔들림",
      setting: `${input.lastScenePlace}에 남은 둘 사이의 빈자리`,
      body: `${subject(
        input.partnerAlias
      )} 바로 대답하지 않았다. 그 침묵 때문에 ${subject(
        input.protagonistAlias
      )} 심장이 먼저 급해졌지만, 이번에는 그 급함을 말로 밀어붙이지 않았다. 두 사람의 거리는 그대로였고, 바뀐 것은 단 하나였다. ${subject(
        input.protagonistAlias
      )} 더 이상 상대의 마음을 대신 결론 내리지 않기로 한 것. 그래서 평범한 몇 초가 이별보다 더 긴장되는 장면이 되었다.`,
      dialogue: "괜찮아. 지금 바로 답하지 않아도 돼.",
      visual_prompt: `Korean realistic romance tension, quiet pause, ${input.lastScenePlace}, two people keeping safe distance`,
      emotion: "말하지 않는 몇 초가 길어지는 장면"
    },
    {
      scene_no: 5,
      scene_title: "끝나지 않은 첫 페이지",
      setting: `${input.lastScenePlace}에서 조금 멀어진 다음 순간`,
      body: `두 사람은 아직 아무 결말도 고르지 않았다. 다만 ${subject(
        input.protagonistAlias
      )} 더 이상 혼자서 모든 답을 만들어내지 않기로 했다. ${also(
        input.partnerAlias
      )} 쉽게 다가오거나 떠나지 않았다. 그래서 이 장면은 재회도 이별도 아닌, 마음을 다치게 하지 않는 방식으로 다시 쓰인 첫 페이지가 되었다. 마지막 문장은 아직 오지 않았다. 대신 다음 페이지를 넘기게 만드는 아주 작은 숨소리만 남았다.`,
      dialogue: "우리가 어떻게 끝나든, 이번에는 나를 잃어버리지는 않을래.",
      visual_prompt: `Korean illustrated storybook page, quiet after-rain mood, ${input.lastScenePlace}, hopeful but safe ending hook`,
      emotion: "다음 화를 궁금하게 만드는 잔잔한 긴장"
    }
  ];
}

export function generateMockPreview(input: StoryInput): PreviewStory {
  if (getStoryLanguage(input) === "en") {
    return generateEnglishMockPreview(input);
  }

  const scenes = buildScenes(input);
  const rememberedDetail = rememberedDetailPhrases(input);
  const language = getStoryLanguage(input);
  const nextChoices = getInitialStoryChoices(language);
  const title =
    input.desiredEnding === "parallel_world"
      ? "우리가 헤어지지 않았던 밤"
      : `${input.protagonistAlias}의 다른 마지막`;

  return {
    title,
    genre: endingLabel[input.desiredEnding],
    emotional_tone: emotionTone[input.emotion],
    summary: `그때 딱 한 문장만 다르게 말했더라면 어땠을지, ${input.breakupMoment}에서 ${subject(
      input.protagonistAlias
    )} 다시 바라본다. ${input.lastScenePlace}에 남아 있던 ${rememberedDetail.asTopic} ${input.breakupReason}로 멀어진 마음을 안전한 픽션 안에서 다시 읽고, 아직 마음속에서 끝나지 않은 장면을 붙잡는다.`,
    chapters: [
      {
        chapter_no: 1,
        chapter_title: "다시 열린 장면",
        body: buildPreviewChapterBody(input, scenes),
        ending_hook: `갑자기 오래 멈춰 있던 마지막 문자가 '읽음'으로 바뀌었다. 심장이 내려앉는 순간 화면 위에 작은 글씨가 나타났다 사라지기를 반복했다. [${input.partnerAlias} 님이 메시지를 입력 중입니다...] 빗소리 사이에서 ${subject(
          input.protagonistAlias
        )} 굳어버린 손가락을 어느 이야기의 방향 위에 올려야 할지 선택해야 했다.`,
        next_choices: nextChoices
      }
    ],
    scenes,
    next_choices: nextChoices,
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
  if (getStoryLanguage(input) === "en") {
    return buildEnglishPaidArc(input, selectedChoice);
  }

  if (selectedChoice.choice_id === "A") {
    return buildMisunderstandingArc(input);
  }

  if (selectedChoice.choice_id === "B") {
    return buildLastDayArc(input);
  }

  return buildLetterArc(input);
}

type PaidArc = "misunderstanding" | "last_day" | "letter";

function buildEnglishPaidBody(input: StoryInput, arcName: string, opening: string) {
  return buildEnglishLongBody(
    opening,
    [
      () =>
        `The first paid scene pays off the clue immediately: the read receipt was not a command to contact anyone, but a fictional sign that ${input.protagonistAlias}'s memory had left one fact unopened.`,
      () =>
        `${input.rememberedDetail} returns with a new function. It no longer decorates the breakup; it proves how ordinary details can hold the part of the truth both people avoided.`,
      () =>
        `${input.partnerAlias}'s habit, ${input.partnerBehavior}, is not treated as a mind to be guessed. The story only follows what ${input.protagonistAlias} saw, heard, and finally admitted.`,
      () =>
        `"${input.alternativeChoice}" becomes the sentence that changes the branch. In the ${arcName} route, it does not magically repair the relationship; it reveals what the relationship was asking them to face.`,
      () =>
        `A quiet reversal arrives in the middle of the chapter. The painful part was not only losing love, but realizing how much of the ending had been built from unfinished assumptions.`,
      () =>
        `By the end of the chapter, the purchase has given the reader one concrete answer and one sharper question. The story feels larger because the first clue now has consequences.`
    ],
    LONG_FORM_TARGETS.paidChapter.minChars + 420
  );
}

function buildEnglishPaidArc(input: StoryInput, selectedChoice: NextChoice): StoryChapter[] {
  const branch =
    selectedChoice.choice_id === "B"
      ? "last day"
      : selectedChoice.choice_id === "C"
        ? "unsent letter"
        : "misunderstanding";
  const choices = {
    A: getChapterChoices("A", 2, "en"),
    B: getChapterChoices("B", 2, "en"),
    C: getChapterChoices("C", 2, "en")
  };

  return [
    {
      chapter_no: 2,
      chapter_title:
        selectedChoice.choice_id === "A"
          ? "What the Read Receipt Changed"
          : selectedChoice.choice_id === "B"
            ? "A Borrowed Final Day"
            : "The Letter That Stays Unsent",
      body: buildEnglishPaidBody(
        input,
        branch,
        `Chapter 2 opens where the free preview stopped: [${input.partnerAlias} is typing...] flickers once, then disappears. ${input.protagonistAlias} does not chase the signal. Instead, the story follows the chosen ${branch} route and turns the clue into a scene, an object, and a fact.`
      ),
      ending_hook:
        selectedChoice.choice_id === "A"
          ? "The truth was not that one person cared more. It was that both had been reading the wrong silence."
          : selectedChoice.choice_id === "B"
            ? "Before the day ended, kindness became more dangerous than anger."
            : "The sentence that mattered most looked safer once it was addressed to no one.",
      next_choices: choices[selectedChoice.choice_id]
    },
    {
      chapter_no: 3,
      chapter_title: "The Missing Middle",
      body: buildEnglishPaidBody(
        input,
        branch,
        `${input.breakupMoment} returns in fragments. ${input.protagonistAlias} stops trying to win the memory and starts noticing what each fragment was protecting.`
      ),
      ending_hook:
        "The most painful evidence was not a confession, but the ordinary thing both of them remembered differently.",
      next_choices: getChapterChoices(selectedChoice.choice_id, 3, "en")
    },
    {
      chapter_no: 4,
      chapter_title: "The Cost of a Different Choice",
      body: buildEnglishPaidBody(
        input,
        branch,
        `The chosen route begins to cost something. It asks ${input.protagonistAlias} to give up the simpler version of the breakup and carry a truer one instead.`
      ),
      ending_hook:
        "For the first time, the ending did not ask to be pretty. It asked to be accurate.",
      next_choices: getChapterChoices(selectedChoice.choice_id, 4, "en")
    },
    {
      chapter_no: 5,
      chapter_title: "A Memory That Can Be Carried",
      body: buildEnglishPaidBody(
        input,
        branch,
        `The final chapter does not promise a perfect reunion or a clean erasure. It lets ${input.protagonistAlias} keep what was real without turning the pain into a life sentence.`
      ),
      ending_hook:
        "Some endings do not give love back. They give the person who loved a gentler way to remember."
    }
  ];
}

function paidBeats(input: StoryInput, arc: PaidArc): BeatFactory[] {
  const rememberedDetail = rememberedDetailPhrases(input);

  if (arc === "misunderstanding") {
    return [
      (round) =>
        `${round === 1 ? "처음으로" : "다시"} 두 사람은 오해를 감정이 아니라 사실의 순서로 바라보려고 했다. ${input.lastScenePlace}에서 실제로 들었던 말, 듣지 못했지만 들었다고 믿었던 말, 그리고 서로가 끝내 확인하지 않은 표정을 나누어 적었다. ${subject(
          input.protagonistAlias
        )} 마음속에서 이미 판결을 내려버린 장면마다 작은 표시를 했다. 그 표시가 늘어날수록, 이별은 한 사람의 잘못이 아니라 여러 번의 침묵이 겹친 결과처럼 보였다.`,
      () =>
        `${subject(input.partnerAlias)} 늘 ${behaviorPredicate(
          input.partnerBehavior
        )}. 그 사실은 변하지 않았다. 하지만 이번 장에서는 그 행동을 곧바로 차가움이나 포기로 번역하지 않았다. ${subject(
          input.protagonistAlias
        )} 상대의 행동을 해석하고 싶은 충동을 멈추고, 대신 자신이 그때 무엇을 느꼈는지 적었다. 감정은 사실이 아니지만, 감정을 느낀 일 자체는 분명한 사실이었다.`,
      () =>
        `${rememberedDetail.asTopic} 오해를 풀어내는 동안 계속 장면 한가운데에 있었다. 너무 사소해서 말하지 않았던 디테일이 오히려 가장 오래 남아 있었다. ${subject(
          input.protagonistAlias
        )} 그 디테일을 붙잡고 상대를 다시 판단하려다 멈췄다. 이번 이야기의 규칙은 분명했다. 알 수 없는 마음은 알 수 없는 채로 두고, 내가 놓친 말만 다시 바라보는 것.`,
      () =>
        `"${input.alternativeChoice}"라는 문장은 사과와 변명 사이에서 오래 흔들렸다. ${subject(
          input.protagonistAlias
        )} 그 말을 꺼내면 모든 것이 풀릴 거라고 기대하지 않았다. 다만 그 말을 하지 않았기 때문에 생긴 오해와, 그 말을 했어도 남았을 상처를 구분하고 싶었다. 두 사람은 그 차이를 구분하는 동안 조금씩 조용해졌다.`,
      () =>
        `긴장감은 풀린 오해보다 아직 남은 사실에서 더 크게 올라왔다. 사과를 받았다고 해서 모든 장면이 미화되지는 않았고, 잘못 들은 말을 바로잡았다고 해서 상처가 사라지지도 않았다. 그래서 이 장은 더 현실적이었다. 두 사람은 서로를 완전히 이해하지 못한 채로도, 적어도 더 나쁘게 오해하지 않는 법을 배워야 했다.`,
      () =>
        `밤이 깊어질수록 ${input.breakupReason}라는 말은 처음보다 덜 날카로워졌다. 그렇다고 부드러워진 것은 아니었다. 다만 그 말 주변에 있던 겁, 자존심, 피로, 그리고 먼저 무너지고 싶지 않았던 마음들이 천천히 드러났다. ${subject(
          input.protagonistAlias
        )} 그 모든 것을 하나의 결론으로 묶지 않고, 각각의 장면으로 남겨두었다.`
    ];
  }

  if (arc === "last_day") {
    return [
      (round) =>
        `${round === 1 ? "그 하루는" : "다음 장면도"} 특별한 사건보다 평범한 동선으로 오래 이어졌다. 두 사람은 ${input.lastScenePlace}에서 출발해 사람이 많은 길과 조용한 골목을 천천히 지나갔다. 같이 걷는다는 사실은 다정했지만, 동시에 위험할 만큼 익숙했다. ${subject(
          input.protagonistAlias
        )} 그 익숙함을 재회의 신호로 오해하지 않으려고 계속 속도를 늦췄다.`,
      () =>
        `${rememberedDetail.asTopic} 하루 내내 예상치 못한 순간마다 떠올랐다. 편의점 유리문에 비친 모습, 잠깐 멈춘 횡단보도, 식어가는 음료 앞에서 그 디테일은 계속 다른 표정으로 돌아왔다. ${subject(
          input.protagonistAlias
        )} 그것을 붙잡고 싶었지만, 붙잡는 대신 기억하는 쪽을 택했다. 오늘은 소유가 아니라 정리의 하루였기 때문이다.`,
      () =>
        `${subject(input.partnerAlias)} 늘 ${behaviorPredicate(
          input.partnerBehavior
        )}. 같이 걷는 동안에도 그 습관은 여러 번 나타났다. 예전 같으면 ${subject(
          input.protagonistAlias
        )} 그 순간마다 마음이 급해졌겠지만, 오늘은 그 급함을 조금 늦게 꺼냈다. 상대를 재촉하지 않는 침묵이, 이상하게도 두 사람 사이의 마지막 예의처럼 느껴졌다.`,
      () =>
        `마지막 하루의 긴장은 '다시 시작할까'라는 말에서 오지 않았다. 오히려 그 말을 하지 않기로 했기 때문에 더 선명해졌다. 두 사람은 카페의 작은 테이블에 앉아 서로의 컵을 바라봤고, 식어가는 표면 위로 말하지 않은 문장들이 지나갔다. 다정함은 남아 있었지만, 그 다정함을 결론으로 착각하지 않는 일이 오늘의 가장 어려운 장면이었다.`,
      () =>
        `"${input.alternativeChoice}" ${subject(
          input.protagonistAlias
        )} 그 말을 하루 중 가장 조용한 순간에 꺼냈다. 대답을 요구하지 않으려고 일부러 시선을 낮췄고, 말끝을 붙잡지 않으려고 손을 내려놓았다. 그 문장은 관계를 되돌리는 열쇠가 아니라, 마지막 하루를 거짓말로 끝내지 않기 위한 작은 불빛이었다.`,
      () =>
        `해가 기울수록 하루는 점점 현실적인 무게를 얻었다. 같이 웃은 순간도 있었고, 어색해서 시계를 확인한 순간도 있었다. 둘 중 어느 하나만 진짜라고 할 수 없었다. ${subject(
          input.protagonistAlias
        )} 그 복잡함을 받아들이며 걸었다. 마지막 하루가 아름답기만 하다면 거짓말 같았을 텐데, 오늘은 다정하고 불편해서 더 진짜 같았다.`
    ];
  }

  return [
    (round) =>
      `${round === 1 ? "첫 번째 편지는" : "다음 편지도"} 보내기 위해 쓰는 글이 아니었다. ${subject(
        input.protagonistAlias
      )} 종이를 펴고 ${input.lastScenePlace}의 공기를 먼저 적었다. 그다음 ${rememberedDetail.asObject} 떠올렸다. 편지는 상대를 움직이기 위한 문장이 아니라, 계속 흩어지던 마음을 한곳에 앉히기 위한 장면이었다.`,
    () =>
      `봉투는 쉽게 닫히지 않았다. 쓰고 싶은 말은 많았지만, 보내면 안 되는 말과 남겨도 되는 말을 구분하는 일이 필요했다. ${subject(
        input.protagonistAlias
      )} 상대의 마음을 단정하는 문장을 지우고, 자신이 느낀 외로움만 남겼다. 그 차이를 지키는 일이 이 이야기의 안전한 긴장이었다.`,
    () =>
      `${subject(input.partnerAlias)} 늘 ${behaviorPredicate(
        input.partnerBehavior
      )}는 기억도 편지 안으로 들어왔다. 하지만 편지 속 ${subject(
        input.protagonistAlias
      )} 그 행동을 설명하려 들지 않았다. 대신 그 행동을 보며 자신이 얼마나 작아졌는지, 어떤 말을 삼켰는지, 왜 그 순간 화내는 척을 했는지 적었다. 이상하게도 그 편이 훨씬 리얼했다.`,
    () =>
      `"${input.alternativeChoice}"라는 문장은 여러 번 쓰였다가 지워졌다. 너무 늦은 말 같기도 했고, 너무 정확한 말 같기도 했다. ${subject(
        input.protagonistAlias
      )} 결국 그 문장을 편지의 중간에 남겼다. 시작도 끝도 아닌 자리에 두자, 그 말은 상대에게 닿기보다 자기 자신에게 먼저 닿았다.`,
    () =>
      `책상 위에는 봉투가 하나 더 놓였다. 받는 사람의 이름을 쓰지 않은 봉투였다. 그 빈칸 때문에 이야기는 더 긴장됐다. 보내지 않는다고 해서 마음이 사라지는 것은 아니었고, 보낸다고 해서 마음이 안전해지는 것도 아니었다. ${subject(
        input.protagonistAlias
      )} 그 사이에서 처음으로 성급한 결론을 미뤘다.`,
    () =>
      `밤이 깊어질수록 편지는 고백보다 기록에 가까워졌다. ${input.breakupMoment}, ${input.breakupReason}, 그리고 말하지 못한 선택들이 한 줄씩 자리를 잡았다. 어느 문장도 두 사람을 다시 묶지는 않았다. 대신 ${subject(
        input.protagonistAlias
      )} 자기 마음을 거칠게 밀어내지 않는 방법을 조금 배웠다.`
  ];
}

function expandPaidBody(input: StoryInput, arc: PaidArc, opening: string) {
  return buildLongBody(
    opening,
    paidBeats(input, arc),
    LONG_FORM_TARGETS.paidChapter.minChars + 420
  );
}

function buildMisunderstandingArc(input: StoryInput): StoryChapter[] {
  const rememberedDetail = rememberedDetailPhrases(input);
  const language = getStoryLanguage(input);

  return [
    {
      chapter_no: 2,
      chapter_title: "엇갈린 사실들",
      body: expandPaidBody(input, "misunderstanding", `${subject(input.protagonistAlias)} 내가 오해한 건 상대가 아니라, 내 상처였다. 그 사실을 깨닫는 순간 2화는 변명 대신 장면으로 시작했다. ${input.lastScenePlace}에서 ${rememberedDetail.asObject} 보고도 아무렇지 않은 척했던 이유, 손에 쥔 휴대폰의 보내다 만 문장, 그리고 ${input.breakupReason}라는 말 뒤에 숨겼던 겁이 한꺼번에 떠올랐다.\n\n${subject(
        input.partnerAlias
      )} 늘 ${behaviorFact(
        input.partnerBehavior
      )}도 이번에는 단정하지 않았다. 두 사람은 서로의 마음을 맞히려 하지 않고, 실제로 있었던 말과 없었던 말, 보내지 못한 메시지와 너무 빨리 결론 낸 표정을 종이에 나누어 적었다.`),
      ending_hook:
        "기다린 건 답장이 아니라, 내가 틀리지 않았다는 증거였다. 그걸 인정하자 오해보다 더 오래된 미련이 모습을 드러냈다.",
      next_choices: getChapterChoices("A", 2, language)
    },
    {
      chapter_no: 3,
      chapter_title: "그날의 빈칸",
      body: expandPaidBody(input, "misunderstanding", `두 사람은 ${input.breakupMoment}을 다시 꺼냈다. ${subject(
        input.protagonistAlias
      )} 기억하는 장면과 ${subject(
        input.partnerAlias
      )} 기억하는 장면은 조금씩 달랐다. 그래서 이번에는 누가 맞는지 겨루지 않았다. 빈칸이 생긴 곳마다 '그때 나는 이렇게 느꼈어'라고만 적었다.\n\n오해는 한순간에 사라지지 않았다. 대신 모양을 드러냈다. 모양을 알게 된 상처는 전보다 덜 무서웠다.`,
      ),
      ending_hook: `${subject(
        input.partnerAlias
      )} 접힌 메모 한 장을 밀어 놓으며 말했다. "이건 그날 네가 못 들은 내 말이야."`,
      next_choices: getChapterChoices("A", 3, language)
    },
    {
      chapter_no: 4,
      chapter_title: "사과의 순서",
      body: expandPaidBody(input, "misunderstanding", `사과는 한 사람이 모두 지는 일이 아니었다. ${subject(
        input.protagonistAlias
      )} 먼저 자기 몫의 오해를 인정했고, ${subject(
        input.partnerAlias
      )} 침묵으로 상대를 혼자 두었던 시간을 인정했다.\n\n두 사람은 재회를 약속하지 않았다. 다만 서로를 나쁜 사람으로 남겨두지 않기로 했다. 그 결정만으로도 ${input.lastScenePlace}의 기억은 조금 다른 색을 얻었다.`,
      ),
      ending_hook:
        "그날 처음으로 두 사람은 같은 문장을 적었다. '우리는 끝났어도, 전부 오해였던 건 아니야.'",
      next_choices: getChapterChoices("A", 4, language)
    },
    {
      chapter_no: 5,
      chapter_title: "정확하게 기억하는 일",
      body: expandPaidBody(input, "misunderstanding", `완결의 밤, ${subject(
        input.protagonistAlias
      )} 이 이야기가 과거를 다시 쓰는 방법이 아니라는 것을 알았다. 하지만 적어도 이제는 ${object(
        input.partnerAlias
      )} 원망 하나로만 기억하지 않아도 되었다.\n\n풀린 오해와 남은 사실은 서로 달랐다. 두 사람은 그 차이를 배웠고, 그래서 마지막 인사는 더 조용하고 정확했다. 사랑이 전부 돌아오지 않아도 마음은 조금 더 바르게 놓일 수 있었다.`,
      ),
      ending_hook: `${subject(
        input.protagonistAlias
      )} 마지막 페이지에 적었다. "나는 이제 우리가 왜 아팠는지 안다."`
    }
  ];
}

function buildLastDayArc(input: StoryInput): StoryChapter[] {
  const rememberedDetail = rememberedDetailPhrases(input);
  const language = getStoryLanguage(input);

  return [
    {
      chapter_no: 2,
      chapter_title: "빌린 하루",
      body: expandPaidBody(input, "last_day", `${subject(input.protagonistAlias)} 마지막 하루를 함께 보내는 방향을 골랐다. 되돌아가기 위한 하루가 아니라, 마음속에서 끝나지 못한 장면을 안전하게 닫기 위한 하루였다.\n\n두 사람은 ${input.lastScenePlace}에서 다시 만났다. ${rememberedDetail.asTopic} 여전히 선명했지만, 이번에는 그 디테일을 핑계로 붙잡지 않았다. 그냥 같이 걸었다. 말이 끊기면 끊긴 채로 두었다.`),
      ending_hook:
        "하루가 끝나기 전까지, 두 사람은 어떤 결론도 먼저 말하지 않기로 했다.",
      next_choices: getChapterChoices("B", 2, language)
    },
    {
      chapter_no: 3,
      chapter_title: "같이 걷는 침묵",
      body: expandPaidBody(input, "last_day", `${subject(input.partnerAlias)} 늘 ${behaviorPredicate(
        input.partnerBehavior
      )}. 예전 같으면 ${subject(
        input.protagonistAlias
      )} 그 침묵을 견디지 못했겠지만, 오늘은 같이 걷는 소리만으로도 충분했다.\n\n카페, 횡단보도, 잠깐 멈춘 골목. 마지막 하루는 특별한 사건보다 평범한 동선으로 채워졌다. 그래서 더 진짜 같았다.`,
      ),
      ending_hook:
        "해가 기울자, 두 사람은 처음으로 '오늘이 마지막이라면'이라는 말을 입 밖에 냈다.",
      next_choices: getChapterChoices("B", 3, language)
    },
    {
      chapter_no: 4,
      chapter_title: "돌려주는 것들",
      body: expandPaidBody(input, "last_day", `마지막 하루에는 돌려줄 것이 많았다. 빌려 간 책, 저장해둔 사진, 미처 고맙다고 하지 못한 말, 그리고 서로에게 맡겨 둔 기대까지.\n\n${subject(
        input.protagonistAlias
      )} ${input.alternativeChoice}라는 마음을 조심스럽게 꺼냈고, ${subject(
        input.partnerAlias
      )}도 쉽게 답하지 않았다. 대신 그 말을 오래 들었다. 오늘의 약속은 답을 얻는 것이 아니라, 끝까지 함께 있어 주는 것이었다.`,
      ),
      ending_hook:
        "마지막 버스가 도착했을 때, 두 사람은 이 하루가 생각보다 다정했다는 사실을 인정했다.",
      next_choices: getChapterChoices("B", 4, language)
    },
    {
      chapter_no: 5,
      chapter_title: "하루가 끝나는 방식",
      body: expandPaidBody(input, "last_day", `완결의 밤, 같이 보낸 마지막 하루는 두 사람을 처음으로 돌려놓지 않았다. 대신 각자가 어디로 걸어가야 하는지 조금 더 분명하게 보여주었다.\n\n${subject(
        input.protagonistAlias
      )} 더는 끝을 실패라고 부르지 않았다. ${subject(
        input.partnerAlias
      )}도 오늘의 다정함을 다시 시작하자는 신호로 몰아가지 않았다. 하루는 하루로 남았고, 그래서 온전했다.`,
      ),
      ending_hook:
        "헤어지는 길목에서 두 사람은 약속 대신 인사를 남겼다. '오늘은 정말 고마웠어.'"
    }
  ];
}

function buildLetterArc(input: StoryInput): StoryChapter[] {
  const rememberedDetail = rememberedDetailPhrases(input);
  const language = getStoryLanguage(input);

  return [
    {
      chapter_no: 2,
      chapter_title: "보내지 않는 편지",
      body: expandPaidBody(input, "letter", `${subject(input.protagonistAlias)} 각자의 진심을 편지로 남기는 방향을 골랐다. 실제로 보내기 위한 편지가 아니라, 마음속에서 계속 반복되던 말을 한곳에 내려놓기 위한 편지였다.\n\n첫 문장은 ${input.lastScenePlace}에서 시작됐다. ${rememberedDetail.asObject} 떠올리자 종이 위에 그날의 공기가 천천히 번졌다.`),
      ending_hook: `봉투를 고르는 순간, ${subject(
        input.protagonistAlias
      )} 이 편지가 상대를 움직이기 위한 것이 아니라 자신을 살피기 위한 것임을 알았다.`,
      next_choices: getChapterChoices("C", 2, language)
    },
    {
      chapter_no: 3,
      chapter_title: "봉투 안의 진심",
      body: expandPaidBody(input, "letter", `편지에는 변명보다 장면이 먼저 들어갔다. ${input.breakupMoment}, ${input.breakupReason}, 그리고 ${input.alternativeChoice}라고 말하고 싶었던 마음까지.\n\n${subject(
        input.partnerAlias
      )} 늘 ${behaviorPredicate(
        input.partnerBehavior
      )}는 기억도 편지 안에서는 조금 다르게 놓였다. 상대의 마음을 단정하지 않고, 내가 느낀 외로움만 정확하게 적었다.`,
      ),
      ending_hook: `마지막 줄을 남겨둔 채, ${subject(
        input.protagonistAlias
      )} 처음으로 편지를 접지 않고 밤을 보냈다.`,
      next_choices: getChapterChoices("C", 3, language)
    },
    {
      chapter_no: 4,
      chapter_title: "답장이 없어도 되는 밤",
      body: expandPaidBody(input, "letter", `다음 날의 이야기는 답장에서 시작되지 않았다. 답장이 없어도 되는 밤, ${subject(
        input.protagonistAlias
      )} 자기 문장을 다시 읽었다.\n\n그 편지는 누군가를 다시 데려오는 길이 아니라, 흩어진 마음을 한 장씩 묶는 일이었다. 봉투는 닫혔지만 마음은 조금 열렸다. 이상하게도 그게 더 현실적인 위로였다.`,
      ),
      ending_hook:
        "책상 위에 놓인 두 번째 봉투에는 받는 사람 이름 대신 짧은 문장 하나가 적혔다. '이제 나에게.'",
      next_choices: getChapterChoices("C", 4, language)
    },
    {
      chapter_no: 5,
      chapter_title: "나에게 도착한 문장",
      body: expandPaidBody(input, "letter", `완결의 밤, ${subject(
        input.protagonistAlias
      )} 마지막 편지를 자기 앞으로 남겼다. 그 안에는 원망도 그리움도 있었지만, 가장 긴 문장은 자신을 탓하지 않겠다는 약속이었다.\n\n${object(
        input.partnerAlias
      )} 떠올리는 일은 여전히 쉽지 않았다. 그래도 편지 속에서 두 사람은 더 이상 서로를 끌어당기지 않았다. 각자의 자리에서, 각자의 문장으로 끝을 배웠다.`,
      ),
      ending_hook: `봉투를 닫으며 ${subject(
        input.protagonistAlias
      )} 알았다. 어떤 마음은 보내지 않아도 도착할 수 있다는 것을.`
    },
  ];
}
