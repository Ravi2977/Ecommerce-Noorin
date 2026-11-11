
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Save,
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";

import useAuthStore from "@/store/auth.store";
import customerService from "@/service/modules/customer.service";

type Customer = {
  id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  createdAt?: string;
};

function extractCustomer(response: any): Customer {
  return (
    response?.customer ??
    response?.data?.customer ??
    response?.data ??
    response
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function ProfilePage() {
  const router = useRouter();

  const customerToken = useAuthStore((state) => state.customerToken);
  const customer = useAuthStore((state) => state.customer);
  const setCustomer = useAuthStore((state) => state.setCustomer);
  const initializeAuth = useAuthStore(
    (state) => state.initializeAuth
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await customerService.getProfile();
      const profile = extractCustomer(response);

      if (!profile || typeof profile !== "object") {
        throw new Error("Unable to load customer profile.");
      }

      setCustomer(profile);

      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [setCustomer]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!customerToken) {
      return;
    }

    loadProfile();
  }, [customerToken, loadProfile]);

  useEffect(() => {
    if (customerToken === null) {
      const timer = window.setTimeout(() => {
        if (!localStorage.getItem("customerToken")) {
          router.replace("/login");
        }
      }, 100);

      return () => window.clearTimeout(timer);
    }
  }, [customerToken, router]);

  const handleChange = (
    field: "name" | "phone",
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await customerService.updateProfile({
        name,
        phone,
      });

      // Fetch the actual updated profile instead of
      // trusting the PATCH response.
      const response = await customerService.getProfile();
      const updatedCustomer = extractCustomer(response);

      if (!updatedCustomer || typeof updatedCustomer !== "object") {
        throw new Error("Profile update could not be verified.");
      }

      setCustomer(updatedCustomer);

      setForm({
        name: updatedCustomer.name || "",
        phone: updatedCustomer.phone || "",
      });

      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-[#FAF6EF]">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#8C6D1F]" />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-[#FAF6EF] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1000px]">

        {/* Heading */}
        <div className="mb-8 border-b border-[#E5DED4] pb-6">
          <Link
            href="/account"
            className="mb-5 inline-flex items-center gap-2 text-xs text-[#817A72] transition-colors hover:text-[#8C6D1F]"
          >
            <ArrowLeft size={15} />
            Back to My Account
          </Link>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-[#8C6D1F]">
            NOORINE / MY ACCOUNT
          </p>

          <h1 className="font-serif text-4xl font-medium text-[#2B2B2B] sm:text-5xl">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-[#817A72]">
            Manage your personal information and account details.
          </p>
        </div>

        {/* Profile Card */}
        <div className="border border-[#E5DED4] bg-white">

          <div className="flex items-center gap-4 border-b border-[#E5DED4] p-6 sm:p-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F3EBDD] text-[#8C6D1F]">
              <UserRound size={25} strokeWidth={1.4} />
            </div>

            <div>
              <h2 className="font-serif text-2xl font-medium">
                Personal Information
              </h2>

              <p className="mt-1 text-xs text-[#817A72]">
                Update your registered customer details.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8">

            {/* Alerts */}
            {error && (
              <div
                role="alert"
                className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-6 flex items-center gap-2 border border-green-200 bg-green-50 p-4 text-sm text-green-700"
              >
                <CheckCircle2 size={17} />
                {success}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">

              {/* Name */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="name"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#625D56]"
                >
                  Full Name
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A8D]"
                  />

                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      handleChange("name", event.target.value)
                    }
                    placeholder="Enter your full name"
                    maxLength={100}
                    required
                    className="h-12 w-full border border-[#E5DED4] bg-[#FAF6EF]/40 pl-11 pr-4 text-sm outline-none transition-colors focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#625D56]"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A8D]"
                  />

                  <input
                    id="email"
                    type="email"
                    value={customer?.email || ""}
                    disabled
                    className="h-12 w-full cursor-not-allowed border border-[#E5DED4] bg-[#F3F0EA] pl-11 pr-4 text-sm text-[#817A72] outline-none"
                  />
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck
                    size={14}
                    className={
                      customer?.emailVerified
                        ? "text-green-700"
                        : "text-amber-700"
                    }
                  />

                  <span
                    className={
                      customer?.emailVerified
                        ? "text-green-700"
                        : "text-amber-700"
                    }
                  >
                    {customer?.emailVerified
                      ? "Email verified"
                      : "Email not verified"}
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#625D56]"
                >
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A49A8D]"
                  />

                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      handleChange("phone", event.target.value)
                    }
                    placeholder="Enter your phone number"
                    maxLength={20}
                    className="h-12 w-full border border-[#E5DED4] bg-[#FAF6EF]/40 pl-11 pr-4 text-sm outline-none transition-colors focus:border-[#C9A24B]"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#E5DED4] pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/account"
                className="inline-flex min-h-12 items-center justify-center border border-[#E5DED4] px-6 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-[#FAF6EF]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#2B2B2B] px-7 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}

                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Account Security */}
        <div className="mt-6 flex flex-col gap-4 border border-[#E5DED4] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-serif text-xl">
              Account Security
            </h3>

            <p className="mt-1 text-xs text-[#817A72]">
              Keep your account secure by updating your password regularly.
            </p>
          </div>

          <Link
            href="/account/password"
            className="inline-flex w-fit items-center gap-2 text-xs font-medium text-[#8C6D1F] hover:underline"
          >
            Change Password
            <ArrowLeft size={14} className="rotate-180" />
          </Link>
        </div>

      </div>
    </section>
  );
}
