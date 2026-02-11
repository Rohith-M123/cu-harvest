
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBKWgbFBg24guPee4AcXatYOs0EbEJP2ds",
    authDomain: "cu-harvest.firebaseapp.com",
    projectId: "cu-harvest",
    storageBucket: "cu-harvest.firebasestorage.app",
    messagingSenderId: "345597715076",
    appId: "1:345597715076:web:444720fb53d4442d4698d1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
