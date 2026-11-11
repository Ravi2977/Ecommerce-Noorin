
"use client";

import { useState } from "react";
import useAuthStore from "@/store/auth.store";

export default function ChangePasswordPage() {
  const changePassword = useAuthStore((state) => state.changePassword);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordChecks = [
    {
      label: "At least 8 characters",
      valid: newPassword.length >= 8,
    },
    {
      label: "At least one uppercase letter",
      valid: /[A-Z]/.test(newPassword),
    },
    {
      label: "At least one lowercase letter",
      valid: /[a-z]/.test(newPassword),
    },
    {
      label: "At least one number",
      valid: /[0-9]/.test(newPassword),
    },
  ];

  const isPasswordValid = passwordChecks.every((check) => check.valid);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please choose a password that meets all the requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    try {
      setLoading(true);

      await changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Your password has been changed successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#E5DED4] bg-white px-4 py-3.5 pr-12 text-sm text-[#2B2B2B] outline-none transition focus:border-[#C9A24B]";

  const renderPasswordField = (
    label: string,
    value: string,
    setValue: (value: string) => void,
    visible: boolean,
    setVisible: (value: boolean) => void,
    placeholder: string
  ) => (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-[#555]">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          required
          className={inputClass}
        />

        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] transition hover:text-[#8C6D1F]"
        >
          {visible ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a16 16 0 0 1-3.1 3.9M6.2 6.2C4.1 7.6 3 12 3 12s3.5 7 9 7c1.4 0 2.6-.4 3.7-1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-[55vh] bg-[#FAF6EF]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">

        {/* Page Heading */}
        <div className="mb-8 sm:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8C6D1F]">
            Account Security
          </p>

          <h1 className="mt-2 font-[family-name:var(--font-cormorant)] text-4xl font-medium leading-tight text-[#2B2B2B] sm:text-5xl lg:text-6xl">
            Change Password
          </h1>

          <p className="mt-2 text-sm text-[#777] sm:text-base">
            Keep your NOORINE account secure with a strong password.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">

          {/* Password Form */}
          <section className="rounded-xl border border-[#E5DED4] bg-white p-5 sm:p-8 lg:p-10">
            <div className="mb-7">
              <h2 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#2B2B2B]">
                Update Your Password
              </h2>

              <p className="mt-1 text-sm text-[#888]">
                Enter your current password and choose a new one.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                ✓ {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {renderPasswordField(
                "Current Password",
                currentPassword,
                setCurrentPassword,
                showCurrent,
                setShowCurrent,
                "Enter current password"
              )}

              <div className="border-t border-[#F0EBE3]" />

              {renderPasswordField(
                "New Password",
                newPassword,
                setNewPassword,
                showNew,
                setShowNew,
                "Enter new password"
              )}

              {/* Password Requirements */}
              <div className="rounded-lg bg-[#FAF6EF] p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8C6D1F]">
                  Password Requirements
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span
                        className={
                          check.valid
                            ? "text-green-600"
                            : "text-[#B0A99F]"
                        }
                      >
                        {check.valid ? "✓" : "○"}
                      </span>

                      <span
                        className={
                          check.valid ? "text-green-700" : "text-[#888]"
                        }
                      >
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {renderPasswordField(
                "Confirm New Password",
                confirmPassword,
                setConfirmPassword,
                showConfirm,
                setShowConfirm,
                "Re-enter new password"
              )}

              {confirmPassword && (
                <p
                  className={`text-xs ${
                    confirmPassword === newPassword
                      ? "text-green-700"
                      : "text-red-600"
                  }`}
                >
                  {confirmPassword === newPassword
                    ? "✓ Passwords match"
                    : "Passwords do not match"}
                </p>
              )}

              <div className="border-t border-[#F0EBE3] pt-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-12 w-full items-center justify-center bg-[#2B2B2B] px-8 text-xs font-medium uppercase tracking-[0.16em] text-white transition hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {loading ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </section>

          {/* Security Information */}
          <aside className="space-y-5">
            <div className="rounded-xl border border-[#E5DED4] bg-white p-6 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF6EF] text-[#8C6D1F]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path
                    d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3 className="mt-5 font-[family-name:var(--font-cormorant)] text-2xl text-[#2B2B2B]">
                Your Security Matters
              </h3>

              <p className="mt-2 text-sm leading-7 text-[#888]">
                Your account security is important to us. Keep your password
                private and avoid sharing it with anyone.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5DED4] bg-white p-6 sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C6D1F]">
                Security Tips
              </p>

              <ul className="mt-4 space-y-4">
                {[
                  "Use a unique password for your NOORINE account.",
                  "Avoid using personal information in your password.",
                  "Never share your password or OTP with anyone.",
                  "Always log out when using a shared device.",
                ].map((tip, index) => (
                  <li key={index} className="flex gap-3 text-sm leading-6 text-[#777]">
                    <span className="mt-0.5 text-[#C9A24B]">✦</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
