import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import styles from './TransactionHistory.module.css';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import { getUser } from '../services/userService';

const ActivityDetailPage = () => {
  const { type, id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [item, setItem] = useState(location.state?.item || null);
  const [loading, setLoading] = useState(false);
  const [participantsMap, setParticipantsMap] = useState({});

  useEffect(() => {
    let mounted = true;
    const fetchById = async () => {
      if (item) return; // already provided via state
      if (!id) return;
      setLoading(true);
      try {
        // map route type to DB path
        let path = 'transactions';
        const t = (type || '').toLowerCase();
        if (t.includes('top')) path = 'topup';
        else if (t.includes('split')) path = 'splitBill';
        else if (t.includes('transfer') || t.includes('transaction')) path = 'transactions';

        const snapshot = await get(ref(db, `${path}/${id}`));
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (mounted) setItem({ key: snapshot.key, ...val, _fetchedFrom: path });
        } else {
          if (mounted) setItem(null);
        }
      } catch (err) {
        console.error('Failed to fetch activity detail', err);
        if (mounted) setItem(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchById();
    return () => { mounted = false; };
  }, [type, id, item]);

  // fetch participant user data when needed
  useEffect(() => {
    let mounted = true;
    const loadParticipants = async () => {
      const participants = item?.participants || item?.raw?.participants || [];
      const uidsToFetch = participants.filter(p => typeof p === 'string');
      if (uidsToFetch.length === 0) return;
      try {
        const unique = Array.from(new Set(uidsToFetch));
        const map = {};
        await Promise.all(unique.map(async (uid) => {
          try {
            const data = await getUser(uid);
            if (data) map[uid] = data;
          } catch (e) {
            // ignore individual fetch errors
          }
        }));
        if (mounted) setParticipantsMap(map);
      } catch (err) {
        console.error('Failed to fetch participant users', err);
      }
    };

    loadParticipants();
    return () => { mounted = false; };
  }, [item]);

  if (loading) return <div className={styles.page}><div className={styles.panel}>Memuat detail...</div></div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageHeader}>Detail Aktivitas</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        <div className={styles.panel}>
          {!item ? (
            <div style={{ padding: 20, color: '#6b7280' }}>Detail tidak ditemukan.</div>
          ) : (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 24, color: '#111827' }}>{item.title || item.billName || item.store || 'Aktivitas'}</h3>
              <p style={{ color: '#9ca3af', marginTop: 0, fontSize: 14 }}>{new Date(item.createdAt || item.timestamp || item.date || Date.now()).toLocaleString('id-ID')}</p>

              <div style={{ 
                marginTop: 24, 
                padding: 20, 
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                borderRadius: 14,
                color: 'white'
              }}>
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>JUMLAH</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{item.amount ? `Rp ${Number(item.amount).toLocaleString('id-ID')}` : '-'}</div>
              </div>

              <div style={{ 
                marginTop: 16, 
                padding: 16, 
                background: '#f3f4f6', 
                borderRadius: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Status</div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{item.status || item.raw?.status || '—'}</div>
                </div>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: item.status?.toLowerCase().includes('success') ? '#10b981' : item.status?.toLowerCase().includes('pending') ? '#f59e0b' : '#ef4444'
                }} />
              </div>

            {item.type === 'split' || item._fetchedFrom === 'splitBill' || item.billName ? (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600, color: '#111827' }}>Peserta</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {(item.participants || item.raw?.participants || []).map((p, i) => {
                    const isString = typeof p === 'string';
                    const uid = isString ? p : (p.uid || p.id || null);
                    const name = isString ? null : (p.name || p.displayName || p.fullName || (p.uid ? p.uid : null));
                    const fetched = uid && participantsMap[uid];
                    const displayName = fetched?.name || name || uid || 'User';
                    const smallMeta = fetched?.email || (isString ? uid : (p.email || p.role || ''));
                    const avatarUrl = fetched?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`;

                    return (
                      <div key={i} style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: 12,
                        background: '#f9fafb',
                        borderRadius: 12,
                        border: '1px solid #e5e7eb'
                      }}>
                        <img src={avatarUrl} alt={displayName} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', marginBottom: 8 }} />
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: 14, textAlign: 'center' }}>{displayName}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'center' }}>{smallMeta || ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 24 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600, color: '#111827' }}>Catatan</h4>
              <div style={{ padding: 12, background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: 8, color: '#78350f', fontSize: 14 }}>
                {item.note || item.raw?.note || item.description || 'Tidak ada catatan'}
              </div>
            </div>
          </div>
        )}
        </div>

        <div style={{ position: 'sticky', top: 32 }}>
          <div style={{
            background: 'white',
            padding: 20,
            borderRadius: 14,
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: '#111827' }}>Informasi</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Tipe</div>
                <div style={{ fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{type || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>ID Transaksi</div>
                <div style={{ fontWeight: 500, color: '#374151', fontSize: 13, wordBreak: 'break-all' }}>{item.key || id || '—'}</div>
              </div>
              {item._fetchedFrom && (
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Sumber Data</div>
                  <div style={{ fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{item._fetchedFrom}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailPage;
