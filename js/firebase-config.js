/**
 * Firebase Configurator & Initialization Module
 * 
 * To activate the Firebase backend and Google Sign-in services:
 * 1. Create a Firebase project at console.firebase.google.com
 * 2. Enable Authentication (Email/Password & Google) and Firestore Database
 * 3. Replace the placeholder config below with your Firebase web app settings
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if Firebase configuration keys are customized
const isFirebaseCustomized = 
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.startsWith("YOUR_");

if (isFirebaseCustomized) {
  try {
    firebase.initializeApp(firebaseConfig);
    
    // Enable offline persistence for Firestore if possible
    firebase.firestore().enablePersistence().catch((err) => {
      console.warn("Firestore persistence initialization failed:", err.code);
    });

    window.firebaseActive = true;
    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();
    window.googleProvider = new firebase.auth.GoogleAuthProvider();
    
    console.log("👑 Shree Rajput Sagai Sambandh: Firebase backend initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    window.firebaseActive = false;
  }
} else {
  window.firebaseActive = false;
  console.warn(
    "⚠️ Shree Rajput Sagai Sambandh: Firebase is not configured. Running in LocalStorage Mock mode.\n" +
    "To enable Firebase, customize the keys in 'js/firebase-config.js'."
  );
}
