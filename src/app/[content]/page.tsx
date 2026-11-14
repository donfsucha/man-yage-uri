import { notFound, redirect } from "next/navigation";
import { qtChannels } from "@/lib/xcan/qt-videos";

export default async function QtEntryPage({ params }: { params: Promise<{ content: string }> }) {
  const { content } = await params;
  if (!Object.prototype.hasOwnProperty.call(qtChannels, content)) notFound();
  redirect(`/l/${content}`);
}
