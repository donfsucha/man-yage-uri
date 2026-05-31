import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentActions } from "./payment-actions";
import { getRuntimeConfig } from "@/lib/config/runtime";
import { getChoicePurchaseHint } from "@/lib/story/choice-hints";
import { getStory } from "@/lib/story/persistence";

export const dynamic = "force-dynamic";

type CheckoutLocale = "ko" | "en";

type CheckoutPageProps = {
  params: Promise<{
    storyId: string;
  }>;
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

const CHECKOUT_COPY = {
  ko: {
    chooseTitle: "다음 전개를 먼저 선택해 주세요",
    chooseBody:
      "5화 완결을 준비하려면 1화 미리보기에서 이어질 방향을 선택해야 합니다.",
    chooseCta: "선택하러 돌아가기",
    eyebrow: "5화 완결 상품",
    title: "이 선택으로 두 사람의 결말을 끝까지 열어볼까요?",
    body:
      "선택한 전개를 바탕으로 2화부터 5화까지 이어지는 완결 이야기를 생성합니다. 같은 이별도 어떤 단서를 따라가느냐에 따라 완전히 다른 결말이 됩니다.",
    product: "작품",
    selectedChoice: "선택한 다음 전개",
    paidHook: "결제 후 바로 열리는 단서",
    consequence: "이 선택이 바꾸는 것",
    completePack: "5화 완결본",
    paymentNote:
      "결제가 승인되면 서버가 주문의 스토리 ID, 금액, 통화를 확인한 뒤 선택한 전개에 맞춘 완결 회차를 엽니다.",
    valueNote:
      "약 45~55 모바일 페이지 분량으로, 1화의 단서가 2화 첫 장면에서 바로 이어지고 마지막 장면까지 회수됩니다.",
    modePrefix: "현재 Toss 결제는",
    mockPayment: "모의 결제",
    realPayment: "실제 결제",
    paypalPrefix: "PayPal은",
    modeSuffix: "모드입니다.",
    back: "1화 다시 보기",
    languageLabel: "English checkout"
  },
  en: {
    chooseTitle: "Choose a story direction first",
    chooseBody:
      "To prepare the complete five-chapter story, choose the next direction from the chapter 1 preview.",
    chooseCta: "Back to preview",
    eyebrow: "Complete story pack",
    title: "Unlock the ending shaped by your choice",
    body:
      "Your selected branch becomes a complete five-chapter fictional story. The same breakup changes depending on which clue you decide to follow.",
    product: "Story",
    selectedChoice: "Selected direction",
    paidHook: "First paid-story clue",
    consequence: "What this choice changes",
    completePack: "Complete story",
    paymentNote:
      "After payment approval, the server verifies the order story ID, amount, and currency before unlocking the completed chapters.",
    valueNote:
      "The full story targets roughly 45 to 55 mobile pages, with the chapter 1 clue paid off immediately in chapter 2 and carried through the ending.",
    modePrefix: "Toss Payments is in",
    mockPayment: "mock payment",
    realPayment: "real payment",
    paypalPrefix: "PayPal is in",
    modeSuffix: "mode.",
    back: "Back to chapter 1",
    languageLabel: "한국어 결제 화면"
  }
} satisfies Record<CheckoutLocale, Record<string, string>>;

function getCheckoutLocale(
  lang: string | string[] | undefined,
  storyLanguage?: string
): CheckoutLocale {
  const value = Array.isArray(lang) ? lang[0] : lang;

  if (value === "en" || storyLanguage === "en") {
    return "en";
  }

  return "ko";
}

export default async function CheckoutPage({
  params,
  searchParams
}: CheckoutPageProps) {
  const { storyId } = await params;
  const query = searchParams ? await searchParams : {};
  const stored = await getStory(storyId);

  if (!stored) {
    notFound();
  }

  const locale = getCheckoutLocale(query.lang, stored.input?.outputLanguage);
  const copy = CHECKOUT_COPY[locale];
  const otherLocale = locale === "en" ? "ko" : "en";
  const languageHref = `/checkout/${storyId}?lang=${otherLocale}`;
  const previewHref =
    locale === "en"
      ? `/stories/${storyId}/preview?lang=en`
      : `/stories/${storyId}/preview`;
  const config = getRuntimeConfig();
  const selectedChoice = stored.story.next_choices.find(
    (choice) => choice.choice_id === stored.selectedChoiceId
  );
  const priceLabel = config.mockPayPal
    ? locale === "en"
      ? "KRW 7,900"
      : "7,900원"
    : `${config.paypalCurrency} ${config.paypalAmount}`;

  if (!selectedChoice) {
    return (
      <main className="page-shell">
        <section className="mobile-frame grid gap-5 pt-6">
          <div className="flex justify-end">
            <Link className="text-sm font-bold text-[color:var(--accent)]" href={languageHref}>
              {copy.languageLabel}
            </Link>
          </div>
          <h1 className="text-3xl font-black leading-tight">{copy.chooseTitle}</h1>
          <p className="leading-7 text-[color:var(--muted)]">{copy.chooseBody}</p>
          <Link className="button-primary w-full" href={previewHref}>
            {copy.chooseCta}
          </Link>
        </section>
      </main>
    );
  }

  const choiceHint = getChoicePurchaseHint(selectedChoice, locale);

  return (
    <main className="page-shell">
      <section className="mobile-frame grid gap-6 pt-4">
        <div className="flex justify-end">
          <Link className="text-sm font-bold text-[color:var(--accent)]" href={languageHref}>
            {copy.languageLabel}
          </Link>
        </div>

        <header className="grid gap-2">
          <p className="text-sm font-bold text-[color:var(--accent)]">{copy.eyebrow}</p>
          <h1 className="text-3xl font-black leading-tight">{copy.title}</h1>
          <p className="leading-7 text-[color:var(--muted)]">{copy.body}</p>
        </header>

        <section className="panel grid gap-4 p-5">
          <div className="grid gap-1">
            <p className="text-sm font-bold text-[color:var(--muted)]">
              {copy.product}
            </p>
            <h2 className="text-2xl font-black">{stored.story.title}</h2>
          </div>

          <div className="rounded-lg bg-[color:var(--surface-strong)] p-4">
            <p className="text-sm font-bold text-[color:var(--accent)]">
              {copy.selectedChoice}
            </p>
            <p className="mt-1 font-bold">
              {selectedChoice.choice_id}. {selectedChoice.label}
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-[color:var(--border)] bg-white p-4">
            <div>
              <p className="text-sm font-bold text-[color:var(--accent)]">
                {copy.paidHook}
              </p>
              <p className="mt-1 font-bold leading-7">{choiceHint.teaser}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[color:var(--muted)]">
                {copy.consequence}
              </p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                {choiceHint.consequence}
              </p>
            </div>
          </div>

          <div className="grid gap-2 border-t border-[color:var(--border)] pt-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold">{copy.completePack}</span>
              <span className="text-2xl font-black">{priceLabel}</span>
            </div>
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              {choiceHint.premiumPromise}
            </p>
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              {copy.valueNote}
            </p>
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              {copy.paymentNote}
            </p>
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              {copy.modePrefix} {config.mockToss ? copy.mockPayment : copy.realPayment}{" "}
              {copy.modeSuffix} {copy.paypalPrefix}{" "}
              {config.mockPayPal
                ? copy.mockPayment
                : `${config.paypalCurrency} ${config.paypalAmount} ${copy.realPayment}`}{" "}
              {copy.modeSuffix}
            </p>
          </div>
        </section>

        <PaymentActions
          locale={locale}
          mockPayPal={config.mockPayPal}
          paypalClientId={config.paypalClientId}
          paypalCurrency={config.paypalCurrency}
          storyId={storyId}
        />

        <Link className="button-secondary w-full" href={previewHref}>
          {copy.back}
        </Link>
      </section>
    </main>
  );
}
