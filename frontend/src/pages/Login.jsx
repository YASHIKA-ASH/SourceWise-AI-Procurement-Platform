import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import heroImage from "../images/image.png";
import toast from "react-hot-toast";

import { procurementAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.username || !form.password) {
      toast.error("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const res = await procurementAPI.login(form);

      const token =
        res.data.access_token ||
        res.data.token ||
        res.data;

      login(token);

      toast.success("Welcome back!");

      navigate("/dashboard");
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          "Invalid username or password"
      );
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setForm({
      username: "demo",
      password: "Demo@123",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-8">

      <div className="w-full max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="grid lg:grid-cols-2">

          {/* LEFT PANEL */}

          <div className="relative h-[900px]">

            <img
              src={heroImage}
              alt="SourceWise"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/45 to-slate-950/80" />

            <div className="absolute inset-0 flex flex-col justify-between p-12">

              <div className="flex items-center gap-5">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 shadow-xl">

                  <Sparkles
                    className="text-white"
                    size={30}
                  />

                </div>

                <div>

                  <h1 className="text-3xl font-bold text-white">

                    SourceWise AI

                  </h1>

                  <p className="text-blue-200">

                    Intelligent Procurement Platform

                  </p>

                </div>

              </div>

              <div>

                <h2 className="max-w-lg text-6xl font-black leading-tight text-white">

                  Procurement.

                  <br />

                  Reinvented.

                </h2>

                

                <div className="mt-12 space-y-5">

                  <div className="flex items-center gap-4">

                    <div className="rounded-xl bg-cyan-500/20 p-3">

                      <ShieldCheck className="text-cyan-300" />

                    </div>

                    <div>

                      <h3 className="font-semibold text-white">

                        Enterprise Security

                      </h3>

                      <p className="text-slate-300">

                        JWT Authentication & Role Based Access

                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-4">

                    <div className="rounded-xl bg-cyan-500/20 p-3">

                      <CheckCircle2 className="text-cyan-300" />

                    </div>

                    <div>

                      <h3 className="font-semibold text-white">

                        AI Procurement Copilot

                      </h3>

                      <p className="text-slate-300">

                        Smart supplier recommendations in seconds

                      </p>

                    </div>

                  </div>

                </div>

              </div>

              <div>

                <p className="text-slate-300">

                  © 2026 SourceWise AI

                </p>

              </div>

            </div>

          </div>

          {/* RIGHT PANEL */}

          <div className="flex items-center justify-center bg-white">

            <div className="w-full max-w-md px-10 py-16">

              <h2 className="text-5xl font-bold text-slate-900">

                Welcome Back

              </h2>

              <p className="mt-4 text-slate-500">

                Sign in to continue to your procurement workspace.

              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-10 space-y-6"
              >

                {/* Username */}

                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Username

                  </label>

                  <div className="flex h-14 items-center rounded-xl border border-slate-300">

                    <Mail
                      className="ml-4 text-slate-400"
                      size={18}
                    />

                    <input
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      className="flex-1 bg-transparent px-4 outline-none"
                    />

                  </div>

                </div>
                                {/* Password */}

                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Password

                  </label>

                  <div className="flex h-14 items-center rounded-xl border border-slate-300">

                    <Lock
                      className="ml-4 text-slate-400"
                      size={18}
                    />

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className="flex-1 bg-transparent px-4 outline-none"
                    />

                  </div>

                </div>

                {/* Forgot Password */}

                <div className="flex justify-end">

                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 transition hover:text-cyan-600"
                  >
                    Forgot Password?
                  </button>

                </div>

                {/* Login Button */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <span className="flex items-center gap-3">

                    {loading ? "Signing In..." : "Sign In"}

                    {!loading && (

                      <ArrowRight
                        size={20}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />

                    )}

                  </span>

                </button>

                {/* Demo Card */}

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">

                  <h3 className="text-lg font-semibold text-slate-900">

                    Demo Account

                  </h3>

                  <p className="mt-2 text-sm text-slate-600">

                    Reviewers can use these credentials to
                    explore the platform.

                  </p>

                  <div className="mt-5 space-y-3">

                    <div className="rounded-lg bg-white p-3 shadow-sm">

                      <p className="text-xs uppercase tracking-wide text-slate-500">

                        Username

                      </p>

                      <p className="font-semibold text-cyan-600">

                        demo

                      </p>

                    </div>

                    <div className="rounded-lg bg-white p-3 shadow-sm">

                      <p className="text-xs uppercase tracking-wide text-slate-500">

                        Password

                      </p>

                      <p className="font-semibold text-cyan-600">

                        Demo@123

                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={fillDemo}
                    className="mt-6 w-full rounded-xl border border-cyan-300 bg-cyan-500/10 py-3 font-semibold text-cyan-700 transition hover:bg-cyan-500/20"
                  >
                    Use Demo Account
                  </button>

                </div>
                                {/* Divider */}

                <div className="relative py-4">

                  <div className="absolute inset-0 flex items-center">

                    <div className="w-full border-t border-slate-200"></div>

                  </div>

                  <div className="relative flex justify-center">

                    <span className="bg-white px-4 text-sm text-slate-400">

                      New to SourceWise?

                    </span>

                  </div>

                </div>

                {/* Register */}

                <Link
                  to="/register"
                  className="flex h-14 w-full items-center justify-center rounded-xl border border-slate-300 font-semibold text-slate-700 transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                >
                  Request New Account
                </Link>

              </form>

              {/* Enterprise Notice */}

              <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <h3 className="font-semibold text-slate-900">

                  Enterprise Access

                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">

                  SourceWise AI is designed for enterprise procurement teams.
                  Employee accounts are created by your organization's
                  administrator. If you don't have credentials, request an
                  account or use the demo account to explore the platform.

                </p>

              </div>

              <p className="mt-8 text-center text-sm text-slate-500">

                © 2026 SourceWise AI Procurement Platform

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}