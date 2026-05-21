import OpenAI from "openai";
import { getRuntimeConfig } from "@/lib/config/runtime";
import {
  shortsPackageSchema,
  type ShortsMakerInput,
  type ShortsPackage
} from "./schema";
import { getAllowedStatusPhrase, unsafeLaunchClaims } from "./status";
import { generateMockShortsPackage } from "./mock-shorts-generator";

export { getAllowedStatusPhrase } from "./status";

const audienceInstructions: Record<ShortsMakerInput["audience"], string> = {
  seniors_parents:
    "부모님과 시니어 성도가 앱 탐색 없이 말씀 루틴을 시작한다는 공감 포인트",
  church_teams:
    "교회 사역팀, 미디어팀, 목회자가 성도들의 반복 사용과 통독 훈련을 돕는 관점",
  ordinary_believers:
    "매일 성경통독을 다시 시작하고 싶은 평신도의 습관 형성 관점",
  gift_buyers: "부모님이나 가족에게 믿음의 루틴을 선물하는 관점"
};

const purposeInstructions: Record<ShortsMakerInput["purpose"], string> = {
  launch_notice: "출시 준비 소식을 알리고 관심 댓글이나 문의를 유도",
  product_explainer: "제품이 어떤 문제를 해결하는지 쉽게 설명",
  usage_guide: "폰을 거치대에 올리는 사용 장면 중심으로 안내",
  church_adoption: "교회 단체 도입과 사역 활용 가능성을 조심스럽게 제안",
  parent_empathy: "부모님이 스마트폰 앱을 찾기 어려워하는 장면에 공감"
};

const toneInstructions: Record<ShortsMakerInput["tone"], string> = {
  warm: "따뜻하고 배려 있게",
  trustworthy: "차분하고 신뢰감 있게",
  simple_friendly: "짧고 쉬운 말로 친근하게",
  church_proposal: "교회 제안서처럼 실용적이고 과장 없이"
};

function collectPromotionalText(pkg: ShortsPackage) {
  return [
    ...pkg.hooks,
    pkg.script,
    ...pkg.subtitles,
    ...pkg.storyboard.flatMap((scene) => [
      scene.scene,
      scene.visual,
      scene.narration,
      scene.onScreenText
    ]),
    ...pkg.shotList,
    ...pkg.titleOptions,
    pkg.caption,
    ...pkg.hashtags,
    ...pkg.ctaOptions,
    ...pkg.thumbnailTextOptions
  ].join("\n");
}

export function assertNoUnsafeLaunchClaims(
  pkg: ShortsPackage,
  input: ShortsMakerInput
) {
  const text = collectPromotionalText(pkg);

  if (input.productStatus !== "officially_launched") {
    const unsafeClaim = unsafeLaunchClaims.find((claim) =>
      text.includes(claim)
    );

    if (unsafeClaim) {
      throw new Error(`Unsafe launch claim generated: ${unsafeClaim}`);
    }
  }

  return text;
}

export function buildShortsPrompt(input: ShortsMakerInput) {
  const statusPhrase = getAllowedStatusPhrase(input);
  const banned =
    input.productStatus === "officially_launched"
      ? "공식 파트너십, 보장된 성과, 확인되지 않은 다운로드 수"
      : unsafeLaunchClaims.join(", ");

  return [
    "성경통독 거치대야 / XCAN PLAYER 숏폼 홍보 패키지를 한국어로 생성하세요.",
    "",
    "제품 포지셔닝:",
    "- 폰을 거치대에 올리는 순간, 성경통독 루틴이 시작됩니다.",
    "- 앱 설치보다 어려운 매일 실행과 습관 형성을 돕습니다.",
    "- 스마트폰 조작이 어려운 시니어 성도와 부모님에게 특히 쉽게 설명합니다.",
    "",
    `현재 사용할 수 있는 상태 표현: ${statusPhrase}`,
    `타깃: ${audienceInstructions[input.audience]}`,
    `목적: ${purposeInstructions[input.purpose]}`,
    `길이: ${input.length}`,
    `톤: ${toneInstructions[input.tone]}`,
    input.memo ? `추가 메모: ${input.memo}` : "",
    "",
    `금지 표현: ${banned}`,
    "확인되지 않은 파트너십, 보장된 효과, 플레이스토어 승인 여부를 과장하지 마세요.",
    "",
    "반드시 JSON만 반환하세요. 키는 hooks, script, subtitles, storyboard, shotList, titleOptions, caption, hashtags, ctaOptions, thumbnailTextOptions, reviewChecklist 입니다.",
    "storyboard 항목은 scene, visual, narration, onScreenText 키를 포함해야 합니다."
  ]
    .filter(Boolean)
    .join("\n");
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON object found in OpenAI response.");
    }

    return JSON.parse(match[0]);
  }
}

export async function generateShortsPackage(
  input: ShortsMakerInput,
  env: Record<string, string | undefined> = process.env
): Promise<{ package: ShortsPackage; warning?: string }> {
  const config = getRuntimeConfig(env);

  if (config.mockOpenAI || !config.openAiApiKey) {
    const pkg = generateMockShortsPackage(input);
    assertNoUnsafeLaunchClaims(pkg, input);
    return {
      package: pkg,
      warning: "MOCK_OPENAI 설정으로 샘플 문안을 생성했습니다."
    };
  }

  try {
    const client = new OpenAI({ apiKey: config.openAiApiKey });
    const response = await client.responses.create({
      model: config.openAiStoryModel,
      input: buildShortsPrompt(input),
      text: {
        format: {
          type: "json_object"
        }
      }
    });
    const raw = response.output_text;
    const parsed = shortsPackageSchema.parse(parseJsonObject(raw));

    assertNoUnsafeLaunchClaims(parsed, input);
    return { package: parsed };
  } catch {
    const pkg = generateMockShortsPackage(input);
    assertNoUnsafeLaunchClaims(pkg, input);
    return {
      package: pkg,
      warning:
        "AI 생성 결과를 검증하지 못해 안전한 샘플 문안으로 대체했습니다."
    };
  }
}
