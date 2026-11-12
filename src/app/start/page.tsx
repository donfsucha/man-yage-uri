import { redirect } from "next/navigation";

// Android handles verified /start App Links and NFC intents in the native app,
// where the existing schedule is applied. Requests reaching the web always
// open the Korean Bible, without launching the app or changing saved schedules.
export default function NfcStartPage() {
  redirect("/b");
}
