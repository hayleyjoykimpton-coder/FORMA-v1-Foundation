import type { UserProfile } from "./user";

/** Comma-separated in NEXT_PUBLIC_ADMIN_EMAILS — e.g. hayley@example.com */
export function adminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(profile: UserProfile | null, email?: string | null): boolean {
  if (profile?.isAdmin) return true;
  const emailNorm = email?.trim().toLowerCase();
  if (!emailNorm) return false;
  return adminEmails().includes(emailNorm);
}
