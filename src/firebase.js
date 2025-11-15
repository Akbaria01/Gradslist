// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1A8-wcQfYgVH2xaUXi81qkA5y8wz9vqY",
  authDomain: "gradslist.firebaseapp.com",
  projectId: "gradslist",
  storageBucket: "gradslist.firebasestorage.app",
  messagingSenderId: "291069452618",
  appId: "1:291069452618:web:769ca1bb3daeab7829e1b3",
  measurementId: "G-TF55BC6TRN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Analytics only works in a browser environment. Protect against server-side/Node usage.
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
// Create a Firestore client bound to this `app` and export it for use across the app.
const db = getFirestore(app);

export { app, analytics, db };
