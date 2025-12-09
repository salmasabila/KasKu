// src/components/Header.jsx
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Header.module.css";
import profileImage from "../assets/profile.jpg";
import { getUser } from "../services/userService"; // ✅ AMBIL USER DARI DB
import { auth } from "../firebase";

function Header() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  // ✅ Ambil data user dari database
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser({ name: "Guest User" });
        return;
      }

      try {
        const u = await getUser(firebaseUser.uid);
        setUser(u);
      } catch (error) {
        console.log("Gagal ambil user:", error);
        setUser({ name: "Guest User" });
      }
    });

    return () => unsubscribe();
  }, []);

  // Fungsi helper untuk menentukan apakah link sedang aktif
  const isActive = (path) => (location.pathname === path ? styles.active : "");

  return (
    <header className={styles.header}>
      <div className={styles.navGroup}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🟦</span> KasKu
        </div>

        <nav className={styles.navbarNav}>
          <Link
            to="/dashboard"
            className={`${styles.navLink} ${isActive("/dashboard")}`}
          >
            Dashboard
          </Link>
          <Link
            to="/transfer"
            className={`${styles.navLink} ${isActive("/transfer")}`}
          >
            Transfer
          </Link>
          <Link
            to="/split-bill"
            className={`${styles.navLink} ${isActive("/split-bill")}`}
          >
            Split Bill
          </Link>
          <Link
            to="/top-up"
            className={`${styles.navLink} ${isActive("/top-up")}`}
          >
            Top Up
          </Link>
        </nav>
      </div>

      {/* ✅ PROFILE DINAMIS DARI DATABASE */}
      <div className={styles.profile}>
        <img src={`https://ui-avatars.com/api/?name=${user ? user.name : "Guest"}&background=random&color=fff`} alt="Avatar" className={styles.avatar} />
        <div className={styles.profileInfo}>
          <p className={styles.profileName}>
            {user ? user.name : "Loading..."}
          </p>
          {user?.noRekening && <p className={styles.profileNim}>{user.noRekening}</p>}
        </div>
      </div>
    </header>
  );
}

export default Header;
