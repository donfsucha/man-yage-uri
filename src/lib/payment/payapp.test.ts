import { describe, expect, it } from "vitest";
import {
  createPayAppOrderId,
  isCompletedPayAppFeedback,
  isExpectedPayAppFeedback,
  normalizePayAppAmount,
  parsePayAppResponse,
  toPayAppRequestParams
} from "./payapp";

describe("payapp payment adapter", () => {
  it("normalizes PayApp amounts as positive KRW integers", () => {
    expect(normalizePayAppAmount(7900)).toBe(7900);
    expect(() => normalizePayAppAmount(4.99)).toThrow(
      "PayApp amount must be a positive integer."
    );
    expect(() => normalizePayAppAmount(0)).toThrow(
      "PayApp amount must be a positive integer."
    );
  });

  it("creates compact order IDs that can round-trip through var2", () => {
    const orderId = createPayAppOrderId(
      "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7",
      1790000000000
    );

    expect(orderId).toBe("payapp_1cc40ee98ae1488a89b95ff7d12cc1e7_1790000000000");
    expect(orderId.length).toBeLessThanOrEqual(64);
  });

  it("builds a PayApp payrequest form body with feedback and return URLs", () => {
    const params = toPayAppRequestParams({
      appUrl: "https://ifwe.cnanfc.com/",
      amount: 7900,
      orderId: "payapp_order_1",
      openPayTypes: "card,kakaopay,naverpay",
      recvPhone: "01000000000",
      storyId: "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7",
      title: "비 오는 날, 그 한 마디",
      userId: "seller-id"
    });

    expect(params.get("cmd")).toBe("payrequest");
    expect(params.get("userid")).toBe("seller-id");
    expect(params.get("goodname")).toBe("만약에 우리 완결편");
    expect(params.get("price")).toBe("7900");
    expect(params.get("recvphone")).toBe("01000000000");
    expect(params.get("smsuse")).toBe("n");
    expect(params.get("feedbackurl")).toBe(
      "https://ifwe.cnanfc.com/api/payment/payapp/feedback"
    );
    expect(params.get("returnurl")).toBe(
      "https://ifwe.cnanfc.com/checkout/1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7/payapp/success"
    );
    expect(params.get("var1")).toBe("1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7");
    expect(params.get("var2")).toBe("payapp_order_1");
  });

  it("parses PayApp query-string responses", () => {
    expect(
      parsePayAppResponse("state=1&errorMessage=&mul_no=2000&payurl=https%3A%2F%2Fpayapp.kr%2FL%2Fabc")
    ).toEqual({
      state: "1",
      errorMessage: "",
      mulNo: "2000",
      payUrl: "https://payapp.kr/L/abc"
    });
  });

  it("accepts only completed feedback matching seller, secret, story, order, and amount", () => {
    const feedback = {
      userid: "seller-id",
      linkkey: "link-key",
      linkval: "link-value",
      price: "7900",
      pay_state: "4",
      var1: "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7",
      var2: "payapp_order_1"
    };

    expect(isCompletedPayAppFeedback(feedback)).toBe(true);
    expect(
      isExpectedPayAppFeedback(feedback, {
        amount: 7900,
        linkKey: "link-key",
        linkValue: "link-value",
        orderId: "payapp_order_1",
        storyId: "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7",
        userId: "seller-id"
      })
    ).toBe(true);
    expect(
      isExpectedPayAppFeedback(
        { ...feedback, price: "1000" },
        {
          amount: 7900,
          linkKey: "link-key",
          linkValue: "link-value",
          orderId: "payapp_order_1",
          storyId: "1cc40ee9-8ae1-488a-89b9-5ff7d12cc1e7",
          userId: "seller-id"
        }
      )
    ).toBe(false);
  });
});
