import { useState } from "react";
import { Navigate } from "react-router-dom";
import { doSignInUserWithEmailAndPassword, doSignInWithGoogle, doCreateUserWithEmailAndPassword} from "../auth";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import Modal from "../components/Modal"; 


export default function Login() {
 const { userLoggedIn } = useAuth();


 // Disable buttons while a request is ongoing
 const [isSubmitting, setIsSubmitting] = useState(false);


 // Login form state
 const [loginEmail, setLoginEmail] = useState("");
 const [loginPassword, setLoginPassword] = useState("");
 const [loginError, setLoginError] = useState("");


 // Signup form state
 const [signupUsername, setSignupUsername] = useState("");
 const [signupEmail, setSignupEmail] = useState("");
 const [signupPassword, setSignupPassword] = useState("");
 const [signupConfirm, setSignupConfirm] = useState("");
 const [signupError, setSignupError] = useState("");
 const [showSuccessModal, setShowSuccessModal] = useState(false);
 const [showSignupSuccessModal, setShowSignupSuccessModal] = useState(false);
 const [loginSuccess, setLoginSuccess] = useState(false);
 const [signupSuccess, setSignupSuccess] = useState(false);


 // Simple email validation pattern
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


 // If user is already logged in, redirect away from auth page
 if (userLoggedIn && !loginSuccess && !signupSuccess) {
   return <Navigate to="/" replace />;
 }




 // LOGIN WITH EMAIL/PASS


 const onLoginSubmit = async (e) => {
   e.preventDefault();
   if (isSubmitting) return;


   setLoginError("");


   // Basic validation: required fields
   if (!loginEmail || !loginPassword) {
     setLoginError("Please fill out both email and password.");
     return;
   }


   // Email format validation
   if (!emailRegex.test(loginEmail)) {
     setLoginError("Please enter a valid email address.");
     return;
   }


   setIsSubmitting(true);


   try {
     await doSignInUserWithEmailAndPassword(loginEmail, loginPassword);
     setLoginSuccess(true);
     setShowSuccessModal(true);
     setTimeout(() => {
       setLoginSuccess(false);
     }, 3000);
   } catch (err) {
     console.error(err);
     setLoginError("Invalid email or password.");
     setIsSubmitting(false);
   }
 };




 // LOGIN WITH GOOGLE


 const onGoogleSignIn = async (e) => {
   e.preventDefault();
   if (isSubmitting) return;


   setLoginError("");
   setIsSubmitting(true);


   try {
     // Sign in or sign up user with Google
     await doSignInWithGoogle();


     // Get the signed-in user
     const googleUser = auth.currentUser;


     if (googleUser) {
       // Check if Firestore user profile already exists
       const docRef = doc(db, "users", googleUser.uid);
       const docSnap = await getDoc(docRef);


       // If this Google user is NEW → create Firestore doc
       if (!docSnap.exists()) {
         await setDoc(docRef, {
           uid: googleUser.uid,
           username: googleUser.displayName || "Google User",
           email: googleUser.email,
           createdAt: serverTimestamp(),
         });
       }
     }


     setLoginSuccess(true);
     setShowSuccessModal(true);
     setTimeout(() => {
       setLoginSuccess(false);
     }, 3000);
   } catch (err) {
     console.error(err);
     setLoginError("Failed to sign in with Google.");
     setIsSubmitting(false);
   }
 };




 // SIGNUP HANDLER


 const onSignupSubmit = async (e) => {
   e.preventDefault();
   if (isSubmitting) return;


   setSignupError("");


   // Required field validation
   if (!signupUsername || !signupEmail || !signupPassword || !signupConfirm) {
     setSignupError("Please fill out all fields.");
     return;
   }


   // Email format validation
   if (!emailRegex.test(signupEmail)) {
     setSignupError("Please enter a valid email address.");
     return;
   }


   // Check password match
   if (signupPassword !== signupConfirm) {
     setSignupError("Passwords do not match.");
     return;
   }


   setIsSubmitting(true);
   setSignupSuccess(true);
   setShowSignupSuccessModal(true);

   try {
     // Create the Firebase user
     const userCredential = await doCreateUserWithEmailAndPassword(
       signupEmail,
       signupPassword
     );


     // If user was created, update their displayName with username
     if (userCredential?.user) {
       await updateProfile(userCredential.user, {
         displayName: signupUsername,
       });


       // Create Firestore user document
       await setDoc(doc(db, "users", userCredential.user.uid), {
         uid: userCredential.user.uid,
         username: signupUsername,
         email: signupEmail,
         createdAt: serverTimestamp(),
       });
     }

     setTimeout(() => {
       setSignupSuccess(false);
     }, 3000);
   } catch (err) {
     console.error(err);
     setSignupError("Unable to create account.");
     setIsSubmitting(false);
   }
 };




 return (
   <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] py-10 px-4">
     <Modal 
       message="Login Successful" 
       isVisible={showSuccessModal} 
       onClose={() => setShowSuccessModal(false)} 
     />
     <Modal 
       message="Sign Up Successful" 
       isVisible={showSignupSuccessModal} 
       onClose={() => setShowSignupSuccessModal(false)} 
     />
     {/* Wrapper for both cards */}
     <div className="flex flex-col md:flex-row justify-center gap-8 w-full max-w-5xl">
        {/* SIGN IN CARD */}
       <div className="flex-1 p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-md">
         <h1 className="text-slate-900 text-center text-3xl font-semibold">
           Login
         </h1>
          {loginError && (
           <p className="mt-4 text-sm text-red-600 text-center">{loginError}</p>
         )}
          <form onSubmit={onLoginSubmit} noValidate className="mt-8 space-y-6">
           {/* Email */}
           <div>
             <label className="text-slate-900 text-sm font-medium mb-2 block">
               Email
             </label>
             <input
               name="email"
               type="email"
               value={loginEmail}
               onChange={(e) => setLoginEmail(e.target.value)}
               className="w-full text-sm border border-slate-300 px-4 py-3 rounded-md"
               placeholder="Enter your email"
             />
           </div>
            {/* Password */}
           <div>
             <label className="text-slate-900 text-sm font-medium mb-2 block">
               Password
             </label>
             <input
               name="password"
               type="password"
               value={loginPassword}
               onChange={(e) => setLoginPassword(e.target.value)}
               className="w-full text-sm border border-slate-300 px-4 py-3 rounded-md"
               placeholder="Enter password"
             />
           </div>
            {/* Login Button */}
           <div className="!mt-8">
             <button
               type="submit"
               disabled={isSubmitting}
               className="w-full py-2 px-4 text-[15px] font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
             >
               {isSubmitting ? "Logging in..." : "Login"}
             </button>
           </div>
            {/* Divider */}
           <div className="flex items-center justify-evenly w-full mt-6">
             <span className="bg-gray-300 h-px flex-grow"></span>
             <span className="px-4 text-sm font-semibold uppercase">or</span>
             <span className="bg-gray-300 h-px flex-grow"></span>
           </div>
            {/* Google Sign-In */}
           <div className="mt-6 w-full flex flex-col items-center">
             <button
               type="button"
               onClick={onGoogleSignIn}
               disabled={isSubmitting}
               className="w-full flex items-center justify-center gap-3 py-2 px-4 text-[15px] font-medium rounded-md text-gray-800 bg-white border border-gray-800 shadow-sm hover:bg-gray-100 disabled:opacity-60"
             >
               <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                 <g fill="none">
                   <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.43 2.14 30.14 0 24 0 14.66 0 6.41 5.28 2.62 13.6l7.9 6.06C12.34 13.9 17.74 9.5 24 9.5z" />
                   <path fill="#34A853" d="M24 47.5c5.74 0 11.08-1.97 15.18-5.85l-7.52-5.8c-2.17 1.46-5.04 2.3-7.66 2.3-6.23 0-11.47-4.06-13.24-9.57l-7.9 6.07C6.44 42.16 14.41 47.5 24 47.5z" />
                   <path fill="#FBBC05" d="M10.53 28.35A14.46 14.46 0 0 1 9.83 24c0-1.52.25-2.98.7-4.36l-7.91-6.05A23.69 23.69 0 0 0 .21 24c0 3.74.87 7.27 2.4 10.39l7.92-6.04z" />
                   <path fill="#4285F4" d="M46.15 24c0-1.39-.2-2.87-.53-4.27H24v9.07h12.61c-.63 3.1-2.35 5.48-4.79 7.03l7.52 5.8C43.34 37.61 46.15 31.65 46.15 24z" />
                 </g>
               </svg>
               <span>Continue with Google</span>
             </button>
           </div>
         </form>
       </div>
        {/* SIGN UP CARD (FIXED POSITION) */}
       <div className="flex-1 p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-md">
         <h1 className="text-slate-900 text-center text-3xl font-semibold">
           Sign Up
         </h1>
          {signupError && (
           <p className="mt-4 text-sm text-red-600 text-center">{signupError}</p>
         )}
          <form onSubmit={onSignupSubmit} noValidate className="mt-12 space-y-6">
           {/* Username */}
           <div>
             <label className="text-sm font-medium">Username</label>
             <input
               type="text"
               value={signupUsername}
               onChange={(e) => setSignupUsername(e.target.value)}
               className="w-full border border-slate-300 px-4 py-3 rounded-md"
               placeholder="Choose a username"
             />
           </div>
           <div>
             <label className="text-sm font-medium">Email</label>
             <input
               type="email"
               value={signupEmail}
               onChange={(e) => setSignupEmail(e.target.value)}
               className="w-full border border-slate-300 px-4 py-3 rounded-md"
               placeholder="Enter your email"
             />
           </div>
           <div>
             <label className="text-sm font-medium">Password</label>
             <input
               type="password"
               value={signupPassword}
               onChange={(e) => setSignupPassword(e.target.value)}
               className="w-full border border-slate-300 px-4 py-3 rounded-md"
               placeholder="Create password"
             />
           </div>
           <div>
             <label className="text-sm font-medium">Confirm password</label>
             <input
               type="password"
               value={signupConfirm}
               onChange={(e) => setSignupConfirm(e.target.value)}
               className="w-full border border-slate-300 px-4 py-3 rounded-md"
               placeholder="Confirm password"
             />
           </div>
           <div className="!mt-12">
             <button
               type="submit"
               disabled={isSubmitting}
               className="w-full py-2 px-4 text-[15px] font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
             >
               {isSubmitting ? "Creating account..." : "Sign Up"}
             </button>
           </div>
         </form>
       </div>
     </div>
   </div>
 );
}
