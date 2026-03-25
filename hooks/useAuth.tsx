"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  DocumentData,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export interface HistoryItem {
  id: string;
  userId: string;
  originalUrl: string;
  enhancedUrl: string;
  createdAt: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  history: HistoryItem[];
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  addHistory: (originalUrl: string, enhancedUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        const q = query(
          collection(db, "enhancements"),
          where("userId", "==", firebaseUser.uid),
          orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snapshot) => {
          setHistory(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as Omit<HistoryItem, "id">),
            }))
          );
        });
        return unsub;
      } else {
        setHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    router.push("/");
  };

  const logout = async () => {
    await signOut(auth);
    setHistory([]);
  };

  const addHistory = async (originalUrl: string, enhancedUrl: string) => {
    if (!user) return;
    try {
      const entry: Omit<HistoryItem, "id"> = {
        userId: user.uid,
        originalUrl,
        enhancedUrl,
        createdAt: new Date().toISOString(),
        status: "completed",
      };
      await addDoc(collection(db, "enhancements"), entry as DocumentData);
    } catch (e) {
      console.error("Error saving history:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, history, login, logout, addHistory, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
