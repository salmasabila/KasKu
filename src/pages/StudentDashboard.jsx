import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import historyStyles from "./TransactionHistory.module.css";
import { getUser } from "../services/userService";
import { Link } from "react-router-dom";
import { fetchRecentActivities } from "../services/dashboardService";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activities, setActivities] = useState([]);

  const TransactionItem = ({ store, date, amount, type }) => (
    <div className={styles.transactionItem}>
      <div>
        <p className={styles.transactionStore}>{store}</p>
        <p className={styles.transactionDate}>{date}</p>
      </div>

      <p className={`${styles.transactionAmount} ${type === "out" ? styles.amountOut : styles.amountIn}`}>
        {type === "out" ? "-" : "+"}Rp {amount.toLocaleString("id-ID")}
      </p>
    </div>
  );

  // subscribe to auth and load user data + recent activities
  useEffect(() => {
    let unsub = () => {};
    unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      try {
        // Fetch user data from database
        const userData = await getUser(u.uid);
        setUser(userData);
        
        // Fetch recent activities
        const acts = await fetchRecentActivities(u.uid, 5);
        setActivities(acts);
      } catch (e) {
        console.error("Failed loading user data or activities", e);
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className={styles.dashboardPage}>
      {/* GRID 2 KOLOM */}
      <div className={styles.mainGrid}>
        {/* ========================== */}
        {/* KOLOM KIRI           */}
        {/* ========================== */}
        <div>
          {/* CARD SALDO */}
          <div className={styles.balanceCard}>
            <div className={styles.balanceHeader}>
              <p className={styles.balanceTitle}>Your Balance</p>
              <span className={styles.balanceIcon}>💰</span>
            </div>

            <h1 className={styles.balanceAmount}>Rp {user?.balance?.toLocaleString("id-ID") || "0"}</h1>

            <div className={styles.balanceFooter}>
              <div>
                <p className={styles.balanceInfoLabel}>Account Name</p>
                <p className={styles.balanceInfoValue}>{user?.name || "Loading..."}</p>
              </div>
              <div>
                <p className={styles.balanceInfoLabel}>Member Since</p>
                <p className={styles.balanceInfoValue}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "-"}
                </p>
              </div>
            </div>
          </div>

            {/* RECENT ACTIVITY (gabungan transfer / split / topup) */}
            <div style={{ marginTop: 16 }}>
              <div className={historyStyles.historyControls} style={{ padding: 0 }}>
                <p className={styles.transactionTitle} style={{ margin: 0 }}>Recent Activity</p>
                <Link to="/history" className={styles.viewAllLink}>View All</Link>
              </div>

              <div className={historyStyles.historyListContainer}>
                {activities.length > 0 ? (
                  activities.map((act, i) => (
                    <div key={i} className={historyStyles.historyRow}>
                      <div className={historyStyles.historyLeft}>
                        <div className={`${historyStyles.historyIconWrapper} ${
                          act.type === 'topup' ? historyStyles.iconTopUp : act.type === 'split' ? historyStyles.iconSplit : historyStyles.iconTransfer
                        }`}>
                          {act.type === 'topup' ? '💳' : act.type === 'split' ? '👥' : '💸'}
                        </div>

                        <div className={historyStyles.historyMeta}>
                          <p className={historyStyles.historyTitle}>{act.title}</p>
                          <p className={historyStyles.historyDate}>{new Date(act.date).toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <p className={historyStyles.historyAmount} style={{ color: act.out ? '#ef4444' : '#10b981' }}>
                          {act.out ? '-' : '+'} Rp {Number(act.amount).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 20, color: '#9ca3af' }}>No recent activity.</div>
                )}
              </div>
            </div>
        </div>

        {/* ========================== */}
        {/* KOLOM KANAN         */}
        {/* ========================== */}
        <div className={styles.quickLinksPanel}>
          <Link to="/transfer" className={styles.quickActionCard}>
            <span className={styles.quickActionIcon}>💸</span>
            <div>
              <p className={styles.quickActionTitle}>Transfer</p>
              <p className={styles.quickActionSubtitle}>Send money</p>
            </div>
          </Link>

          <Link to="/split-bill" className={styles.quickActionCard}>
            <span className={styles.quickActionIcon}>👥</span>
            <div>
              <p className={styles.quickActionTitle}>Split Bill</p>
              <p className={styles.quickActionSubtitle}>Share expenses</p>
            </div>
          </Link>

          <Link to="/top-up" className={styles.quickActionCard}>
            <span className={styles.quickActionIcon}>➕</span>
            <div>
              <p className={styles.quickActionTitle}>Top Up</p>
              <p className={styles.quickActionSubtitle}>Add balance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;