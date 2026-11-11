
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  LoaderCircle,
  CheckCircle2,
  RefreshCw,
  Home,
  Building2,
  MapPinned,
} from "lucide-react";

import useAuthStore from "@/store/auth.store";
import customerService from "@/service/modules/customer.service";

type Address = {
  id: string;
  label?: string;
  recipientName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
};

type AddressForm = {
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const emptyForm: AddressForm = {
  label: "Home",
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

function extractAddresses(response: any): Address[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.addresses)) return response.addresses;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.addresses)) {
    return response.data.addresses;
  }

  return [];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function AddressIcon({ label }: { label?: string }) {
  const value = label?.toLowerCase();

  if (value === "home") return <Home size={21} />;
  if (value === "office") return <Building2 size={21} />;

  return <MapPinned size={21} />;
}

export default function AddressesPage() {
  const router = useRouter();

  const customerToken = useAuthStore((state) => state.customerToken);
  const initializeAuth = useAuthStore(
    (state) => state.initializeAuth
  );

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await customerService.getAddresses();
      setAddresses(extractAddresses(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!customerToken) return;
    loadAddresses();
  }, [customerToken, loadAddresses]);

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

  const openAddModal = () => {
    setEditingAddress(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);

    setForm({
      label: address.label || "Home",
      recipientName: address.recipientName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "India",
      isDefault: Boolean(address.isDefault),
    });

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleFormChange = (
    field: keyof AddressForm,
    value: string | boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.postalCode.trim() ||
      !form.country.trim()
    ) {
      setError("Please fill in all required address fields.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        label: form.label.trim(),
        recipientName: form.recipientName.trim(),
        phone: form.phone.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
        isDefault: form.isDefault,
      };

      const response = editingAddress
        ? await customerService.updateAddress(editingAddress.id, payload)
        : await customerService.addAddress(payload);

      setAddresses(extractAddresses(response));

      setSuccess(
        editingAddress
          ? "Address updated successfully."
          : "Address added successfully."
      );

      setIsModalOpen(false);
      setEditingAddress(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (address: Address) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${address.label || "address"}?`
    );

    if (!confirmed) return;

    setDeletingId(address.id);
    setError("");
    setSuccess("");

    try {
      const response = await customerService.deleteAddress(address.id);

      setAddresses(extractAddresses(response));
      setSuccess("Address deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (address: Address) => {
    if (address.isDefault) return;

    setError("");
    setSuccess("");

    try {
      const response = await customerService.updateAddress(address.id, {
        isDefault: true,
      });

      setAddresses(extractAddresses(response));
      setSuccess("Default address updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="min-h-screen bg-[#FAF6EF] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1100px]">

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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-medium text-[#2B2B2B] sm:text-5xl">
                My Addresses
              </h1>

              <p className="mt-2 text-sm text-[#817A72]">
                Manage your saved delivery addresses.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              disabled={addresses.length >= 20}
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#2B2B2B] px-5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Add New Address
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-col gap-3 border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadAddresses}
              className="inline-flex items-center gap-2 text-xs font-medium text-red-800"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            <CheckCircle2 size={17} />
            {success}
          </div>
        )}

        {/* Address List */}
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center border border-[#E5DED4] bg-white">
            <LoaderCircle className="h-7 w-7 animate-spin text-[#8C6D1F]" />
          </div>
        ) : addresses.length > 0 ? (
          <>
            <div className="mb-5 flex items-center justify-between text-xs text-[#817A72]">
              <span>{addresses.length} saved address(es)</span>
              <span>Maximum 20 addresses</span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className={`border bg-white p-5 sm:p-6 ${
                    address.isDefault
                      ? "border-[#C9A24B]"
                      : "border-[#E5DED4]"
                  }`}
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#F5F0E7] text-[#8C6D1F]">
                        <AddressIcon label={address.label} />
                      </div>

                      <div>
                        <h2 className="font-serif text-xl font-medium">
                          {address.label || "Address"}
                        </h2>

                        {address.isDefault && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#8C6D1F]">
                            <Star size={11} fill="currentColor" />
                            Default Address
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(address)}
                        aria-label="Edit address"
                        className="flex h-9 w-9 items-center justify-center text-[#817A72] transition-colors hover:bg-[#F5F0E7] hover:text-[#8C6D1F]"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(address)}
                        disabled={deletingId === address.id}
                        aria-label="Delete address"
                        className="flex h-9 w-9 items-center justify-center text-[#817A72] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === address.id ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-[#625D56]">
                    {address.recipientName && (
                      <p className="font-medium text-[#2B2B2B]">
                        {address.recipientName}
                      </p>
                    )}

                    {address.phone && (
                      <p className="text-xs text-[#817A72]">
                        {address.phone}
                      </p>
                    )}

                    <p>{address.addressLine1}</p>

                    {address.addressLine2 && (
                      <p>{address.addressLine2}</p>
                    )}

                    <p>
                      {[address.city, address.state]
                        .filter(Boolean)
                        .join(", ")}
                      {address.postalCode
                        ? ` - ${address.postalCode}`
                        : ""}
                    </p>

                    <p>{address.country}</p>
                  </div>

                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address)}
                      className="mt-5 border-t border-[#E5DED4] pt-4 text-xs font-medium text-[#8C6D1F] transition-colors hover:underline"
                    >
                      Set as Default Address
                    </button>
                  )}
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center border border-[#E5DED4] bg-white px-5 py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F0E7] text-[#8C6D1F]">
              <MapPin size={27} strokeWidth={1.4} />
            </div>

            <h2 className="font-serif text-2xl">
              No saved addresses
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#817A72]">
              Add your delivery address to make your next purchase easier.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="mt-6 inline-flex items-center gap-2 bg-[#2B2B2B] px-6 py-3 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#8C6D1F]"
            >
              <Plus size={15} />
              Add Your First Address
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-modal-title"
            className="my-auto max-h-[90vh] w-full max-w-[650px] overflow-y-auto bg-[#FAF6EF] shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5DED4] bg-[#FAF6EF] p-5 sm:p-6">
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#8C6D1F]">
                  NOORINE / DELIVERY
                </p>

                <h2
                  id="address-modal-title"
                  className="font-serif text-2xl"
                >
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Close address form"
                className="flex h-9 w-9 items-center justify-center text-[#625D56] hover:bg-[#EDE6DA] disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="label"
                  className="mb-2 block text-xs font-medium"
                >
                  Address Label
                </label>

                <select
                  id="label"
                  value={form.label}
                  onChange={(event) =>
                    handleFormChange("label", event.target.value)
                  }
                  className="h-11 w-full border border-[#E5DED4] bg-white px-3 text-sm outline-none focus:border-[#C9A24B]"
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="recipientName" className="mb-2 block text-xs font-medium">
                    Recipient Name
                  </label>
                  <input
                    id="recipientName"
                    value={form.recipientName}
                    onChange={(event) =>
                      handleFormChange("recipientName", event.target.value)
                    }
                    maxLength={100}
                    className="h-11 w-full border border-[#E5DED4] bg-white px-3 text-sm outline-none focus:border-[#C9A24B]"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-xs font-medium">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      handleFormChange("phone", event.target.value)
                    }
                    maxLength={20}
                    className="h-11 w-full border border-[#E5DED4] bg-white px-3 text-sm outline-none focus:border-[#C9A24B]"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="addressLine1" className="mb-2 block text-xs font-medium">
                  Address Line 1 *
                </label>
                <input
                  id="addressLine1"
                  value={form.addressLine1}
                  onChange={(event) =>
                    handleFormChange("addressLine1", event.target.value)
                  }
                  maxLength={200}
                  required
                  className="h-11 w-full border border-[#E5DED4] bg-white px-3 text-sm outline-none focus:border-[#C9A24B]"
                  placeholder="House / Flat / Street / Area"
                />
              </div>

              <div>
                <label htmlFor="addressLine2" className="mb-2 block text-xs font-medium">
                  Address Line 2
                </label>
                <input
                  id="addressLine2"
                  value={form.addressLine2}
                  onChange={(event) =>
                    handleFormChange("addressLine2", event.target.value)
                  }
                  maxLength={200}
                  className="h-11 w-full border border-[#E5DED4] bg-white px-3 text-sm outline-none focus:border-[#C9A24B]"
                  placeholder="Landmark, apartment, etc. (optional)"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className="mb-2 block text-xs font-medium">
                    City *
                  </label>
                  <input
                    id="city"
                    value={form.city}
                    onChange={(event) =>
                      handleFormChange("city", event.target.value)
                    }
                    maxLength={100}
                    required
                    className="h-11 w-full border border-[#E5DED4] bg-white px-3 text-sm outline-none focus:border-[#C9A24B]"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="mb-2 block text-xs font-medium">
                    State *
                  </label>
                  <input
                    id="state"
                    value={form.state}
                    onChange={(event) =>
                      handleFormChange("state", event.target.value)
                    }
                    maxLength={100}
                    required
                    className="h-11 w-full border border-[#E5DED4] bg-white px-3 text-sm outline-none focus:border-[#C9A24B]"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label htmlFor="postalCode" className="mb-2 block text-xs font-medium">
                    Postal Code *
                  </label>
                  <input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(event) =>
                      handleFormChange("postalCode", event.target.value)
                    }
                    maxLength={20}
                    required
                    className="h-11 w-full border border-[#E5DED4] bg-white px-3 text-sm outline-none focus:border-[#C9A24B]"
                    placeholder="Postal code"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="mb-2 block text-xs font-medium">
                    Country *
                  </label>
                  <input
                    id="country"
                    value={form.country}
                    onChange={(event) =>
                      handleFormChange("country", event.target.value)
                    }
                    maxLength={100}
                    required
                    className="h-11 w-full border border-[#E5DED4] bg-white px-3 text-sm outline-none focus:border-[#C9A24B]"
                    placeholder="Country"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 border border-[#E5DED4] bg-white p-4">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    handleFormChange("isDefault", event.target.checked)
                  }
                  className="h-4 w-4 accent-[#8C6D1F]"
                />

                <span>
                  <span className="block text-sm font-medium">
                    Set as default address
                  </span>
                  <span className="mt-1 block text-xs text-[#817A72]">
                    Use this address as your primary delivery address.
                  </span>
                </span>
              </label>

              {error && (
                <div
                  role="alert"
                  className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[#E5DED4] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="min-h-11 border border-[#E5DED4] px-6 text-xs font-medium uppercase tracking-wider hover:bg-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#2B2B2B] px-6 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#8C6D1F] disabled:opacity-50"
                >
                  {isSaving ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}

                  {isSaving
                    ? "Saving..."
                    : editingAddress
                      ? "Update Address"
                      : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
