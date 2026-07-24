import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import heroImage from "../images/image.png";

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [agree, setAgree] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    alert(
      "SourceWise is an enterprise platform.\n\nPlease contact your administrator to create an account."
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-8">

      <div className="w-full max-w-7xl rounded-3xl overflow-hidden shadow-2xl bg-white">

        <div className="grid lg:grid-cols-2">

          {/* LEFT SIDE */}

          <div className="relative h-[850px]">

            <img
              src={heroImage}
              alt="SourceWise"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-900/40 to-slate-950/80" />

            <div className="absolute inset-0 flex flex-col justify-between p-12">

              <div className="flex items-center gap-4">

                <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl">

                  <Sparkles className="text-white" size={30} />

                </div>

                <div>

                  <h2 className="text-3xl font-bold text-white">

                    SourceWise AI

                  </h2>

                  <p className="text-blue-200">

                    Procurement Decision Platform

                  </p>

                </div>

              </div>

              <div>

                <h1 className="text-6xl font-black text-white leading-tight">

                  Welcome

                </h1>

                

                <div className="mt-12 space-y-5">

                  <div className="flex items-center gap-4">

                    <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">

                      <ShieldCheck className="text-cyan-300" />

                    </div>

                    <div>

                      <h3 className="font-semibold text-white">

                        Secure Enterprise Platform

                      </h3>

                      <p className="text-sm text-slate-300">

                        JWT Authentication & Role Based Access

                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-4">

                    <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">

                      <Sparkles className="text-cyan-300" />

                    </div>

                    <div>

                      <h3 className="font-semibold text-white">

                        AI Procurement Assistant

                      </h3>

                      <p className="text-sm text-slate-300">

                        Supplier recommendations powered by AI.

                      </p>

                    </div>

                  </div>

                </div>

              </div>

              <p className="text-slate-300">

                 2026 SourceWise AI Procurement Platform

              </p>

            </div>

          </div>

          {/* RIGHT SIDE */}

          <div className="flex items-center justify-center bg-white">

            <div className="w-full max-w-lg px-10 py-14">

              <h2 className="text-5xl font-bold text-slate-900">

                Register

              </h2>

              <p className="mt-4 text-slate-500">

                Request access to the SourceWise enterprise platform.

              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-10 space-y-6"
              >

                <div className="grid grid-cols-2 gap-5">

                  <div>

                    <label className="mb-2 block text-sm font-medium">

                      First Name

                    </label>

                    <div className="flex h-14 items-center rounded-xl border border-slate-300">

                      <User className="ml-4 text-slate-400" size={18} />

                      <input
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        className="flex-1 bg-transparent px-4 outline-none"
                        placeholder="John"
                      />

                    </div>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">

                      Last Name

                    </label>

                    <div className="flex h-14 items-center rounded-xl border border-slate-300">

                      <User className="ml-4 text-slate-400" size={18} />

                      <input
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        className="flex-1 bg-transparent px-4 outline-none"
                        placeholder="Doe"
                      />

                    </div>

                  </div>

                </div>
                                {/* Email */}

                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Email Address

                  </label>

                  <div className="flex h-14 items-center rounded-xl border border-slate-300">

                    <Mail className="ml-4 text-slate-400" size={18} />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="flex-1 bg-transparent px-4 outline-none"
                      placeholder="john@example.com"
                    />

                  </div>

                </div>

                {/* Password */}

                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Password

                  </label>

                  <div className="flex h-14 items-center rounded-xl border border-slate-300">

                    <Lock className="ml-4 text-slate-400" size={18} />

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="flex-1 bg-transparent px-4 outline-none"
                      placeholder="••••••••"
                    />

                  </div>

                </div>

                {/* Confirm Password */}

                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Confirm Password

                  </label>

                  <div className="flex h-14 items-center rounded-xl border border-slate-300">

                    <Lock className="ml-4 text-slate-400" size={18} />

                    <input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="flex-1 bg-transparent px-4 outline-none"
                      placeholder="••••••••"
                    />

                  </div>

                </div>

                {/* Enterprise Notice */}

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                  <h3 className="font-semibold text-slate-900">

                    Enterprise Registration

                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">

                    SourceWise is an enterprise procurement platform.
                    New accounts require administrator approval before access
                    can be granted.

                  </p>

                </div>

                {/* Terms */}

                <label className="flex items-start gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={() => setAgree(!agree)}
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />

                  <span className="text-sm leading-6 text-slate-600">

                    I agree to the Terms of Service and Privacy Policy.

                  </span>

                </label>
                                {/* Register Button */}

                <button
                  type="submit"
                  disabled={!agree}
                  className="group flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex items-center gap-3">
                    Request Access
                    <ArrowRight
                      size={20}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </button>

                {/* Divider */}

                <div className="relative py-4">

                  <div className="absolute inset-0 flex items-center">

                    <div className="w-full border-t border-slate-200"></div>

                  </div>

                  <div className="relative flex justify-center">

                    <span className="bg-white px-4 text-sm text-slate-400">

                      Already have an account?

                    </span>

                  </div>

                </div>

                {/* Login Link */}

                <Link
                  to="/"
                  className="flex h-14 w-full items-center justify-center rounded-xl border border-slate-300 text-lg font-semibold text-slate-700 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                >
                  Sign In Instead
                </Link>

              </form>

              <p className="mt-10 text-center text-sm text-slate-500 leading-6">

                For security reasons, accounts are created by your organization’s
                administrator. If you need access, please contact your IT or
                procurement administrator.

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}