import React, { useState } from "react";
import { Wallet, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { loginUser, registerUser } from "../services/authService";
import { createUserData } from "../services/userService";

import "./KasKuAuth.css";
import Modal from "../components/Modal";

const KasKuAuth = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState("welcome");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    noRekening: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      console.log("STATE:", updated);
      return updated;
    });
  };

  // ✅ LOGIN (BERSIH)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginUser(formData.email, formData.password);
      setModalType("success");
      setModalTitle("Login Successful");
      setModalMessage("You have logged in successfully.");
      setModalOpen(true);

      // navigate shortly after showing success message
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (error) {
      setModalType("error");
      setModalTitle("Login Failed");
      setModalMessage(error.message || "Login failed");
      setModalOpen(true);
    }
  };

  // ✅ REGISTER + DATABASE
  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setModalType("error");
      setModalTitle("Validation Error");
      setModalMessage("Password tidak cocok!");
      setModalOpen(true);
      return;
    }

    try {
      const res = await registerUser(formData.email, formData.password);
      const user = res.user;

      await createUserData(user.uid, {
        uid: user.uid,
        name: formData.name,
        noRekening: formData.noRekening,
        email: formData.email,
        balance: 0,
        createdAt: new Date().toISOString(),
      });

      setModalType("success");
      setModalTitle("Registration Successful");
      setModalMessage("Account created successfully. Redirecting...");
      setModalOpen(true);

      setTimeout(() => navigate("/dashboard"), 900);
    } catch (error) {
      setModalType("error");
      setModalTitle("Registration Failed");
      setModalMessage(error.message || "Registration failed");
      setModalOpen(true);
    }
  };

  // modal state for auth feedback
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // ======================
  // WELCOME
  // ======================
  if (currentScreen === "welcome") {
    return (
      <div className="auth-bg">
        <div className="auth-center">
          <div className="logo-box">
            <Wallet size={64} />
          </div>
          <h1>KasKu</h1>
          <p>Kelola keuangan Anda dengan mudah dan praktis</p>

          <div className="btn-group">
            <button
              className="btn-primary"
              onClick={() => setCurrentScreen("login")}
            >
              Masuk
            </button>
            <button
              className="btn-outline"
              onClick={() => setCurrentScreen("register")}
            >
              Daftar Sekarang
            </button>
          </div>
        </div>
        <Modal
          open={modalOpen}
          title={modalTitle}
          message={modalMessage}
          type={modalType === "error" ? "danger" : modalType}
          onClose={() => setModalOpen(false)}
        />
      </div>
    );
  }

  // ======================
  // LOGIN
  // ======================
  if (currentScreen === "login") {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <h2>Masuk</h2>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <Lock size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button className="btn-primary full" type="submit">
              Masuk
            </button>

            <p className="link">
              Belum punya akun?{" "}
              <span onClick={() => setCurrentScreen("register")}>Daftar</span>
            </p>
          </form>
        </div>
        <Modal
          open={modalOpen}
          title={modalTitle}
          message={modalMessage}
          type={modalType === "error" ? "danger" : modalType}
          onClose={() => setModalOpen(false)}
        />
      </div>
    );
  }

  // ======================
  // REGISTER
  // ======================
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h2>Daftar</h2>

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <User size={18} />
            <input
              type="text"
              name="name"
              placeholder="Nama"
              value={formData.name}
              onChange={handleInputChange}
              autoComplete="name"
            />
          </div>

          <div className="input-group">
            <User size={18} />
            <input
              type="text"
              name="noRekening"
              placeholder="No Rekening"
              value={formData.noRekening}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <Mail size={18} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <Lock size={18} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="input-group">
            <Lock size={18} />
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Konfirmasi Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button className="btn-primary full" type="submit">
            Daftar
          </button>

          <p className="link">
            Sudah punya akun?{" "}
            <span onClick={() => setCurrentScreen("login")}>Masuk</span>
          </p>
        </form>
      </div>
      <Modal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        type={modalType === "error" ? "danger" : modalType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default KasKuAuth;
