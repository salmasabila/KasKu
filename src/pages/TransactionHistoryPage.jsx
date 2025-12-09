import React, { useState, useEffect } from 'react';
import styles from './TransactionHistory.module.css';
import { FaSearch, FaExchangeAlt, FaWallet, FaUserFriends, FaShoppingBag } from 'react-icons/fa';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchAllActivities } from '../services/dashboardService';
import { useNavigate } from 'react-router-dom';

const TransactionHistoryPage = () => {
  const [filter, setFilter] = useState('All'); // All, Top Up, Transfer, Split
  const [searchTerm, setSearchTerm] = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // load activities for current user using auth state subscriber
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      if (user && user.uid) {
        try {
          const items = await fetchAllActivities(user.uid);
          if (mounted) setActivities(items || []);
        } catch (err) {
          console.error('Failed to load activities', err);
          if (mounted) setActivities([]);
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        if (mounted) {
          setActivities([]);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const filteredData = activities.filter(item => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = (item.title || item.raw?.name || '').toLowerCase().includes(q) || (item.subtitle || '').toLowerCase().includes(q);

    if (filter === 'All') return matchesSearch;
    // map filter label to type
    const key = filter.toLowerCase();
    const t = (item.type || '').toLowerCase();
    if (filter === 'Top Up') return t.includes('top') && matchesSearch;
    if (filter === 'Transfer') return t.includes('transfer') && matchesSearch;
    if (filter === 'Split Bill') return t.includes('split') && matchesSearch;
    return matchesSearch;
  });

  // Helper Icon
  const getIcon = (type) => {
    const k = (type || '').toString().toLowerCase();
    if (k.includes('top')) return <FaWallet />;
    if (k.includes('transfer')) return <FaExchangeAlt />;
    if (k.includes('split')) return <FaUserFriends />;
    return <FaShoppingBag />;
  };

  // Helper Icon Style
  const getIconClass = (type) => {
    const k = (type || '').toString().toLowerCase();
    if (k.includes('top')) return styles.iconTopUp;
    if (k.includes('transfer')) return styles.iconTransfer;
    if (k.includes('split')) return styles.iconSplit;
    return styles.iconPayment;
  };

  // Helper Status Color (case-insensitive)
  const getStatusClass = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s === 'success' || s === 'berhasil') return styles.statusSuccess;
    if (s === 'pending' || s === 'pending' ) return styles.statusPending;
    if (!s) return styles.statusPending;
    return styles.statusFailed;
  };

  // Helper Format Rupiah
  const formatRupiah = (num) => new Intl.NumberFormat('id-ID').format(num);

  const formatDate = (value) => {
    if (!value) return '';
    if (typeof value === 'number') {
      try {
        return new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageHeader}>Riwayat Transaksi</h1>

      <div className={styles.panel}>
        {/* Controls: Search & Filter */}
        <div className={styles.historyControls}>
        <div className={styles.searchBox}>
          <FaSearch color="#9ca3af" />
          <input 
            type="text" 
            placeholder="Cari transaksi..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <button 
            className={`${styles.filterBtn} ${filter === 'All' ? styles.active : ''}`}
            onClick={() => setFilter('All')}
          >
            Semua
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'Top Up' ? styles.active : ''}`}
            onClick={() => setFilter('Top Up')}
          >
            Top Up
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'Transfer' ? styles.active : ''}`}
            onClick={() => setFilter('Transfer')}
          >
            Transfer
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'Split Bill' ? styles.active : ''}`}
            onClick={() => setFilter('Split Bill')}
          >
            Split Bill
          </button>
        </div>
      </div>

        {/* List Container */}
        <div className={styles.historyListContainer}>
          {loading ? (
            <div style={{padding:'24px', textAlign:'center', color:'#6b7280'}}>Memuat aktivitas...</div>
          ) : filteredData.length > 0 ? (
            filteredData.map((item, idx) => (
              <div
                key={item.id || idx}
                className={styles.historyRow}
                onClick={() => {
                  const slug = (item.type || '').toString().toLowerCase().includes('top') ? 'topup' : (item.type || '').toString().toLowerCase().includes('transfer') || (item.type || '').toString().toLowerCase().includes('transaction') ? 'transaction' : (item.type || '').toString().toLowerCase().includes('split') ? 'split' : 'other';
                  const key = item.raw?.key || item.raw?.id || item.key || item.id || '';
                  // navigate to detail and pass item in state to avoid extra fetch when possible
                  navigate(`/activity/${slug}/${key}`, { state: { item } });
                }}
                style={{ cursor: 'pointer' }}
              >

                {/* Kiri: Icon & Nama */}
                <div className={styles.historyLeft}>
                  <div className={`${styles.historyIconWrapper} ${getIconClass(item.type)}`}>
                    {getIcon(item.type)}
                  </div>
                  <div className={styles.historyMeta}>
                    <h4 className={styles.historyTitle}>{item.title || item.raw?.name || '—'}</h4>
                    <p className={styles.historyDate}>{formatDate(item.date || item.raw?.createdAt || item.raw?.timestamp || item.raw?.created_at)}</p>
                  </div>
                </div>

                {/* Kanan: Harga & Status */}
                <div className={styles.historyRight}>
                  <p className={`${styles.historyAmount} ${item.out ? styles.amountOut : styles.amountIn}`}>
                    {item.out ? '-' : '+'} Rp {formatRupiah(item.amount)}
                  </p>
                  <span className={`${styles.statusPill} ${getStatusClass(item.raw?.status || item.status || '')}`}>
                    {item.raw?.status || item.status || ''}
                  </span>
                </div>

              </div>
            ))
          ) : (
            <div style={{padding:'40px', textAlign:'center', color:'#9ca3af'}}>
              Tidak ada transaksi yang ditemukan.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TransactionHistoryPage;