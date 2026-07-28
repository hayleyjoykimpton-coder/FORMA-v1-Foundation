"use client";

import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { signIn, signUp } from "@/lib/sync";

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
      setError(result.error);
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
    <div className="app">
      <div className="shell">
        <div className="screen auth-screen">
          <span className="wordmark">FORMA</span>
          <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="muted">
            Your programme, weights, history and photos stay private to your account — and sync across devices.
          </p>

          {!configured && (
            <article className="card">
              <span className="eyebrow">Setup needed</span>
              <p className="muted">
                Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (or{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) to enable accounts.
                You can keep using FORMA on this device meanwhile.
              </p>
            </article>
          )}

          {mode === "signup" && (
            <label className="field">
              <span>First name</span>
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Hayley" />
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
            Each account is private. Unlimited people can sign up; your data never mixes with anyone else&apos;s.
          </p>
        </div>
      </div>
    </div>
  );
}
