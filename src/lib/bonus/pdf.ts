function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function hasUnicodeText(title: string, lines: readonly string[]) {
  return [title, ...lines].some((line) => /[^\x00-\x7F]/.test(line));
}

function toUtf16BeHex(value: string) {
  const bytes = ["FE", "FF"];

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    bytes.push(code.toString(16).padStart(4, "0").toUpperCase().slice(0, 2));
    bytes.push(code.toString(16).padStart(4, "0").toUpperCase().slice(2));
  }

  return `<${bytes.join("")}>`;
}

function pdfText(value: string, useUnicode: boolean) {
  return useUnicode ? toUtf16BeHex(value) : `(${escapePdfText(value)})`;
}

function buildContent(title: string, lines: readonly string[]) {
  const useUnicode = hasUnicodeText(title, lines);
  const textLines = [
    "BT",
    "/F1 20 Tf",
    "72 760 Td",
    `${pdfText(title, useUnicode)} Tj`,
    "/F1 11 Tf",
    "0 -34 Td",
    ...lines.flatMap((line) => [
      `${pdfText(line, useUnicode)} Tj`,
      "0 -18 Td"
    ]),
    "ET"
  ];

  return textLines.join("\n");
}

export function createSimplePdf(title: string, lines: readonly string[]) {
  const content = buildContent(title, lines);
  const useUnicode = hasUnicodeText(title, lines);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    useUnicode
      ? "<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [6 0 R] >>"
      : "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`
  ];

  if (useUnicode) {
    objects.push(
      "<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> /FontDescriptor 7 0 R >>",
      "<< /Type /FontDescriptor /FontName /HYGoThic-Medium /Flags 6 /FontBBox [0 -200 1000 900] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 700 /StemV 80 >>"
    );
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export function pdfResponse(
  filename: string,
  title: string,
  lines: readonly string[]
) {
  return new Response(createSimplePdf(title, lines), {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/pdf"
    }
  });
}
