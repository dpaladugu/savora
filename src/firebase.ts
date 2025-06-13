// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8N8WUVhPJSW7U4zjQG1thpsyZLYDsiuA",
  authDomain: "savora-b5b46.firebaseapp.com",
  projectId: "savora-b5b46",
  storageBucket: "savora-b5b46.firebasestorage.app",
  messagingSenderId: "832923708237",
  appId: "1:832923708237:web:ea7aee033a056e70d82504"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
