
import { db } from "../firebase";
import { ref, push, set, get } from "firebase/database";

/**
 * Create a new split bill entry under the Realtime Database root `split_bill`.
 * billData should include: billName, totalAmount, category, shares (object), participants (array), createdBy (uid), etc.
 * Returns the created record (with key and createdAt).
 */
export const createSplitBill = async (billData) => {
	try {
		const billsRef = ref(db, "splitBill");
		const newRef = push(billsRef);

		const payload = {
			...billData,
			createdAt: Date.now(),
		};

		await set(newRef, payload);

		return { key: newRef.key, ...payload };
	} catch (err) {
		console.error("Failed to create split bill:", err);
		throw err;
	}
};

/**
 * Fetch split bills related to a specific user.
 * Returns an array of bills where `createdBy === userId` OR `participants` includes userId.
 */
export const fetchSplitBillsForUser = async (userId) => {
	try {
		const billsRef = ref(db, "splitBill");
		const snapshot = await get(billsRef);
		if (!snapshot.exists()) return [];

		const data = [];
		snapshot.forEach((childSnap) => {
			const val = childSnap.val();
			const participants = val.participants || [];
			if (val.createdBy === userId || participants.includes(userId)) {
				data.push({ key: childSnap.key, ...val });
			}
		});

		// sort by createdAt desc
		data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

		return data;
	} catch (err) {
		console.error("Failed to fetch split bills for user:", err);
		return [];
	}
};
