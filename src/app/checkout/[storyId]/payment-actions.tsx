"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/components/event-tracker";

type CheckoutLocale = "ko" | "en";

type PaymentActionsProps = {
  storyId: string;
  locale: CheckoutLocale;
  mockPayPal: boolean;
  paypalClientId: string;
  paypalCurrency: string;
};

type PaymentApiResult = {
  error?: string;
  orderId?: string;
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

declare global {
  interface Window {
    paypal?: PayPalSdk;
  }
}

const PAYMENT_COPY = {
  ko: {
    mockPrimaryIdle: "5화 완결 보기 - 7,900원",
    mockPrimaryLoading: "5화 완결 생성 중",
    mockPayPal: "PayPal 모의 결제로 확인",
    confirmFailed: "결제 확인 처리에 실패했습니다.",
    networkFailed: "네트워크 상태를 확인하고 다시 시도해 주세요.",
    orderFailed: "PayPal 주문 생성에 실패했습니다.",
    captureFailed: "PayPal 결제 확인에 실패했습니다.",
    retryPayPal: "PayPal 결제를 다시 시도해 주세요.",
    sdkFailed: "PayPal 버튼을 불러오지 못했습니다."
  },
  en: {
    mockPrimaryIdle: "Unlock complete story - KRW 7,900",
    mockPrimaryLoading: "Generating complete story",
    mockPayPal: "Confirm with mock PayPal",
    confirmFailed: "Payment confirmation failed.",
    networkFailed: "Check your network connection and try again.",
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
  const shouldRenderPayPalSdk = !mockPayPal && Boolean(paypalClientId);
  const shouldRenderMockConfirm = mockPayPal || !paypalClientId;
  const completedHref =
    locale === "en" ? `/stories/${storyId}?lang=en` : `/stories/${storyId}`;

  const recordCheckoutClick = useCallback(
    (source: "mock_complete" | "paypal") => {
      void trackEvent({
        eventName: "checkout_click",
        storyId,
        metadata: { source, locale }
      });
    },
    [locale, storyId]
  );

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
      <button
        className="button-primary w-full"
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
      ) : (
        <div ref={paypalContainerRef} />
      )}

      {error ? (
        <div className="rounded-lg border border-[color:var(--danger)] bg-white p-3 text-sm leading-6 text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
