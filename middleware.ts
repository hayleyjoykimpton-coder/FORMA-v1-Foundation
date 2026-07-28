import { type NextRequest, NextResponse } from "next/server";

/**
 * Pass-through middleware.
 *
 * FORMA auth + sync run in the browser (`lib/supabase.ts` / `lib/sync.ts`).
 * We intentionally do NOT call Supabase from Edge middleware — missing or
 * invalid env on Vercel preview was causing MIDDLEWARE_INVOCATION_FAILED (500).
 * Session refresh happens client-side via onAuthStateChange.
 */
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
