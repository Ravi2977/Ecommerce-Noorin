
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/auth.store";

export default function LoginPage() {
  const router = useRouter();

  const login = useAuthStore((state: any) => state.login);
  const isLoading = useAuthStore((state: any) => state.isLoading);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });

      router.push("/");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid email or password. Please try again."
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
              Welcome Back
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#77716A]">
              Sign in to access your NOORINE account.
            </p>
          </div>

          {error && (
            <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

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
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm text-[#2B2B2B]">
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs text-[#8C6D1F] underline underline-offset-4"
                >
                  Forgot Password?
                </Link>
              </div>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={inputClass}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2B2B2B] px-5 py-4 text-xs tracking-[0.2em] text-white transition hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "SIGNING IN..." : "SIGN IN"}
            </button>

          </form>

          <div className="mt-7 border-t border-[#EEE8DF] pt-6 text-center">
            <p className="text-sm text-[#77716A]">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-[#8C6D1F] underline underline-offset-4"
              >
                Create Account
              </Link>
            </p>
          </div>

        </div>

        <p className="mt-6 text-center text-xs tracking-wide text-[#999087]">
          © {new Date().getFullYear()} NOORINE. ALL RIGHTS RESERVED.
        </p>

      </div>
    </main>
  );
}
