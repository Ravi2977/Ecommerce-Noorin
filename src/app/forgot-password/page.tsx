
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/auth.store";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const forgotPassword = useAuthStore(
    (state: any) => state.forgotPassword
  );
  const resetPassword = useAuthStore(
    (state: any) => state.resetPassword
  );
  const startSession = useAuthStore(
    (state: any) => state.startSession
  );
  const isLoading = useAuthStore(
    (state: any) => state.isLoading
  );

  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inputClass =
    "w-full border border-[#E5DED5] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#8C6D1F]";

  // Step 1: Request password reset OTP
  const handleForgotPassword = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const result = await forgotPassword({
        email: email.trim(),
      });

      // Display actual backend response
      setMessage(result.message || "Reset code request processed.");

      if (result.sent) {
        setStep("reset");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to send reset code."
      );
    }
  };

  // Step 2: Verify OTP and set new password
  const handleResetPassword = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const result = await resetPassword({
        email: email.trim(),
        code,
        newPassword,
      });

      if (result.token) {
        await startSession(result.token, result.customer || null);
        router.push("/");
        return;
      }

      setMessage("Password reset completed. Please sign in.");
      router.push("/login");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid or expired OTP. Please request a new code."
      );
    }
  };

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
              {step === "email"
                ? "Forgot Password?"
                : "Reset Your Password"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#77716A]">
              {step === "email"
                ? "Enter your registered email to receive a password reset code."
                : `Enter the verification code sent to ${email}.`}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-5 border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
            >
              {message}
            </div>
          )}

          {step === "email" ? (
            <form
              onSubmit={handleForgotPassword}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm text-[#2B2B2B]">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className={inputClass}
                  autoComplete="email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2B2B2B] px-5 py-4 text-xs tracking-[0.2em] text-white transition hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "SENDING..."
                  : "SEND RESET CODE"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleResetPassword}
              className="space-y-5"
            >
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
                    setCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit OTP"
                  className={`${inputClass} text-center text-xl tracking-[0.5em]`}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#2B2B2B]">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={inputClass}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#2B2B2B]">
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
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
                {isLoading
                  ? "RESETTING PASSWORD..."
                  : "RESET PASSWORD"}
              </button>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="w-full text-sm text-[#8C6D1F] underline underline-offset-4 disabled:opacity-50"
              >
                Resend verification code
              </button>
            </form>
          )}

          <div className="mt-7 border-t border-[#EEE8DF] pt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-[#8C6D1F] underline underline-offset-4"
            >
              Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
