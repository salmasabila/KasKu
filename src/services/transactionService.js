// services/transactionService.js
import { db } from "../firebase";
import { ref, push, update, get } from "firebase/database";

/**
 * Fetch semua transaksi untuk user tertentu (baik pengirim atau penerima)
 */
export const fetchAllTransactionsForUser = async (userId) => {
  try {
    const transactionsRef = ref(db, "transactions");
    const snapshot = await get(transactionsRef);
    if (!snapshot.exists()) return [];

    const data = [];
    snapshot.forEach((childSnap) => {
      const val = childSnap.val();
      if (val.userId === userId || val.recipientId === userId) {
        data.push({
          key: childSnap.key,
          ...val,
        });
      }
    });

    // urutkan descending berdasarkan createdAt
    data.sort((a, b) => b.createdAt - a.createdAt);

    return data; // jangan slice di service
  } catch (err) {
    console.error("Gagal fetch semua transaksi:", err);
    return [];
  }
};
