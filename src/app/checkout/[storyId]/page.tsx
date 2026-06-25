import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentActions } from "./payment-actions";
import { EventTracker } from "@/components/event-tracker";
import { BONUS_OFFER_COPY } from "@/lib/bonus/offer";
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
      "5화 완결본을 준비하려면 1화 미리보기에서 이어질 방향을 선택해야 합니다.",
    chooseCta: "선택하러 돌아가기",
    eyebrow: "5화 완결 상품",
    title: "우리의 다른 결말을 끝까지 읽어볼까요?",
    body:
      "선택한 전개를 바탕으로 2화부터 5화까지 이어지는 완결 이야기를 생성합니다. 같은 이별도 어떤 단서를 따라가느냐에 따라 전혀 다른 결말이 됩니다.",
    product: "작품",
    selectedChoice: "선택한 다음 전개",
    paidHook: "결제 후 바로 이어지는 단서",
    consequence: "이 선택이 바꾸는 것",
    completePack: "5화 완결본",
    paymentNote:
      "결제가 승인되면 PayApp 통보를 서버에서 검증한 뒤 선택한 전개에 맞춘 완결편을 자동으로 열람 가능 상태로 저장합니다.",
    valueNote:
      "완결편은 약 45~55 모바일 페이지 분량을 목표로, 1화의 감정 단서가 2화 첫 장면부터 이어지고 마지막 장면까지 회수되도록 구성합니다.",
    providerPrefix: "국내 결제",
    payAppPrefix: "PayApp은",
    tossPrefix: "Toss 결제는",
    paypalPrefix: "PayPal은",
    mockPayment: "모의 결제",
    realPayment: "실제 결제",
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
      "After payment approval, the server verifies the PayApp notification before unlocking the completed chapters.",
    valueNote:
      "The full story targets roughly 45 to 55 mobile pages, with the chapter 1 clue paid off immediately in chapter 2 and carried through the ending.",
    providerPrefix: "Domestic checkout",
    payAppPrefix: "PayApp is in",
    tossPrefix: "Toss Payments is in",
    paypalPrefix: "PayPal is in",
    mockPayment: "mock payment",
    realPayment: "real payment",
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
  const bonusCopy = BONUS_OFFER_COPY[locale];
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
  const hasRealPayApp =
    !config.mockPayApp && (config.payAppApiEnabled || Boolean(config.payAppCheckoutUrl));
  const domesticPriceLabel = locale === "en" ? "KRW 7,900" : "7,900원";
  const priceLabel =
    hasRealPayApp || !config.mockToss
      ? domesticPriceLabel
      : `${config.paypalCurrency} ${config.paypalAmount}`;
  const domesticProviderPrefix = hasRealPayApp ? copy.payAppPrefix : copy.tossPrefix;
  const domesticProviderMode =
    hasRealPayApp || !config.mockToss ? copy.realPayment : copy.mockPayment;

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
      <EventTracker
        eventName="checkout_view"
        metadata={{ locale }}
        storyId={storyId}
      />
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

          <div className="grid gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
            <div>
              <p className="text-sm font-bold text-[color:var(--accent)]">
                {bonusCopy.curiosityTitle}
              </p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                {bonusCopy.curiosityBody}
              </p>
            </div>
            <ul className="grid gap-2">
              {bonusCopy.curiosityItems.map((item) => (
                <li
                  className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-bold"
                  key={item}
                >
                  <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 rounded-lg border border-[color:var(--border)] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[color:var(--accent)]">
                  {bonusCopy.bonusTitle}
                </p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                  {bonusCopy.bonusBody}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-bold text-[color:var(--accent)]">
                {bonusCopy.includedAfterPayment}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-[color:var(--surface-strong)] p-3">
                <p className="font-bold">{bonusCopy.guideTitle}</p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                  {bonusCopy.guideDescription}
                </p>
              </div>
              <div className="rounded-md bg-[color:var(--surface-strong)] p-3">
                <p className="font-bold">{bonusCopy.journalTitle}</p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                  {bonusCopy.journalDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--accent)] bg-white p-4">
            <p className="font-black text-[color:var(--accent)]">
              {bonusCopy.guaranteeTitle}
            </p>
            <p className="mt-1 text-sm font-bold leading-6">
              {bonusCopy.guaranteeBody}
            </p>
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
              {domesticProviderPrefix} {domesticProviderMode} {copy.modeSuffix}{" "}
              {copy.paypalPrefix}{" "}
              {config.mockPayPal
                ? copy.mockPayment
                : `${config.paypalCurrency} ${config.paypalAmount} ${copy.realPayment}`} {copy.modeSuffix}
            </p>
          </div>
        </section>

        <PaymentActions
          locale={locale}
          mockPayApp={config.mockPayApp}
          payAppApiEnabled={config.payAppApiEnabled}
          payAppCheckoutUrl={config.payAppCheckoutUrl}
          mockToss={config.mockToss}
          tossClientKey={config.tossClientKey}
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
