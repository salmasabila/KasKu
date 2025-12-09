// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA271tHI7e8CvOZ6AwWk6VtEk_c6uUv3Jg",
  authDomain: "kasku-eca5e.firebaseapp.com",
  databaseURL: "https://kasku-eca5e-default-rtdb.firebaseio.com",
  projectId: "kasku-eca5e",
  storageBucket: "kasku-eca5e.firebasestorage.app",
  messagingSenderId: "81602994104",
  appId: "1:81602994104:web:cce9cca7a4760758f9f94d",
  measurementId: "G-CF3QQ69D9M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getDatabase(app);