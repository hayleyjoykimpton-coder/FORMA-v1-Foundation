"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { isSupabaseConfigured, supabaseConfigDiagnostics } from "@/lib/supabase";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/lib/sync";

type AuthView = "signin" | "signup" | "forgot" | "update";

const AWAITING_PASSWORD_RESET_KEY = "forma-awaiting-password-reset";

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
  if (lower.includes("same password") || lower.includes("should be different")) {
    return "Choose a new password that is different from the last one.";
  }
  if (lower.includes("expired") || lower.includes("invalid token") || lower.includes("otp")) {
    return "This reset link has expired. Request a new one.";
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
  recovery = false,
  onPasswordUpdated,
  onCancelRecovery,
}: {
  onAuthenticated: () => void;
  /** Only used when cloud accounts are not configured (dev / setup). Hidden at launch. */
  onContinueLocal?: () => void;
  recovery?: boolean;
  onPasswordUpdated?: () => void;
  onCancelRecovery?: () => void;
}) {
  const [view, setView] = useState<AuthView>(recovery ? "update" : "signin");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const configured = isSupabaseConfigured();
  const diagnostics = supabaseConfigDiagnostics();

  useEffect(() => {
    if (recovery) {
      setView("update");
      setError(null);
      setInfo(null);
      setPassword("");
      setConfirmPassword("");
    }
  }, [recovery]);

  const goTo = (next: AuthView) => {
    setError(null);
    setInfo(null);
    setPassword("");
    setConfirmPassword("");
    setView(next);
  };

  const submitSignInOrUp = async () => {
    if (!email.trim() || password.length < 6) {
      setError("Use a valid email and a password of at least 6 characters.");
      return;
    }
    if (view === "signup" && !firstName.trim()) {
      setError("Add your first name to create an account.");
      return;
    }

    setBusy(true);
    const result =
      view === "signup"
        ? await signUp(email, password, firstName)
        : await signIn(email, password);
    setBusy(false);

    if (result.error) {
      setError(friendlyAuthError(result.error));
      return;
    }

    if (view === "signup" && !result.data?.session) {
      setInfo("Check your email to confirm your account, then sign in.");
      goTo("signin");
      return;
    }

    window.sessionStorage.removeItem(AWAITING_PASSWORD_RESET_KEY);
    onAuthenticated();
  };

  const submitForgot = async () => {
    if (!email.trim()) {
      setError("Enter the email you use for this account.");
      return;
    }
    setBusy(true);
    const result = await requestPasswordReset(email);
    setBusy(false);
    if (result.error) {
      setError(friendlyAuthError(result.error));
      return;
    }
    window.sessionStorage.setItem(AWAITING_PASSWORD_RESET_KEY, "1");
    setInfo("If an account exists for that email, we sent a reset link. Open it on this phone.");
  };

  const submitNewPassword = async () => {
    if (password.length < 6) {
      setError("Choose a password of at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don’t match.");
      return;
    }
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (result.error) {
      setError(friendlyAuthError(result.error));
      return;
    }
    window.sessionStorage.removeItem(AWAITING_PASSWORD_RESET_KEY);
    if (onPasswordUpdated) {
      onPasswordUpdated();
      return;
    }
    onAuthenticated();
  };

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (view === "forgot") {
      await submitForgot();
      return;
    }
    if (view === "update") {
      await submitNewPassword();
      return;
    }
    await submitSignInOrUp();
  };

  const heading =
    view === "signup"
      ? "Create your account"
      : view === "forgot"
        ? "Reset your password"
        : view === "update"
          ? "Set a new password"
          : "Welcome back";

  const lead =
    view === "forgot"
      ? "Enter the email on your account. We’ll send a link so you can choose a new password."
      : view === "update"
        ? "Choose a new password for this account, then you’ll be signed in."
        : "Create an account or sign in to save your Cracker programme, workouts and progress. Use the same email on every phone so nothing is lost if you delete the app icon.";

  const cta =
    busy
      ? "Please wait…"
      : view === "signup"
        ? "Create account"
        : view === "forgot"
          ? "Send reset link"
          : view === "update"
            ? "Save new password"
            : "Sign in";

  return (
    <div className="app challenge-cracker cracker-auth-app">
      <div className="shell">
        <div className="screen auth-screen cracker-auth-screen">
          <BrandLogo variant="duo" size="hero" />
          <p className="cracker-auth-kicker">Life & Soul · Christmas Cracker 2026</p>
          <h1>{heading}</h1>
          <p className="muted">{lead}</p>

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

          {view === "signup" && (
            <label className="field">
              <span>First name</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Jess"
              />
            </label>
          )}

          {view !== "update" && (
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
          )}

          {view !== "forgot" && (
            <label className="field">
              <span>{view === "update" ? "New password" : "Password"}</span>
              <input
                type="password"
                autoComplete={view === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
              />
            </label>
          )}

          {view === "signin" ? (
            <button type="button" className="text-btn auth-forgot" onClick={() => goTo("forgot")}>
              Forgot password?
            </button>
          ) : null}

          {view === "update" && (
            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Type it again"
              />
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button className="cta-btn" disabled={busy || !configured} onClick={() => void submit()}>
            {cta}
          </button>

          {view === "signin" || view === "signup" ? (
            <button
              className="secondary-btn"
              onClick={() => goTo(view === "signin" ? "signup" : "signin")}
            >
              {view === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          ) : (
            <button
              className="secondary-btn"
              onClick={() => {
                if (view === "update") onCancelRecovery?.();
                goTo("signin");
              }}
            >
              Back to sign in
            </button>
          )}

          {!configured && onContinueLocal ? (
            <button className="text-btn centered" onClick={onContinueLocal}>
              Continue on this device only
            </button>
          ) : null}

          <p className="muted centered auth-note">
            Next you’ll choose your club and join the 6-week Christmas Cracker.
          </p>
        </div>
      </div>
    </div>
  );
}
