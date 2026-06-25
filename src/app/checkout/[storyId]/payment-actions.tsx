"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/components/event-tracker";

type CheckoutLocale = "ko" | "en";

type PaymentActionsProps = {
  storyId: string;
  locale: CheckoutLocale;
  mockToss: boolean;
  tossClientKey: string;
  mockPayApp: boolean;
  payAppApiEnabled: boolean;
  payAppCheckoutUrl: string;
  mockPayPal: boolean;
  paypalClientId: string;
  paypalCurrency: string;
};

type PaymentApiResult = {
  amount?: number;
  currency?: string;
  customerKey?: string;
  error?: string;
  orderId?: string;
  orderName?: string;
  payUrl?: string;
  successUrl?: string;
  failUrl?: string;
};

type PayPalButtons = {
  close?: () => void;
  render: (selector: HTMLElement) => Promise<void>;
};

type PayPalSdk = {
  Buttons: (options: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError: () => void;
  }) => PayPalButtons;
};

type TossPayment = {
  requestPayment: (request: {
    method: "CARD";
    amount: {
      currency: string;
      value: number;
    };
    orderId: string;
    orderName: string;
    customerName?: string;
    successUrl: string;
    failUrl: string;
    card?: {
      flowMode: "DEFAULT";
    };
  }) => Promise<void>;
};

type TossPaymentsSdk = {
  payment: (options: { customerKey: string }) => TossPayment;
};

declare global {
  interface Window {
    paypal?: PayPalSdk;
    TossPayments?: (clientKey: string) => TossPaymentsSdk;
  }
}

const PAYMENT_COPY = {
  ko: {
    mockPrimaryIdle: "5화 완결 보기 - 7,900원",
    mockPrimaryLoading: "5화 완결 생성 중",
    payAppPayment: "국내 카드/간편결제로 결제",
    payAppLoading: "PayApp 결제창 준비 중",
    payAppNote:
      "PayApp 결제 완료 통보가 확인되면 완결편이 자동으로 저장되고 열람됩니다.",
    tossPayment: "국내 카드/간편결제로 결제",
    tossLoading: "Toss 결제창 준비 중",
    mockPayPal: "PayPal 모의 결제로 확인",
    confirmFailed: "결제 확인 처리에 실패했습니다.",
    networkFailed: "네트워크 상태를 확인하고 다시 시도해 주세요.",
    tossOrderFailed: "Toss 결제 준비에 실패했습니다.",
    tossSdkFailed: "Toss 결제창을 불러오지 못했습니다.",
    orderFailed: "PayPal 주문 생성에 실패했습니다.",
    captureFailed: "PayPal 결제 확인에 실패했습니다.",
    retryPayPal: "PayPal 결제를 다시 시도해 주세요.",
    sdkFailed: "PayPal 버튼을 불러오지 못했습니다."
  },
  en: {
    mockPrimaryIdle: "Unlock complete story - KRW 7,900",
    mockPrimaryLoading: "Generating complete story",
    payAppPayment: "Pay with Korean card or easy pay",
    payAppLoading: "Preparing PayApp checkout",
    payAppNote:
      "After PayApp payment, the server notification unlocks the complete story automatically.",
    tossPayment: "Pay with Korean card or easy pay",
    tossLoading: "Preparing Toss checkout",
    mockPayPal: "Confirm with mock PayPal",
    confirmFailed: "Payment confirmation failed.",
    networkFailed: "Check your network connection and try again.",
    tossOrderFailed: "Could not prepare the Toss payment.",
    tossSdkFailed: "Could not load Toss checkout.",
    orderFailed: "Could not create the PayPal order.",
    captureFailed: "Could not confirm the PayPal payment.",
    retryPayPal: "Try the PayPal payment again.",
    sdkFailed: "Could not load the PayPal button."
  }
} satisfies Record<CheckoutLocale, Record<string, string>>;

async function readJson(response: Response) {
  try {
    return (await response.json()) as PaymentApiResult;
  } catch {
    return {};
  }
}

