export function cleanReaderText(value: string) {
  return value
    .replace(/,\s*\d+번째\s*갈림길에서,\s*/g, ", ")
    .replace(
      /\s*\d+번째로\s*돌아온\s*정적은 앞선 장면과 다른 결을 남겼다\.\s*/g,
      " "
    )
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
