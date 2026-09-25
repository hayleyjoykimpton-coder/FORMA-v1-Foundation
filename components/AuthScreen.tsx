"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { isSupabaseConfigured, supabaseConfigDiagnostics } from "@/lib/supabase";
import { signIn, signUp } from "@/lib/sync";

function friendlyAuthError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "That email or password doesn’t match. Check and try again.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (lower.includes("email") && lower.includes("invalid")) {
    return "Enter a valid email address.";
  }
  if (lower.includes("password") && (lower.includes("weak") || lower.includes("least"))) {
    return "Choose a stronger password (at least 6 characters).";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Couldn’t reach the server. Check your connection and try again.";
  }
  if (lower.includes("not configured") || lower.includes("supabase")) {
    return "Accounts aren’t available right now. You can continue on this device.";
  }
  // Never surface raw database / stack traces to members.
  if (lower.includes("permission") || lower.includes("rls") || lower.includes("jwt")) {
    return "Something went wrong signing in. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export function AuthScreen({
  onAuthenticated,
  onContinueLocal,
}: {
  onAuthenticated: () => void;
  onContinueLocal: () => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const configured = isSupabaseConfigured();
  const diagnostics = supabaseConfigDiagnostics();

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || password.length < 6) {
      setError("Use a valid email and a password of at least 6 characters.");
      return;
    }
    if (mode === "signup" && !firstName.trim()) {
      setError("Add your first name to create an account.");
      return;
    }

    setBusy(true);
    const result =
      mode === "signup"
        ? await signUp(email, password, firstName)
        : await signIn(email, password);
    setBusy(false);

    if (result.error) {
      setError(friendlyAuthError(result.error));
      return;
    }

    if (mode === "signup" && !result.data?.session) {
      setInfo("Check your email to confirm your account, then sign in.");
      setMode("signin");
      return;
    }

    onAuthenticated();
  };

  return (
    <div className="app challenge-cracker cracker-auth-app">
      <div className="shell">
        <div className="screen auth-screen cracker-auth-screen">
          <BrandLogo variant="duo" size="hero" />
          <p className="cracker-auth-kicker">Life & Soul · Christmas Cracker 2026</p>
          <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="muted">
            Sign in to save your Cracker programme, workout history, and progress across devices.
            Fitness Testing and InBody results sync when you are signed in.
          </p>

          {!configured && (
            <article className="card">
              <span className="eyebrow">Setup needed</span>
              <p className="muted">
                Accounts need Supabase environment variables. Add{" "}
                <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (or{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). You can still continue on this device.
              </p>
              {process.env.NODE_ENV !== "production" && diagnostics.missing.length > 0 ? (
                <p className="muted auth-diag">
                  Missing in this environment: {diagnostics.missing.join(", ")}. Values are never
                  shown here.
                </p>
              ) : null}
            </article>
          )}

          {mode === "signup" && (
            <label className="field">
              <span>First name</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Jess"
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button className="cta-btn" disabled={busy || !configured} onClick={() => void submit()}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button
            className="secondary-btn"
            onClick={() => {
              setError(null);
              setInfo(null);
              setMode((current) => (current === "signin" ? "signup" : "signin"));
            }}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>

          <button className="text-btn centered" onClick={onContinueLocal}>
            Continue on this device only
          </button>

          <p className="muted centered auth-note">
            Next you’ll choose your club and join the 6-week Christmas Cracker.
          </p>
        </div>
      </div>
    </div>
  );
}
