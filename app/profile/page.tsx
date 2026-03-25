"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap, Trash2, ArrowLeft, User, Mail, Calendar, ImageIcon } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, history, loading, clearHistory } = useAuth();
  const router = useRouter();
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleClearHistory = async () => {
    if (!confirm(`Delete all ${history.length} enhancements from history? This cannot be undone.`)) return;
    setClearing(true);
    try {
      await clearHistory();
      setCleared(true);
    } finally {
      setClearing(false);
    }
  };

  const firstEnhancement = history.length > 0
    ? new Date(history[history.length - 1].createdAt).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-white">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
              <Zap size={22} fill="white" />
            </div>
            ESRGAN<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
          </Link>
          <Link
            href="/"
            className="ml-auto flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={16} /> Back to App
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile header */}
        <div className="flex items-center gap-6 mb-10">
          <img
            src={user.photoURL ?? ""}
            alt="Avatar"
            className="w-20 h-20 rounded-2xl border-2 border-slate-700 shadow-xl"
          />
          <div>
            <h1 className="text-3xl font-black text-white">{user.displayName}</h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Mail size={14} /> {user.email}
            </p>
            <span className="mt-2 inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 uppercase tracking-wider">
              Pro Member
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <ImageIcon size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Total Enhanced</span>
            </div>
            <span className="text-4xl font-black text-white">{history.length}</span>
            <span className="text-xs text-slate-500">images processed</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <User size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Account</span>
            </div>
            <span className="text-lg font-bold text-white truncate">{user.displayName?.split(" ")[0]}</span>
            <span className="text-xs text-slate-500">Google account</span>
          </div>

          {firstEnhancement && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Member Since</span>
              </div>
              <span className="text-lg font-bold text-white">{firstEnhancement}</span>
              <span className="text-xs text-slate-500">first enhancement</span>
            </div>
          )}
        </div>

        {/* Danger zone */}
        {history.length > 0 && (
          <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-red-400 mb-1">Danger Zone</h2>
            <p className="text-sm text-slate-400 mb-4">
              Permanently delete all {history.length} enhancement records from your history.
              Your images on Cloudinary will remain, but the history entries will be gone.
            </p>
            {cleared ? (
              <p className="text-sm text-emerald-400 font-medium">History cleared successfully.</p>
            ) : (
              <button
                onClick={handleClearHistory}
                disabled={clearing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-wait"
              >
                {clearing ? "Clearing..." : <><Trash2 size={16} /> Clear All History</>}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
