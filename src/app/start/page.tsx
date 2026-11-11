import { redirect } from "next/navigation";

// NFC entry always opens the web reader, including Android and saved schedules.
export default function NfcStartPage() {
  redirect("/b");
}
