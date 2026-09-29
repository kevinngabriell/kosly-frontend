import { SessionProvider } from "@/lib/session";

// Everything that needs to know who is signed in (login, register, verify, join, invites, onboarding, the
// app) lives in this route group. The group adds no URL segment; it only mounts one shared session, so
// moving between these pages doesn't refetch the profile. Marketing pages stay outside and never call the API.
export default function SessionLayout({ children }: LayoutProps<"/[locale]">) {
  return <SessionProvider>{children}</SessionProvider>;
}
