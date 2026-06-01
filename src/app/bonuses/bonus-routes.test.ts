import { describe, expect, it } from "vitest";
import { GET as getBreakupGuide } from "./breakup-guide/route";
import { GET as getJournalTemplate } from "./journal-template/route";

async function readPdfHeader(response: Response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  return new TextDecoder().decode(bytes.slice(0, 8));
}

describe("bonus PDF routes", () => {
  it("serves Korean and English breakup guide PDFs", async () => {
    const korean = getBreakupGuide(
      new Request("https://ifwe.cnanfc.com/bonuses/breakup-guide?lang=ko")
    );
    const english = getBreakupGuide(
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
    const korean = getJournalTemplate(
      new Request("https://ifwe.cnanfc.com/bonuses/journal-template?lang=ko")
    );
    const english = getJournalTemplate(
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
