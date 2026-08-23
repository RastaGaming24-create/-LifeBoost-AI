import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase Web configuration is public client configuration. The NEXT_PUBLIC_
// variables are preferred in production, but the public project configuration
// is also provided as a fallback so the app can initialize correctly when the
// Vercel environment variables have not yet been added.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCFvsz5ZKHircfQ8CgvPxf2E_f-tDGWuKg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "life-boost-ai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "life-boost-ai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "life-boost-ai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "527636969962",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:527636969962:web:ffd5630de1b68265981a93",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5B3X77CTJV",
};

export const firebaseConfigured = Object.values(firebaseConfig).slice(0, 6).every(Boolean);

let app: FirebaseApp | null = null;

if (firebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// These remain typed as Firebase services so the existing client code can use
// auth/db after checking firebaseConfigured.
export const auth = (app ? getAuth(app) : null) as Auth;
export const db = (app ? getFirestore(app) : null) as Firestore;
