import { SignIn } from "./sign-in";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return <SignIn googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />;
}
