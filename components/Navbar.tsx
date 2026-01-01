"use client";

// import { Button } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b">
      {/* Logo */}
      <div className="text-xl font-bold text-blue-600">
        ESRGAN<span className="text-slate-900">AI</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-slate-600">
              Hi, {user.name}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={login}
            className="px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            Login / Sign up
          </button>
        )}
      </div>
    </nav>
  );
}