export function PaymentActions({
  storyId,
  locale,
  mockToss,
  tossClientKey,
  mockPayApp,
  payAppApiEnabled,
  payAppCheckoutUrl,
  mockPayPal,
  paypalClientId,
  paypalCurrency
}: PaymentActionsProps) {
  const router = useRouter();
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const copy = PAYMENT_COPY[locale];
  const paypalSdkLocale = locale === "en" ? "en_US" : "ko_KR";
  const shouldRenderPayApp =
    !mockPayApp && (payAppApiEnabled || Boolean(payAppCheckoutUrl));
  const shouldRenderToss = !shouldRenderPayApp && !mockToss && Boolean(tossClientKey);
  const shouldRenderPayPalSdk = !mockPayPal && Boolean(paypalClientId);
  const shouldRenderMockConfirm =
    !shouldRenderPayApp && !shouldRenderToss && (mockPayPal || !paypalClientId);
  const completedHref =
    locale === "en" ? `/stories/${storyId}?lang=en` : `/stories/${storyId}`;

  const recordCheckoutClick = useCallback(
    (source: "mock_complete" | "paypal" | "payapp" | "toss") => {
      void trackEvent({
        eventName: "checkout_click",
        storyId,
        metadata: { source, locale }
      });
    },
    [locale, storyId]
  );

  async function startPayAppPayment() {
    recordCheckoutClick("payapp");

    if (!payAppApiEnabled) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/payment/payapp/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ storyId })
      });
      const result = await readJson(response);

      if (!response.ok || !result.payUrl) {
        setError(result.error ?? copy.confirmFailed);
        return;
      }

      window.open(result.payUrl, "_self", "noopener,noreferrer");
    } catch {
      setError(copy.networkFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  function loadTossSdk() {
    return new Promise<TossPaymentsSdk>((resolve, reject) => {
      if (window.TossPayments) {
        resolve(window.TossPayments(tossClientKey));
        return;
      }

      const scriptId = "toss-payments-js-sdk";
      const existingScript = document.getElementById(scriptId) as
        | HTMLScriptElement
        | null;

      function handleLoad() {
        if (!window.TossPayments) {
          reject(new Error(copy.tossSdkFailed));
          return;
        }

        resolve(window.TossPayments(tossClientKey));
      }

      function handleError() {
        reject(new Error(copy.tossSdkFailed));
      }

      if (existingScript) {
        existingScript.addEventListener("load", handleLoad, { once: true });
        existingScript.addEventListener("error", handleError, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://js.tosspayments.com/v2/standard";
      script.async = true;
      script.onload = handleLoad;
      script.onerror = handleError;
      document.body.appendChild(script);
    });
  }

  async function startTossPayment() {
    recordCheckoutClick("toss");
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/payment/toss/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ storyId })
      });
      const result = await readJson(response);

      if (
        !response.ok ||
        !result.orderId ||
        !result.orderName ||
        !result.amount ||
        !result.currency ||
        !result.customerKey ||
        !result.successUrl ||
        !result.failUrl
      ) {
        setError(result.error ?? copy.tossOrderFailed);
        return;
      }

      const tossPayments = await loadTossSdk();
      const payment = tossPayments.payment({ customerKey: result.customerKey });

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: result.currency,
          value: result.amount
        },
        orderId: result.orderId,
        orderName: result.orderName,
        customerName: locale === "en" ? "IfWe customer" : "만약에 우리 고객",
        successUrl: result.successUrl,
        failUrl: result.failUrl,
        card: {
          flowMode: "DEFAULT"
        }
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : copy.tossSdkFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeWithMock() {
    recordCheckoutClick("mock_complete");
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/payment/mock-confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ storyId })
      });
      const result = await readJson(response);

      if (!response.ok) {
        setError(result.error ?? copy.confirmFailed);
        return;
      }

      router.push(completedHref);
    } catch {
      setError(copy.networkFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  const createPayPalOrder = useCallback(async () => {
    recordCheckoutClick("paypal");
    const response = await fetch("/api/payment/paypal/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ storyId })
    });
    const result = await readJson(response);

    if (!response.ok || !result.orderId) {
      throw new Error(result.error ?? copy.orderFailed);
    }

    return result.orderId;
  }, [copy.orderFailed, recordCheckoutClick, storyId]);

  const capturePayPalOrder = useCallback(
    async (orderId: string) => {
      const response = await fetch("/api/payment/paypal/capture-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ storyId, orderId })
      });
      const result = await readJson(response);

      if (!response.ok) {
        throw new Error(result.error ?? copy.captureFailed);
      }

      router.push(completedHref);
    },
    [completedHref, copy.captureFailed, router, storyId]
  );

  async function completeWithMockPayPal() {
    setIsSubmitting(true);
    setError("");

    try {
      const orderId = await createPayPalOrder();
      await capturePayPalOrder(orderId);
    } catch (error) {
      setError(error instanceof Error ? error.message : copy.retryPayPal);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!shouldRenderPayPalSdk || !paypalContainerRef.current) {
      return;
    }

    let buttons: PayPalButtons | null = null;
    let cancelled = false;
    const scriptId = "paypal-js-sdk";

    function renderButtons() {
      if (cancelled || !window.paypal || !paypalContainerRef.current) {
        return;
      }

      paypalContainerRef.current.innerHTML = "";
      buttons = window.paypal.Buttons({
        createOrder: createPayPalOrder,
        onApprove: async (data) => {
          setIsSubmitting(true);
          setError("");

          try {
            await capturePayPalOrder(data.orderID);
          } catch (error) {
            setError(error instanceof Error ? error.message : copy.captureFailed);
          } finally {
            setIsSubmitting(false);
          }
        },
        onError: () => {
          setError(copy.retryPayPal);
        }
      });
      void buttons.render(paypalContainerRef.current);
    }

    const existingScript = document.getElementById(scriptId) as
      | HTMLScriptElement
      | null;
    const scriptSrc = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      paypalClientId
    )}&currency=${encodeURIComponent(paypalCurrency)}&intent=capture&locale=${encodeURIComponent(
      paypalSdkLocale
    )}`;

    function handleScriptError() {
      setError(copy.sdkFailed);
    }

    if (existingScript) {
      if (window.paypal) {
        renderButtons();
      } else {
        existingScript.addEventListener("load", renderButtons);
        existingScript.addEventListener("error", handleScriptError);
      }
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = scriptSrc;
      script.async = true;
      script.onload = renderButtons;
      script.onerror = handleScriptError;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      existingScript?.removeEventListener("load", renderButtons);
      existingScript?.removeEventListener("error", handleScriptError);
      buttons?.close?.();
    };
  }, [
    capturePayPalOrder,
    copy.captureFailed,
    copy.retryPayPal,
    copy.sdkFailed,
    createPayPalOrder,
    paypalClientId,
    paypalCurrency,
    paypalSdkLocale,
    shouldRenderPayPalSdk
  ]);

  return (
    <div className="grid gap-3">
      {shouldRenderPayApp ? (
        <>
          {payAppApiEnabled ? (
            <button
              className="button-primary w-full"
              disabled={isSubmitting}
              onClick={startPayAppPayment}
              type="button"
            >
              {isSubmitting ? copy.payAppLoading : copy.payAppPayment}
            </button>
          ) : (
            <a
              className="button-primary w-full text-center"
              href={payAppCheckoutUrl}
              onClick={startPayAppPayment}
              rel="noopener noreferrer"
              target="_blank"
            >
              {copy.payAppPayment}
            </a>
          )}
          <p className="text-center text-xs leading-5 text-[color:var(--muted)]">
            {copy.payAppNote}
          </p>
        </>
      ) : null}

      {shouldRenderToss ? (
        <button
          className="button-primary w-full"
          disabled={isSubmitting}
          onClick={startTossPayment}
          type="button"
        >
          {isSubmitting ? copy.tossLoading : copy.tossPayment}
        </button>
      ) : null}

      <button
        className={shouldRenderToss ? "button-secondary w-full" : "button-primary w-full"}
        disabled={isSubmitting}
        hidden={!shouldRenderMockConfirm}
        onClick={completeWithMock}
        type="button"
      >
        {isSubmitting ? copy.mockPrimaryLoading : copy.mockPrimaryIdle}
      </button>

      {shouldRenderMockConfirm ? (
        <button
          className="button-secondary w-full"
          disabled={isSubmitting}
          onClick={completeWithMockPayPal}
          type="button"
        >
          {copy.mockPayPal}
        </button>
      ) : shouldRenderPayPalSdk ? (
        <div ref={paypalContainerRef} />
      ) : null}

      {error ? (
        <div className="rounded-lg border border-[color:var(--danger)] bg-white p-3 text-sm leading-6 text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
