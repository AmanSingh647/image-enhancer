"use client";
import { useAuth } from "@/hooks/useAuth";
import { Zap, LogOut, UserCircle } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-black text-white">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
            <Zap size={22} fill="white" />
          </div>
          ESRGAN
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            AI
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Pro Member</span>
                <span className="text-sm text-slate-200 font-medium">{user.displayName}</span>
              </div>

              {/* Profile link */}
              <Link href="/profile" title="Your Profile">
                <img
                  src={user.photoURL ?? ""}
                  className="w-9 h-9 rounded-full border border-slate-700 hover:border-indigo-500 transition"
                  alt="avatar"
                />
              </Link>

              {/* Profile icon fallback on mobile */}
              <Link
                href="/profile"
                className="sm:hidden p-2 text-slate-400 hover:text-indigo-400 transition"
                title="Profile"
              >
                <UserCircle size={20} />
              </Link>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 transition"
                title="Sign out"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
            >
              Get Started Free
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
