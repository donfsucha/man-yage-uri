import { NextResponse } from "next/server";
import { generateShortsPackage } from "@/lib/shorts/shorts-generator";
import { shortsMakerInputSchema } from "@/lib/shorts/schema";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "입력값을 확인해주세요." },
      { status: 400 }
    );
  }

  const parsed = shortsMakerInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값을 확인해주세요." },
      { status: 400 }
    );
  }

  try {
    const result = await generateShortsPackage(parsed.data);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "숏폼 문안을 생성하지 못했습니다." },
      { status: 500 }
    );
  }
}
