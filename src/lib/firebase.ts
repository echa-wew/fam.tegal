// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBEi9k8cT_wHY5wsWJNR5EFMAlk-5nGj7g",
  authDomain: "silsilah-fam-tegal.firebaseapp.com",
  projectId: "silsilah-fam-tegal",
  storageBucket: "silsilah-fam-tegal.firebasestorage.app",
  messagingSenderId: "315307463093",
  appId: "1:315307463093:web:d37567894c07a9e20c49fc",
  measurementId: "G-SBWDKMQK9Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
