"use client";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { safeNextPath } from "@/lib/navigation";
import { ArrowUpRight, Eye, EyeOff, TrainFront } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (signup && password !== confirm) {
      setError("The passwords don’t match. Please check them.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const next = safeNextPath(
        new URLSearchParams(window.location.search).get("next"),
      );
      router.replace(
        signup ? `/onboarding?next=${encodeURIComponent(next)}` : next,
      );
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn’t connect. Please try again.",
      );
      setLoading(false);
    }
  }
  return (
    <div className="rb-auth">
      <div className="rb-auth-form-side">
        <Link href="/home" className="rb-brand">
          <span className="rb-brand-mark">
            <TrainFront size={24} />
          </span>
          <span>
            rail<span className="rb-brand-em">bandhan</span>
            <small>सफ़र से रिश्तों तक</small>
          </span>
        </Link>
        <div className="rb-auth-form">
          <span className="rb-eyebrow">
            {signup ? "A NEW CHAPTER BEGINS" : "YOUR NEXT CHAPTER AWAITS"}
          </span>
          <h1>
            {signup ? (
              <>
                Good company.
                <br />
                <em>Great journeys.</em>
              </>
            ) : (
              <>
                Welcome back,
                <br />
                <em>fellow traveller.</em>
              </>
            )}
          </h1>
          <p>
            {signup
              ? "Create your account, choose an anonymous handle and find the people on your route."
              : "Your journeys, your conversations, your people. Come right back in."}
          </p>
          <form onSubmit={submit}>
            {error && (
              <div role="alert" className="rb-error-message">
                {error}
              </div>
            )}
            <Input
              id="auth-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={254}
              required
              disabled={loading}
            />
            <Input
              id="auth-password"
              label="Password"
              type={visible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={signup ? 12 : 8}
              maxLength={128}
              required
              disabled={loading}
              helperText={
                signup
                  ? "Use at least 12 characters. A longer passphrase works well."
                  : undefined
              }
              rightIcon={
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                  className="rb-icon-button border-0"
                >
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            />
            {signup && (
              <Input
                id="confirm-password"
                label="Confirm password"
                type={visible ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
              />
            )}
            <button
              className="rb-button w-full"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Just a moment…"
                : signup
                  ? "Create my account"
                  : "Come aboard"}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="rb-auth-links">
            {signup ? "Already part of the journey? " : "New to RailBandhan? "}
            <Link href={signup ? "/login" : "/signup"}>
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
        <div className="rb-auth-footer">
          Your identity is yours to share.{" "}
          <Link href="/help">Read about privacy & safety</Link>
        </div>
      </div>
      <div className="rb-auth-art">
        <Image
          src={
            signup
              ? "/images/surreal_window_safar.webp"
              : "/images/hero_train_window.webp"
          }
          alt="An Indian train window opening onto a world of stories"
          fill
          priority
          sizes="50vw"
        />
        <div className="rb-auth-art-copy">
          <span className="rb-eyebrow">FROM THE FIRST STOP TO THE LAST</span>
          <h2>
            A whole country
            <br />
            outside your window.
            <br />
            <em>A little connection inside.</em>
          </h2>
          <p>
            Somewhere between “where are you headed?” and “have some chai”, a
            stranger becomes part of your story.
          </p>
        </div>
      </div>
    </div>
  );
}
