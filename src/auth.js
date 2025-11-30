// src/auth.js
// ---------------------------------------------
// Small helper/wrapper functions for Firebase Auth
// ---------------------------------------------
// This keeps authentication logic out of components
// and makes it easier to reuse and test.


import { auth } from "./firebase";
import {
 createUserWithEmailAndPassword,
 signInWithEmailAndPassword,
 GoogleAuthProvider,
 signInWithPopup,
 sendPasswordResetEmail,
 updatePassword,
 sendEmailVerification,
} from "firebase/auth";


// Create a user with email & password (Sign Up)
export const doCreateUserWithEmailAndPassword = async (email, password) => {
 return createUserWithEmailAndPassword(auth, email, password);
};


// Sign in an existing user with email & password (Login)
export const doSignInUserWithEmailAndPassword = async (email, password) => {
 return signInWithEmailAndPassword(auth, email, password);
};


// Sign in with Google using a popup
export const doSignInWithGoogle = async () => {
 const provider = new GoogleAuthProvider();
 const result = await signInWithPopup(auth, provider);
 return result;
};


// Sign out the currently logged-in user
export const doSignOut = async () => {
 return auth.signOut();
};


// Send a password reset email to the given address
export const doPasswordReset = async (email) => {
 return sendPasswordResetEmail(auth, email);
};


// Change the password of the currently logged-in user
export const doPasswordChange = async (password) => {
 return updatePassword(auth.currentUser, password);
};


// Send an email verification to the currently logged-in user Firebase will redirect back to your app
export const doSendEmailVerification = async () => {
 return sendEmailVerification(auth.currentUser, {
   url: `${window.location.origin}/`,
 });
};
