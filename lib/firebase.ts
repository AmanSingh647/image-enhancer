import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBooBKayky89fMf21T8wOuL62_S_0tEChg",
  authDomain: "image-enhancer-84eed.firebaseapp.com",
  projectId: "image-enhancer-84eed",
  storageBucket: "image-enhancer-84eed.firebasestorage.app",
  messagingSenderId: "734369030346",
  appId: "1:734369030346:web:9422c7c071cf5663dc9433",
  measurementId: "G-J4X92C6YYZ",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
