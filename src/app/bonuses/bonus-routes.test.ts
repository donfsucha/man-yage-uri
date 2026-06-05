import { describe, expect, it, vi } from "vitest";
import { GET as getBreakupGuide } from "./breakup-guide/route";
import { GET as getJournalTemplate } from "./journal-template/route";

vi.mock("@/lib/story/persistence", () => ({
  recordAnalyticsEventSafely: vi.fn()
}));

async function readPdfHeader(response: Response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  return new TextDecoder().decode(bytes.slice(0, 8));
}

describe("bonus PDF routes", () => {
  it("serves Korean and English breakup guide PDFs", async () => {
    const korean = await getBreakupGuide(
      new Request("https://ifwe.cnanfc.com/bonuses/breakup-guide?lang=ko")
    );
    const english = await getBreakupGuide(
      new Request("https://ifwe.cnanfc.com/bonuses/breakup-guide?lang=en")
    );

    expect(korean.headers.get("Content-Type")).toBe("application/pdf");
    expect(korean.headers.get("Content-Disposition")).toContain(
      "ifwe-breakup-guide-ko.pdf"
    );
    expect(await readPdfHeader(korean)).toBe("%PDF-1.4");
    expect(english.headers.get("Content-Disposition")).toContain(
      "ifwe-breakup-guide-en.pdf"
    );
  });

  it("serves Korean and English journal template PDFs", async () => {
    const korean = await getJournalTemplate(
      new Request("https://ifwe.cnanfc.com/bonuses/journal-template?lang=ko")
    );
    const english = await getJournalTemplate(
      new Request("https://ifwe.cnanfc.com/bonuses/journal-template?lang=en")
    );

    expect(korean.headers.get("Content-Type")).toBe("application/pdf");
    expect(korean.headers.get("Content-Disposition")).toContain(
      "ifwe-emotional-journal-ko.pdf"
    );
    expect(await readPdfHeader(korean)).toBe("%PDF-1.4");
    expect(english.headers.get("Content-Disposition")).toContain(
      "ifwe-emotional-journal-en.pdf"
    );
  });
});
