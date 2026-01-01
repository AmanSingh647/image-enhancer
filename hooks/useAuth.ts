"use client";

import { useState } from "react";

export interface HistoryItem {
  originalUrl: string;
  enhancedUrl: string;
  date: string;
}

export function useAuth() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const login = () => {
    setUser({ name: "User" });
  };

  const logout = () => {
    setUser(null);
    setHistory([]);
  };

  const addHistory = (item: HistoryItem) => {
    setHistory((prev) => [item, ...prev]);
  };

  return { user, login, logout, history, addHistory };
}
