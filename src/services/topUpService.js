// services/topupService.js
import { db } from "../firebase";
import { ref, get } from "firebase/database";

/**
 * Fetch semua top up milik user tertentu
 */
export const fetchAllTopupsForUser = async (userId) => {
  try {
    const topupRef = ref(db, "topup");
    const snapshot = await get(topupRef);
    if (!snapshot.exists()) return [];

    const data = [];
    snapshot.forEach((childSnap) => {
      const val = childSnap.val();
      if (val.userId === userId) {
        data.push({
          key: childSnap.key,
          ...val,
        });
      }
    });

    // urutkan descending berdasarkan createdAt
    data.sort((a, b) => b.createdAt - a.createdAt);

    return data; // jangan slice di service, biar fleksibel di frontend
  } catch (err) {
    console.error("Gagal fetch semua top up:", err);
    return [];
  }
};
