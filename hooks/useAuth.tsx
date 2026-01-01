"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        // Fetch History
        const q = query(
          collection(db, "enhancements"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        onSnapshot(q, (snapshot) => {
          setHistory(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    router.push("/");
  };

  const addHistory = async (originalUrl: string, enhancedUrl: string) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "enhancements"), {
        userId: user.uid,
        originalUrl: originalUrl, // Cloudinary link
        enhancedUrl: enhancedUrl, // Cloudinary link
        createdAt: new Date().toISOString(),
        status: "completed",
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        history,
        login,
        logout: () => signOut(auth),
        addHistory,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
