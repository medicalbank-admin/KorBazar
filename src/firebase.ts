import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBe3nY5-DQwqzmtaqjQ7FfYyQ-TnIld_PU",
  authDomain: "korbazar-cd6a9.firebaseapp.com",
  projectId: "korbazar-cd6a9",
  storageBucket: "korbazar-cd6a9.firebasestorage.app",
  messagingSenderId: "703514108271",
  appId: "1:703514108271:web:b6f974da284ee1c9b8089a",
  measurementId: "G-1BEPWHKHZQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
