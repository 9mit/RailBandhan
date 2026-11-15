import { AuthForm } from "@/components/auth/auth-form";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Come aboard",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AuthForm mode="login" />;
}
