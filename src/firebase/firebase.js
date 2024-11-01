// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZhKhfwqTEjDmWrZY2RTpo-nuE60AyMxg",
  authDomain: "forever-e972a.firebaseapp.com",
  projectId: "forever-e972a",
  storageBucket: "forever-e972a.appspot.com",
  messagingSenderId: "649572866380",
  appId: "1:649572866380:web:1238ba7fdeac6202d257e9",
  measurementId: "G-DV0LEWL6WV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, analytics ,auth};
