import {
  Bell,
  Search,
  Sun,
  Settings,
  UserCircle2,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">

      {/* Left */}

      <div>

        <h1 className="text-3xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Welcome back 👋 Here's your procurement overview.
        </p>

      </div>

      {/* Right */}

      <div className="flex items-center gap-5">

        {/* Search */}

        <div className="relative hidden lg:block">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search suppliers, reports..."
            className="w-80 rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

        </div>

        {/* AI Badge */}

        <div className="hidden md:flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-white shadow">

          <Sparkles size={18} />

          <span className="font-semibold">
            AI Enabled
          </span>

        </div>

        {/* Dark Mode */}

        <button className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center">

          <Sun
            size={20}
            className="text-slate-600"
          />

        </button>

        {/* Settings */}

        <button className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center">

          <Settings
            size={20}
            className="text-slate-600"
          />

        </button>

        {/* Notifications */}

        <button className="relative h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center">

          <Bell
            size={20}
            className="text-slate-600"
          />

          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500"></span>

        </button>

        {/* Profile */}

        <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2">

          <UserCircle2
            size={42}
            className="text-blue-600"
          />

          <div>

            <p className="font-semibold text-slate-800">
              Procurement Manager
            </p>

            <p className="text-xs text-slate-500">
              Administrator
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}