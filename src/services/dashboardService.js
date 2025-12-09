import { fetchAllTransactionsForUser } from "./transactionService";
import { fetchSplitBillsForUser } from "./splitBillService";
import { fetchAllTopupsForUser } from "./topUpService";

/**
 * Aggregate recent activities (transfer, split, topup) for a user.
 * Returns up to `limit` items sorted descending by createdAt/timestamp.
 * Each activity has shape: { type, date, amount, title, out }
 */
export const fetchRecentActivities = async (userId, limit = 5) => {
  try {
    const [txs, splits, topups] = await Promise.all([
      fetchAllTransactionsForUser(userId),
      fetchSplitBillsForUser(userId),
      fetchAllTopupsForUser(userId),
    ]);

    const mappedTx = (txs || []).map((t) => {
      const date = t.createdAt || t.timestamp || t.created_at || Date.now();
      const out = t.from === userId || t.userId === userId; // heuristic
      return {
        type: "transfer",
        date: Number(date),
        amount: Number(t.amount) || 0,
        title: t.store || t.note || (out ? "Sent" : "Received"),
        subtitle: t.recipientId ? `to ${t.recipientId}` : "",
        out,
        raw: t,
      };
    });

    const mappedSplits = (splits || []).map((s) => {
      const date = s.createdAt || s.created_at || Date.now();
      return {
        type: "split",
        date: Number(date),
        amount: Number(s.totalAmount) || 0,
        title: s.billName || "Split Bill",
        subtitle: `${(s.participants || []).length} participants`,
        out: true,
        status: s.status || 'Success',
        raw: s,
      };
    });

    const mappedTopups = (topups || []).map((t) => {
      const date = t.createdAt || t.created_at || Date.now();
      return {
        type: "topup",
        date: Number(date),
        amount: Number(t.amount) || 0,
        title: t.method || "Top Up",
        subtitle: t.note || "",
        out: false,
        raw: t,
      };
    });

    const all = [...mappedTx, ...mappedSplits, ...mappedTopups];

    all.sort((a, b) => (b.date || 0) - (a.date || 0));

    return all.slice(0, limit);
  } catch (err) {
    console.error("Failed to fetch recent activities:", err);
    return [];
  }
};

/**
 * Fetch all activities for a user (no limit). Returns array sorted by date desc.
 * Each activity has shape: { type, date, amount, title, subtitle, out, raw }
 */
export const fetchAllActivities = async (userId) => {
  try {
    const [txs, splits, topups] = await Promise.all([
      fetchAllTransactionsForUser(userId),
      fetchSplitBillsForUser(userId),
      fetchAllTopupsForUser(userId),
    ]);

    const mappedTx = (txs || []).map((t) => {
      const date = t.createdAt || t.timestamp || t.created_at || Date.now();
      const out = t.from === userId || t.userId === userId; // same heuristic as recent
      return {
        type: "transfer",
        date: Number(date),
        amount: Number(t.amount) || 0,
        title: t.store || t.note || (out ? "Sent" : "Received"),
        subtitle: t.recipientId ? `to ${t.recipientId}` : "",
        out,
        raw: t,
      };
    });

    const mappedSplits = (splits || []).map((s) => {
      const date = s.createdAt || s.created_at || Date.now();
      return {
        type: "split",
        date: Number(date),
        amount: Number(s.totalAmount) || 0,
        title: s.billName || "Split Bill",
        subtitle: `${(s.participants || []).length} participants`,
        out: true,
        status: s.status || 'Success',
        raw: s,
      };
    });

    const mappedTopups = (topups || []).map((t) => {
      const date = t.createdAt || t.created_at || Date.now();
      return {
        type: "topup",
        date: Number(date),
        amount: Number(t.amount) || 0,
        title: t.method || "Top Up",
        subtitle: t.note || "",
        out: false,
        raw: t,
      };
    });

    const all = [...mappedTx, ...mappedSplits, ...mappedTopups];
    all.sort((a, b) => (b.date || 0) - (a.date || 0));

    return all;
  } catch (err) {
    console.error("Failed to fetch all activities:", err);
    return [];
  }
};
