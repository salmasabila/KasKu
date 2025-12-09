// src/App.jsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Header from "./components/Header";
import StudentDashboard from "./pages/StudentDashboard";
import TransferPage from "./pages/TransferPage";
import SplitBillPage from "./pages/SplitBillPage";
import TopUpPage from "./pages/TopUpPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import KasKuAuth from "./pages/KasKuAuth";

import "./index.css";

// ✅ COMPONENT WRAPPER AGAR BISA PAKAI useLocation
function AppContent() {
  const location = useLocation();

  // ✅ DAFTAR PATH YANG TIDAK BOLEH ADA HEADER
  const hideHeaderPaths = ["/auth"];

  const isHideHeader = hideHeaderPaths.includes(location.pathname);

  return (
    <div className="app-container">
      {/* ✅ HEADER HANYA MUNCUL JIKA BUKAN DI AUTH */}
      {!isHideHeader && <Header />}

      <main className="app-main-content">
        <Routes>
          {/* ✅ ROOT HANYA REDIRECT, BUKAN RENDER LANGSUNG */}
          <Route path="/" element={<Navigate to="/auth" replace />} />

          {/* ✅ AUTH SATU-SATUNYA TEMPAT KasKuAuth */}
          <Route path="/auth" element={<KasKuAuth />} />

          {/* ✅ HALAMAN SETELAH LOGIN */}
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/split-bill" element={<SplitBillPage />} />
          <Route path="/top-up" element={<TopUpPage />} />
          <Route path="/history" element={<TransactionHistoryPage />} />
          <Route path="/activity/:type/:id" element={<ActivityDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
