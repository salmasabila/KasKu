import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, } from "firebase/auth";
import { auth } from "../firebase";

// ✅ LOGIN
export const loginUser = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// ✅ REGISTER
export const registerUser = async (email, password) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

// ✅ LOGOUT
export const logoutUser = async () => {
  return await signOut(auth);
};
