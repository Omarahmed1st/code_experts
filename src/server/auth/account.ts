// The signed-in account for student pages (dashboard, settings). Any account
// can use them, staff included; guests are sent to sign in and come back.
import { redirect } from "next/navigation";
import { type SignedIn, getSignedIn } from "./staff";

export async function requireAccount(returnTo: string): Promise<SignedIn> {
  const signedIn = await getSignedIn();
  if (!signedIn) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return signedIn;
}
