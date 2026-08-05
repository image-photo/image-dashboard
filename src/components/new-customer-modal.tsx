"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type NewCustomerRecord = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
};

type NewCustomerModalProps = {
  onCancel: () => void;
  onCreated: (customer: NewCustomerRecord) => void;
  onError: (message: string) => void;
};

const usStates = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export default function NewCustomerModal({
  onCancel,
  onCreated,
  onError,
}: NewCustomerModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onCancel();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSaving, onCancel]);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 10);

    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    }

    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };

  const formatZipCode = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 5);
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const saveCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const trimmedEmail = email.trim();
    const newErrors = {
      firstName: firstName.trim() ? "" : "First name is required",
      lastName: lastName.trim() ? "" : "Last name is required",
      phone: phone.trim() ? "" : "Phone number is required",
      email:
        trimmedEmail && !isValidEmail(trimmedEmail)
          ? "Enter a valid email address"
          : "",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    setIsSaving(true);

    const { data, error } = await supabase
      .from("customers")
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        email: trimmedEmail || null,
        street_address: streetAddress.trim() || null,
        city: city.trim() || null,
        state: state || null,
        zip_code: zipCode || null,
      })
      .select("id, first_name, last_name, phone, email")
      .single();

    if (error) {
      setIsSaving(false);
      onError(error.message);
      return;
    }

    onCreated(data);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-customer-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
      >
        <div>
          <p className="app-eyebrow">Customer Directory</p>
          <h2 id="new-customer-title" className="text-2xl font-bold text-slate-900">
            New Customer
          </h2>
          <p className="mt-1 text-slate-500">
            Save their contact information now and add jobs whenever they are
            ready.
          </p>
        </div>

        <form onSubmit={saveCustomer} className="mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="new-customer-first-name"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                First Name
              </label>
              <input
                id="new-customer-first-name"
                className="app-input"
                value={firstName}
                autoComplete="given-name"
                autoFocus
                aria-invalid={Boolean(errors.firstName)}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  setErrors({ ...errors, firstName: "" });
                }}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="new-customer-last-name"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Last Name
              </label>
              <input
                id="new-customer-last-name"
                className="app-input"
                value={lastName}
                autoComplete="family-name"
                aria-invalid={Boolean(errors.lastName)}
                onChange={(event) => {
                  setLastName(event.target.value);
                  setErrors({ ...errors, lastName: "" });
                }}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="new-customer-phone"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Phone
              </label>
              <input
                id="new-customer-phone"
                className="app-input"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                aria-invalid={Boolean(errors.phone)}
                onChange={(event) => {
                  setPhone(formatPhoneNumber(event.target.value));
                  setErrors({ ...errors, phone: "" });
                }}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="new-customer-email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="new-customer-email"
                type="email"
                className="app-input"
                autoComplete="email"
                value={email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors({ ...errors, email: "" });
                }}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="new-customer-street-address"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Street Address
              </label>
              <input
                id="new-customer-street-address"
                className="app-input"
                autoComplete="street-address"
                value={streetAddress}
                onChange={(event) => setStreetAddress(event.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="new-customer-city"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                City
              </label>
              <input
                id="new-customer-city"
                className="app-input"
                autoComplete="address-level2"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="new-customer-state"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                State
              </label>
              <select
                id="new-customer-state"
                className="app-input"
                autoComplete="address-level1"
                value={state}
                onChange={(event) => setState(event.target.value)}
              >
                <option value="">Select state</option>
                {usStates.map((stateCode) => (
                  <option key={stateCode} value={stateCode}>
                    {stateCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="new-customer-zip-code"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Zip
              </label>
              <input
                id="new-customer-zip-code"
                className="app-input"
                inputMode="numeric"
                autoComplete="postal-code"
                value={zipCode}
                onChange={(event) =>
                  setZipCode(formatZipCode(event.target.value))
                }
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="app-button-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="app-button-primary disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving ? "Saving Customer..." : "Save Customer"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
