import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import toast from "react-hot-toast";

import { procurementAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await procurementAPI.login(form);

      const token =
        res.data.access_token ||
        res.data.token ||
        res.data;

      login(token);

      toast.success("Login Successful");

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center">

      <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-8">

        <h1 className="text-3xl font-bold text-center text-blue-700">
          SourceWise AI
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          Procurement Decision Platform
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div className="relative">

            <User
              className="absolute left-3 top-3 text-gray-400"
              size={20}
            />

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="w-full border rounded-lg py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

          </div>

          <div className="relative">

            <Lock
              className="absolute left-3 top-3 text-gray-400"
              size={20}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded-lg py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-semibold transition"
          >
            {loading ? "Signing In..." : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}