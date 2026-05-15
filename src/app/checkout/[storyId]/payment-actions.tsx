"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type PaymentActionsProps = {
  storyId: string;
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

async function readJson(response: Response) {
  try {
    return (await response.json()) as PaymentApiResult;
  } catch {
    return {};
  }
}

export function PaymentActions({
  storyId,
  mockPayPal,
  paypalClientId,
  paypalCurrency
}: PaymentActionsProps) {
  const router = useRouter();
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const shouldRenderPayPalSdk = !mockPayPal && Boolean(paypalClientId);

  async function completeWithMock() {
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
        setError(result.error ?? "결제 승인 처리에 실패했습니다.");
        return;
      }

      router.push(`/stories/${storyId}`);
    } catch {
      setError("네트워크 상태를 확인한 뒤 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const createPayPalOrder = useCallback(async () => {
    const response = await fetch("/api/payment/paypal/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ storyId })
    });
    const result = await readJson(response);

    if (!response.ok || !result.orderId) {
      throw new Error(result.error ?? "PayPal 주문 생성에 실패했습니다.");
    }

    return result.orderId;
  }, [storyId]);

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
        throw new Error(result.error ?? "PayPal 결제 승인에 실패했습니다.");
      }

      router.push(`/stories/${storyId}`);
    },
    [router, storyId]
  );

  async function completeWithMockPayPal() {
    setIsSubmitting(true);
    setError("");

    try {
      const orderId = await createPayPalOrder();
      await capturePayPalOrder(orderId);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "PayPal 결제를 다시 시도해주세요."
      );
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
            setError(
              error instanceof Error
                ? error.message
                : "PayPal 결제 승인에 실패했습니다."
            );
          } finally {
            setIsSubmitting(false);
          }
        },
        onError: () => {
          setError("PayPal 결제를 다시 시도해주세요.");
        }
      });
      void buttons.render(paypalContainerRef.current);
    }

    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      renderButtons();
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
        paypalClientId
      )}&currency=${encodeURIComponent(paypalCurrency)}&intent=capture`;
      script.async = true;
      script.onload = renderButtons;
      script.onerror = () => setError("PayPal 버튼을 불러오지 못했습니다.");
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      buttons?.close?.();
    };
  }, [
    capturePayPalOrder,
    createPayPalOrder,
    paypalClientId,
    paypalCurrency,
    shouldRenderPayPalSdk
  ]);

  return (
    <div className="grid gap-3">
      <button
        className="button-primary w-full"
        disabled={isSubmitting}
        onClick={completeWithMock}
        type="button"
      >
        {isSubmitting ? "5화 완결 생성 중" : "모의 결제 승인하고 5화 생성하기"}
      </button>

      {mockPayPal || !paypalClientId ? (
        <button
          className="button-secondary w-full"
          disabled={isSubmitting}
          onClick={completeWithMockPayPal}
          type="button"
        >
          PayPal 모의 결제
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
