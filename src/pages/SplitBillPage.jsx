import React, { useState, useEffect } from "react";
import styles from "./SplitBillPage.module.css";
import {
  FaUtensils,
  FaCar,
  FaFilm,
  FaShoppingBag,
  FaLightbulb,
  FaBox,
  FaMoneyBillWave,
  FaSearch,
  FaEllipsisH,
} from "react-icons/fa";

import { fetchAllUsers } from "../services/userService";
import { createSplitBill } from "../services/splitBillService";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Modal from "../components/Modal";

const CATEGORIES = [
  { name: "Food", icon: <FaUtensils /> },
  { name: "Transport", icon: <FaCar /> },
  { name: "Fun", icon: <FaFilm /> },
  { name: "Shopping", icon: <FaShoppingBag /> },
  { name: "Utilities", icon: <FaLightbulb /> },
  { name: "Other", icon: <FaBox /> },
];

const SplitBillPage = () => {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // FORM
  const [billName, setBillName] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalAmountRaw, setTotalAmountRaw] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Fun");
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);

  // NEW: manual shares untuk setiap user termasuk diri sendiri
  const [shares, setShares] = useState({});
  const [isCreating, setIsCreating] = useState(false);

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFriend = (id) => {
    setSelectedFriendIds((prev) => {
      let updated;

      if (prev.includes(id)) {
        updated = prev.filter((i) => i !== id);
      } else {
        updated = [...prev, id];
      }

      // update shares ketika friend dihapus / ditambah
      setShares((prevShares) => {
        const newShares = { ...prevShares };
        if (!updated.includes(id)) delete newShares[id]; // remove if unselected
        if (updated.includes(id) && !newShares[id]) newShares[id] = 0; // add with 0
        return newShares;
      });

      return updated;
    });
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatRupiahInput = (value) => {
    if (!value) return "";
    const n = Number(value);
    if (Number.isNaN(n)) return "";
    return "Rp " + n.toLocaleString("id-ID");
  };

  const handleShareChange = (uid, value) => {
    const num = Number(value.replace(/\D/g, "")) || 0;
    setShares((prev) => ({ ...prev, [uid]: num }));
  };

  // Submit: persist split bill to Realtime Database
  const handleCreateBill = async () => {
    const totalShare = Object.values(shares).reduce((a, b) => a + b, 0);

    if (totalShare !== totalAmount) {
      // show modal error instead of alert
      setModalType("error");
      setModalTitle("Validation Error");
      setModalMessage(
        `Total share (${formatRupiah(totalShare)}) must equal total amount (${formatRupiah(totalAmount)})`
      );
      setModalOpen(true);
      return;
    }

    const billData = {
      billName,
      totalAmount,
      category: selectedCategory,
      shares,
      participants: Object.keys(shares),
      createdBy: currentUser ? currentUser.uid : null,
    };

    setIsCreating(true);
    try {
      const created = await createSplitBill(billData);
      console.log("Split bill created:", created);

      // reset form (keep current user as default share)
      setBillName("");
      setTotalAmount(0);
      setTotalAmountRaw("");
      if (currentUser) setShares({ [currentUser.uid]: 0 });
      else setShares({});
      setSelectedFriendIds([]);

      // success modal
      setModalType("success");
      setModalTitle("Split Bill Created");
      setModalMessage(`Split bill created successfully.`);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      setModalType("error");
      setModalTitle("Create Failed");
      setModalMessage(err.message || "Failed to create split bill");
      setModalOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  // compute sum of shares for UI/validation
  const totalShare = Object.values(shares).reduce((a, b) => a + b, 0);

  // AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setShares({ [user.uid]: 0 }); // add self with initial share
      }
    });
    return () => unsubscribe();
  }, []);

  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState("info");
  const [modalTitle, setModalTitle] = React.useState("");
  const [modalMessage, setModalMessage] = React.useState("");

  useEffect(() => {
    if (!currentUser) return;

    const loadUsers = async () => {
      try {
        const users = await fetchAllUsers();

        const filtered = users.filter(
          (u) => (u.uid || u.id) !== currentUser.uid
        );

        const mappedUsers = filtered.map((u) => ({
          id: u.uid || u.id,
          name: u.fullname || u.name || "Unknown User",
          noRekening: u.noRekening || "-",
          avatar:
            u.profilePic ||
            `https://ui-avatars.com/api/?name=${u.fullname || u.name}&background=random`,
        }));

        setFriends(mappedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    loadUsers();
  }, [currentUser]);

  return (
    <div className={styles.splitBillPage}>
      <h1>Split Bill</h1>
      {/* BILL INFO */}
      <div className={styles.splitBillContainer}>
        <h2 className={styles.sectionTitle}><FaMoneyBillWave /> Bill Information</h2>

        <div className={styles.formGroup}>
          <label className={styles.inputLabel}>Bill Name</label>
          <input
            type="text"
            className={styles.inputField}
            placeholder="e.g., Dinner at Pizza Hut"
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.inputLabel}>Total Amount (Rp)</label>
          <input
            type="text"
            className={styles.inputField}
            value={formatRupiahInput(totalAmountRaw)}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/\D/g, "");
              setTotalAmountRaw(numericValue);
              setTotalAmount(Number(numericValue) || 0);
            }}
          />
        </div>

        <label className={styles.inputLabel}>Category</label>
        <div className={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className={`${styles.categoryItem} ${
                selectedCategory === cat.name ? styles.categoryActive : ""
              }`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              <div className={styles.categoryIcon}>{cat.icon}</div>
              <p className={styles.categoryName}>{cat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FRIEND SELECT */}
      <div className={styles.splitBillContainer}>
        <h2 className={styles.sectionTitle}>👥 Select Friends</h2>

        <div className={styles.formGroup}>
          <div className={styles.searchWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.inputField}
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.recipientList}>
          {(search ? filteredFriends : filteredFriends.slice(0, 3)).map((friend) => {
            const checkboxId = `friend-${friend.id}`;
            return (
              <label
                key={friend.id}
                htmlFor={checkboxId}
                className={`${styles.recipientItem} ${
                  selectedFriendIds.includes(friend.id) ? styles.active : ""
                }`}
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={selectedFriendIds.includes(friend.id)}
                  onChange={() => toggleFriend(friend.id)}
                  className={styles.checkBox}
                />

                <img src={friend.avatar} alt={friend.name} className={styles.avatarLarge} />

                <div className={styles.recipientInfo}>
                  <p className={styles.recipientName}>{friend.name}</p>
                  <p className={styles.recipientId}>{friend.noRekening}</p>
                </div>
              </label>
            );
          })}

          {!search && filteredFriends.length > 3 && (
            <div className={styles.recipientMore}>
              <FaEllipsisH size={18} />
              <span className={styles.moreText}>
                +{filteredFriends.length - 3} more
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY + SHARE INPUTS */}
      <div className={styles.summaryGrid}>
        {/* LEFT: Submit */}
        <div className={styles.yourSharePanel}>
          <h3 className={styles.summaryTitle}>Summary</h3>

          <p>Total Amount: {formatRupiah(totalAmount)}</p>
          <p>Participants: {Object.keys(shares).length} people</p>

          <button className={styles.createBillButton} onClick={handleCreateBill}>
            {isCreating ? "Creating..." : "Create Split Bill"}
          </button>
        </div>

        {/* RIGHT: Each Person's Share */}
        <div className={styles.selectedFriendsPanel}>
          <h3 className={styles.summaryTitle}>Set Each Person's Share</h3>

          <p className={styles.helperText}>
            Sum of shares: {formatRupiah(totalShare)} / Total: {formatRupiah(totalAmount)}
          </p>
          {totalShare !== totalAmount && (
            <p className={styles.shareWarning}>Sum of shares must equal total amount.</p>
          )}

          {/* SELF */}
          {currentUser && (
            <div className={styles.selectedFriendItem}>
              <div>
                <p className={styles.friendName}>You</p>
              </div>

              <input
                type="text"
                className={`${styles.inputField} ${styles.shareInput}`}
                placeholder="Rp 0"
                value={formatRupiahInput(shares[currentUser.uid] || "")}
                onChange={(e) =>
                  handleShareChange(currentUser.uid, e.target.value)
                }
              />
            </div>
          )}

          {/* SELECTED FRIENDS */}
          {friends
            .filter((f) => selectedFriendIds.includes(f.id))
            .map((friend) => (
              <div key={friend.id} className={styles.selectedFriendItem}>
                <div>
                  <p className={styles.friendName}>{friend.name}</p>
                  <p className={styles.friendID}>{friend.noRekening}</p>
                </div>

                  <input
                    type="text"
                    className={`${styles.inputField} ${styles.shareInput}`}
                    placeholder="Rp 0"
                    value={formatRupiahInput(shares[friend.id] || "")}
                    onChange={(e) =>
                      handleShareChange(friend.id, e.target.value)
                    }
                  />
              </div>
            ))}
        </div>
      </div>
      <Modal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        type={modalType === "error" ? "danger" : modalType === "success" ? "success" : "info"}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default SplitBillPage;
