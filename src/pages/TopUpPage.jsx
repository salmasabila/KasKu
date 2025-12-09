// src/pages/TopUpPage.jsx
import React, { useEffect, useState } from "react";
import styles from "./TopUpPage.module.css";
import { FaShieldAlt, FaArrowRight } from "react-icons/fa";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { fetchAllTopupsForUser } from "../services/topUpService";

const BACKEND_URL = "https://kasku-be.vercel.app";

const TopUpPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentTopups, setRecentTopups] = useState([]);
  const [userNames, setUserNames] = useState({}); // mapping uid -> nama

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fungsi fetch nama user dari uid
  const fetchUserNameByUid = async (uid) => {
    try {
      const res = await fetch(`${BACKEND_URL}/users/${uid}`); // pastikan endpoint ada di backend
      if (!res.ok) throw new Error("Gagal fetch nama user");
      const data = await res.json();
      return data.name || "Guest";
    } catch (err) {
      console.error(err);
      return "Guest";
    }
  };

  // Load recent topups + mapping nama user
  useEffect(() => {
    if (!currentUser) return;

    const loadTopups = async () => {
      const data = await fetchAllTopupsForUser(currentUser.uid);
      setRecentTopups(data.slice(0, 3));

      const namesMap = {};
      for (const tx of data) {
        if (!namesMap[tx.userId]) {
          namesMap[tx.userId] = await fetchUserNameByUid(tx.userId);
        }
      }
      setUserNames(namesMap);
    };

    loadTopups();
  }, [currentUser]);

  // Midtrans Snap Script
  useEffect(() => {
    if (document.getElementById("midtrans-script")) return;
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    );
    script.id = "midtrans-script";
    document.body.appendChild(script);
  }, []);

  const formatRupiah = (value) => {
    if (!value) return "";
    return "Rp " + Number(value).toLocaleString("id-ID");
  };

  const addAmount = (value) => {
    const newAmount = (Number(amount) || 0) + value;
    setAmount(newAmount);
    setAmountRaw(String(newAmount));
  };

  const handleTopUp = async () => {
    if (!currentUser) return alert("User belum login");
    if (!amount || Number(amount) < 10000)
      return alert("Minimal top up Rp 10.000");

    setIsLoading(true);

    try {
      const orderId = `TOPUP-${Date.now()}`;
      const response = await fetch(`${BACKEND_URL}/create-topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: Number(amount),
          customer_name: currentUser.displayName || "User",
          userId: currentUser.uid,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal koneksi server");
      if (!window.snap || !data.token) throw new Error("Snap tidak tersedia");

      window.snap.pay(data.token, {
        onSuccess: () => {
          alert(
            `Top Up berhasil! Saldo baru: Rp ${Number(
              data.newBalance
            ).toLocaleString("id-ID")}`
          );
          setAmount("");
          setAmountRaw("");
          setRecentTopups((prev) => [
            {
              key: data.transactionKey,
              amount,
              createdAt: Date.now(),
              status: "success",
              userId: currentUser.uid,
            },
            ...prev.slice(0, 2),
          ]);
        },
        onPending: () => {
          alert(
            `Top Up pending, tunggu konfirmasi. Saldo baru: Rp ${Number(
              data.newBalance
            ).toLocaleString("id-ID")}`
          );
          setAmount("");
          setAmountRaw("");
        },
        onError: (err) => alert("Top Up gagal: " + err),
        onClose: () => console.log("User menutup Snap"),
      });
    } catch (err) {
      console.error("Top up error:", err);
      alert("Gagal top up: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.dashboardPage}>
      <h1>Top Up Dana</h1>
      <div className={styles.mainGrid}>
        {/* LEFT FORM */}
        <div className={styles.transferMainCard}>
          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Jumlah Top Up</label>
            <input
              type="text"
              className={styles.inputField}
              value={formatRupiah(amountRaw)}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, "");
                setAmountRaw(numericValue);
                setAmount(numericValue);
              }}
              placeholder="Masukkan jumlah top up"
            />
            <div className={styles.quickAmountBox}>
              <button onClick={() => addAmount(50000)}>+ 50rb</button>
              <button onClick={() => addAmount(100000)}>+ 100rb</button>
              <button onClick={() => addAmount(500000)}>+ 500rb</button>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              className={styles.payButton}
              onClick={handleTopUp}
              disabled={isLoading || !amount || Number(amount) === 0}
            >
              {isLoading ? "Memproses..." : "Lanjutkan Top Up"}{" "}
              <FaArrowRight style={{ marginLeft: "6px" }} />
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div>
          <div className={styles.secureBadge}>
            <FaShieldAlt size={24} color="#1d4ed8" />
            <div>
              <h4 className={styles.secureTitle}>Transaksi Aman</h4>
              <p className={styles.secureText}>
                Top up Anda dilindungi enkripsi standar bank.
              </p>
            </div>
          </div>

          <div className={styles.historyCard}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h4 style={{ margin: 0, fontSize: "16px" }}>Transfer Terbaru</h4>
              <a href="/history" className={styles.viewAllLink}>
                Lihat Semua
              </a>
            </div>
            {recentTopups.length === 0 && (
              <p className={styles.noHistory}>Belum ada top up</p>
            )}
            {recentTopups.map((item) => (
              <div key={item.key} className={styles.historyItem}>
                <div className={styles.historyLeft}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {" "}
                    💰{" "}
                  </div>
                  <div className={styles.historyText}>
                    <p className={styles.historyAmount}>
                      {formatRupiah(item.amount)}
                    </p>
                    <p className={styles.historyDate}>
                      {new Date(item.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
                <div className={styles.historyRight}>
                  <span className={styles.statusBadge}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpPage;
