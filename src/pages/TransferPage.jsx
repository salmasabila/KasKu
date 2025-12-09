// src/pages/TransferPage.jsx
import React, { useEffect, useState } from "react";
import styles from "./TransferPage.module.css";
import { FaSearch, FaShieldAlt, FaArrowRight } from "react-icons/fa";
import { fetchAllUsers } from "../services/userService";
import { fetchAllTransactionsForUser } from "../services/transactionService";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "https://kasku-be.vercel.app";

const TransferPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [allTransfers, setAllTransfers] = useState([]);
  const navigate = useNavigate();

  // Pantau auth user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load users kecuali current user
  useEffect(() => {
    const loadUsers = async () => {
      if (!currentUser) return;
      try {
        const data = await fetchAllUsers();
        const filtered = data.filter((user) => user.uid !== currentUser.uid);
        setUsers(filtered);
      } catch (err) {
        console.error("Gagal ambil user:", err);
      }
    };
    loadUsers();
  }, [currentUser]);

  // Load all transactions
  useEffect(() => {
    if (!currentUser) return;
    const loadTransactions = async () => {
      const allTx = await fetchAllTransactionsForUser(currentUser.uid);
      setAllTransfers(allTx);
    };
    loadTransactions();
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

  const handleSelectRecipient = (user) => {
    setSelectedRecipient(user);
    setBankName("BCA");
    setAccountNumber(user.noRekening);
  };

  const addAmount = (value) => {
    const newAmount = (Number(amount) || 0) + value;
    setAmount(newAmount);
    setAmountRaw(String(newAmount));
  };

  const formatRupiah = (value) => {
    if (!value) return "";
    return "Rp " + Number(value).toLocaleString("id-ID");
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleTransfer = async () => {
    if (!currentUser) return alert("User belum login");
    if (!selectedRecipient) return alert("Pilih penerima!");
    if (!amount || Number(amount) < 10000)
      return alert("Minimal transfer Rp 10.000");

    setIsLoading(true);

    try {
      const orderId = `order-${Date.now()}`;
      const response = await fetch(`${BACKEND_URL}/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: Number(amount),
          customer_name: selectedRecipient.name,
          recipientId: selectedRecipient.uid,
          bank_name: bankName,
          account_number: accountNumber,
          notes,
          userId: currentUser.uid,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal koneksi server");
      if (!window.snap || !data.token) throw new Error("Snap tidak tersedia");

      window.snap.pay(data.token, {
        onSuccess: () => {
          alert(
            "Pembayaran berhasil, tunggu update status di database dari webhook."
          );
          resetForm();
        },
        onPending: () => {
          alert(
            "Pembayaran pending, tunggu update status di database dari webhook."
          );
          resetForm();
        },
        onError: (err) => alert("Transfer gagal: " + err),
        onClose: () => console.log("User menutup Snap"),
      });
    } catch (err) {
      alert("Gagal transaksi: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRecipient(null);
    setBankName("BCA");
    setAccountNumber("");
    setAmount("");
    setAmountRaw("");
    setNotes("");
  };

  // Hanya 3 terakhir untuk sidebar
  const recentTransfers = allTransfers.slice(0, 3);

  return (
    <div className={styles.dashboardPage}>
      <h1>Transfer Dana</h1>
      <div className={styles.mainGrid}>
        {/* LEFT FORM */}
        <div className={styles.transferMainCard}>
          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Penerima</label>
            <div className={styles.searchWrapper}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                className={styles.inputField}
                placeholder="Cari nama user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.recipientList}>
            {filteredUsers.slice(0, 3).map((user) => (
              <div
                key={user.uid}
                className={`${styles.recipientItem} ${
                  selectedRecipient?.uid === user.uid ? styles.active : ""
                }`}
                onClick={() => handleSelectRecipient(user)}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`}
                  alt={user.name}
                  className={styles.recipientAvatar}
                />
                <span className={styles.categoryName}>{user.name}</span>
              </div>
            ))}

            {/* +N more indicator when there are more than 3 results and not searching */}
            {!search && filteredUsers.length > 3 && (() => {
              const remaining = filteredUsers.length - 3;
              return (
                <div className={styles.recipientItem}>
                  <div
                    className={styles.recipientMoreAvatar}
                    title={`+${remaining} more`}
                  >
                    {remaining > 99 ? "+99" : `+${remaining}`}
                  </div>
                  <span className={styles.categoryName}>{remaining} more</span>
                </div>
              );
            })()}
          </div>

          <div className={styles.rowInputs}>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Bank</label>
              <select
                className={styles.inputField}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              >
                <option value="BCA">BCA</option>
                <option value="Mandiri">Mandiri</option>
                <option value="BNI">BNI</option>
                <option value="BRI">BRI</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>No Rekening</label>
              <input
                type="text"
                className={styles.inputField}
                value={accountNumber}
                readOnly
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Jumlah</label>
            <input
              type="text"
              className={styles.inputField}
              value={formatRupiah(amountRaw)}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, "");
                setAmountRaw(numericValue);
                setAmount(numericValue);
              }}
            />
            <div className={styles.quickAmountBox}>
              <button onClick={() => addAmount(50000)}>+ 50rb</button>
              <button onClick={() => addAmount(100000)}>+ 100rb</button>
              <button onClick={() => addAmount(500000)}>+ 500rb</button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Catatan</label>
            <textarea
              className={styles.inputField}
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className={styles.actionRow}>
            <button className={styles.cancelBtn} onClick={resetForm}>
              Batal
            </button>
            <button
              className={styles.payButton}
              onClick={handleTransfer}
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Lanjutkan"}{" "}
              <FaArrowRight style={{ marginLeft: "6px" }} />
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div>
          <div className={styles.secureBadge}>
            <FaShieldAlt size={24} color="#1d4ed8" />
            <div>
              <h4 style={{ margin: 0, fontSize: "14px" }}>Transfer Aman</h4>
              <p
                style={{
                  margin: "5px 0 0 0",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                Transaksi Anda dilindungi enkripsi standar bank.
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
            {recentTransfers.length === 0 && (
              <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                Belum ada transaksi
              </p>
            )}
            {recentTransfers.map((item) => (
              <div key={item.key} className={styles.historyItem}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${
                      item.userId === currentUser.uid
                        ? item.recipientName
                        : (() => {
                            const sender = users.find(
                              (u) => u.uid === item.userId
                            );
                            return sender ? sender.name : "Pengirim";
                          })()
                    }&background=random&color=fff`}
                    alt={item.recipientName}
                    className={styles.recentAvatar}
                  />

                  <div style={{ marginLeft: "8px" }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>
                      {item.userId === currentUser.uid
                        ? item.recipientName // POV pengirim
                        : (() => {
                            // POV penerima
                            const sender = users.find(
                              (u) => u.uid === item.userId
                            );
                            return sender ? sender.name : "Pengirim";
                          })()}
                    </p>

                    <p
                      style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}
                    >
                      {new Date(item.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: "14px",
                      color:
                        item.userId === currentUser.uid ? "#ef4444" : "#22c55e",
                    }}
                  >
                    {item.userId === currentUser.uid ? "-" : "+"} Rp{" "}
                    {Number(item.amount).toLocaleString("id-ID")}
                  </p>
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

export default TransferPage;
