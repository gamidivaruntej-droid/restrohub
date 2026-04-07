// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDELo4_b9C0nm3trViCjsbBR4aaKWKcVEc",
    authDomain: "restrohub-4be5c.firebaseapp.com",
    projectId: "restrohub-4be5c",
    storageBucket: "restrohub-4be5c.firebasestorage.app",
    messagingSenderId: "689295711645",
    appId: "1:689295711645:web:a3590c2bcfa271ddbb2374",
    measurementId: "G-Y3G6NWV3E1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
