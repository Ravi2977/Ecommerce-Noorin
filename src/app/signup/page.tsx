
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/auth.store";

export default function SignupPage() {
  const router = useRouter();

  const signup = useAuthStore((state: any) => state.signup);
  const verifyEmail = useAuthStore((state: any) => state.verifyEmail);
  const resendVerification = useAuthStore(
    (state: any) => state.resendVerification
  );
  const isLoading = useAuthStore((state: any) => state.isLoading);

  const [step, setStep] = useState<"signup" | "verify">("signup");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const result = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      if (result.verificationRequired) {
        setStep("verify");
        setSuccess("Verification code sent to your email.");
        return;
      }

      router.push("/");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create your account. Please try again."
      );
    }
  };

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    try {
      await verifyEmail({
        email: form.email.trim(),
        code,
      });

      router.push("/");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Email verification failed. Please try again."
      );
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");

    try {
      await resendVerification({
        email: form.email.trim(),
      });

      setSuccess("A new verification code has been sent.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to resend verification code."
      );
    }
  };

  const inputClass =
    "w-full border border-[#E5DED5] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#8C6D1F]";

  return (
    <main className="min-h-screen bg-[#FAF6EF] px-4 py-12">
      <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center">

        <Link
          href="/"
          className="mb-10 text-center font-serif text-4xl tracking-[0.18em] text-[#2B2B2B]"
        >
          NOORINE
        </Link>

        <div className="border border-[#E9E0D5] bg-white p-7 shadow-sm sm:p-9">

          <div className="mb-8 text-center">
            <p className="mb-3 text-xs tracking-[0.25em] text-[#8C6D1F]">
              EVERYDAY SHINE
            </p>

            <h1 className="font-serif text-3xl text-[#2B2B2B]">
              {step === "signup"
                ? "Create Your Account"
                : "Verify Your Email"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#77716A]">
              {step === "signup"
                ? "Join NOORINE and discover your everyday elegance."
                : `We've sent a 6-digit verification code to ${form.email}.`}
            </p>
          </div>

          {error && (
            <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {step === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-5">

              <div>
                <label className="mb-2 block text-sm text-[#2B2B2B]">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={inputClass}
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#2B2B2B]">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={inputClass}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#2B2B2B]">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={inputClass}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#2B2B2B]">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={inputClass}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2B2B2B] px-5 py-4 text-xs tracking-[0.2em] text-white transition hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "PLEASE WAIT..." : "CREATE ACCOUNT"}
              </button>

              <p className="text-center text-sm text-[#77716A]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[#8C6D1F] underline underline-offset-4"
                >
                  Sign In
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">

              <div>
                <label className="mb-2 block text-sm text-[#2B2B2B]">
                  Verification Code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter 6-digit code"
                  className={`${inputClass} text-center text-xl tracking-[0.5em]`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2B2B2B] px-5 py-4 text-xs tracking-[0.2em] text-white transition hover:bg-[#8C6D1F] disabled:opacity-60"
              >
                {isLoading ? "VERIFYING..." : "VERIFY EMAIL"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-sm text-[#8C6D1F] underline underline-offset-4 disabled:opacity-50"
                >
                  Resend verification code
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep("signup");
                  setCode("");
                  setError("");
                  setSuccess("");
                }}
                className="w-full text-sm text-[#77716A] hover:text-[#2B2B2B]"
              >
                Back to Sign Up
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs tracking-wide text-[#999087]">
          © {new Date().getFullYear()} NOORINE. ALL RIGHTS RESERVED.
        </p>
      </div>
    </main>
  );
}
