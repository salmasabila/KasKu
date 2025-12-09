import { ref, set, get, update } from "firebase/database";
import { db } from "../firebase";

// ✅ SIMPAN USER BARU
export const createUserData = async (uid, data) => {
  return await set(ref(db, `users/${uid}`), data);
};

// ✅ AMBIL DATA USER
export const getUser = async (uid) => {
  const snapshot = await get(ref(db, `users/${uid}`));
  return snapshot.exists() ? snapshot.val() : null;
};

// ✅ UPDATE SALDO
export const updateUserBalance = async (uid, newBalance) => {
  return await update(ref(db, `users/${uid}`), {
    balance: newBalance,
  });
};

// ✅ AMBIL SEMUA USER
export const fetchAllUsers = async () => {
  const snapshot = await get(ref(db, "users"));

  if (!snapshot.exists()) return [];

  return Object.values(snapshot.val());
};
