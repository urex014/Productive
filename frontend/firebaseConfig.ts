// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth, GoogleAuthProvider, signInWithCredential} from 'firebase/auth'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD5BvswCCL3ZkQdDrXSg67YMoaFBdedwRU",
  authDomain: "auth-edb30.firebaseapp.com",
  projectId: "auth-edb30",
  storageBucket: "auth-edb30.firebasestorage.app",
  messagingSenderId: "533827589195",
  appId: "1:533827589195:web:c754f26e3c58b33a21e9ce",
  measurementId: "G-KYT36XGQPY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export {GoogleAuthProvider, signInWithCredential};