"use client";
/*
=========================================
Login
=========================================
*/

// Imports
import { useState } from "react";
import { supabase } from "@/lib/supabase";

// ====================
// COMPONENTS
// ====================

export default function LoginPage() {
  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const login = async () => {
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.location.href = "/";
  };

  // ====================
  // PAGE LAYOUT
  // ====================
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
      
      <section className="bg-white rounded-2xl p-8 shadow border w-full max-w-md">
        <p className="text-sm font-semibold text-blue-700 mb-2">
          Studio Login
        </p>

        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Sign In
        </h1>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form
            className="grid gap-4"
            onSubmit={(e) => {
                e.preventDefault();
                login();
            }}
            >
          <input
            className="border p-3 rounded-xl text-slate-900"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="border p-3 rounded-xl text-slate-900"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-xl font-semibold"
          >
            Sign In
          </button>
          
        </form>
        
      </section>

    </main>
  );
}