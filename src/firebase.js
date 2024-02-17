// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAkfPqydz3hX4q9FYJ5_5nkPiyzsjt9aGI",
  authDomain: "beauty-v1.firebaseapp.com",
  projectId: "beauty-v1",
  storageBucket: "beauty-v1.appspot.com",
  messagingSenderId: "350050598092",
  appId: "1:350050598092:web:97f9e05955abfc1f6ed669",
  measurementId: "G-KTG0HEVJNF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };