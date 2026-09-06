import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// MASUKKAN KONFIGURASI ANDA SENDIRI DI BAWAH INI
const firebaseConfig = {
  apiKey: "AIzaSyBEi9k8cT_wHY5wsWJNR5EFMAlk-5nGj7g",
  authDomain: "silsilah-fam-tegal.firebaseapp.com",
  projectId: "silsilah-fam-tegal",
  storageBucket: "silsilah-fam-tegal.firebasestorage.app",
  messagingSenderId: "315307463093",
  appId: "1:315307463093:web:d37567894c07a9e20c49fc",
  measurementId: "G-SBWDKMQK9Y"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
