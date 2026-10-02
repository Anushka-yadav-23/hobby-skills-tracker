import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB-RhVsWWQwrsrHlboLv7sA_NH17F478a4",
  authDomain: "hobby-skills-tracker-8a55c.firebaseapp.com",
  projectId: "hobby-skills-tracker-8a55c",
  storageBucket: "hobby-skills-tracker-8a55c.firebasestorage.app",
  messagingSenderId: "955531006257",
  appId: "1:955531006257:web:8db39e0361df026bca2010",
  measurementId: "G-3XDRJP8XTW"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;