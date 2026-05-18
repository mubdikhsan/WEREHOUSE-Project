import React, { useState, useEffect } from 'react';
import { getItems, deleteItem } from '../store/db';
import UserDropdown from '../components/UserDropdown';

export default function ItemListScreen({ gudang, onBack, onAdd, onEdit, refreshKey, theme, onToggleTheme, user, onLogout }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      const data = await getItems(gudang.id);
      setItems(data);
      setLoading(false);
    };
    loadItems();
  }, [gudang.id, refreshKey]);

  const filtered = search.trim()
    ? items.filter(i => i.namaBarang.toLowerCase().includes(search.toLowerCase()))
    : items;

  async function doDelete() {
    const success = await deleteItem(gudang.id, deleteTarget.id);
    if (success) {
      const data = await getItems(gudang.id);
      setItems(data);
    }
    setDeleteTarget(null);
  }

  return (
    <div className="screen page-enter">
      {/* Header */}
      <div className="header">
        <button className="icon-btn back" onClick={onBack} aria-label="Kembali">←</button>
        <div className="header-title">{gudang.icon} {gudang.label}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user && <UserDropdown user={user} onLogout={onLogout} />}
          <button
            className="theme-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn primary" onClick={onAdd} aria-label="Tambah">+</button>
        </div>
      </div>

      {/* Search */}
      <div className="search-wrap">
        <input
          className="search-box"
          placeholder="🔍  Cari nama barang..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="scroll-area">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">
              {search ? 'Tidak ditemukan' : 'Belum ada data'}
            </div>
            <div className="empty-sub">
              {search
                ? `Tidak ada item "${search}"`
                : 'Tap tombol + untuk menambah item baru'}
            </div>
            {!search && (
              <button
                className="btn btn-primary"
                style={{ marginTop: 16, flex: 'none', padding: '14px 28px' }}
                onClick={onAdd}
              >
                + Tambah Data
              </button>
            )}
          </div>
        ) : (
          <div className="item-list">
            {filtered.map(item => (
              <div key={item.id} className="item-card" onClick={() => onEdit(item)}>
                <div className="item-card-body">
                  <div className="item-nama">{item.namaBarang}</div>
                  {item.catatan
                    ? <div className="item-catatan">📝 {item.catatan}</div>
                    : null}
                  <div className="item-catatan" style={{ marginTop: 3 }}>
                    📥 Datang: <strong style={{ color: 'var(--text)' }}>{item.stokDatang || 0}</strong>
                    &nbsp;·&nbsp;
                    Awal: <strong style={{ color: 'var(--text)' }}>{item.stokAwal || 0}</strong> {item.satuan}
                  </div>
                </div>
                <div className="item-stok-wrap">
                  <div className="item-stok-pill">
                    <span className="item-stok-val">{item.totalStok}</span>
                    <span className="item-stok-unit">{item.satuan}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                    {new Date(item.updatedAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short',
                    })}
                  </div>
                </div>
                <button
                  className="item-delete-btn"
                  onClick={e => { e.stopPropagation(); setDeleteTarget(item); }}
                  aria-label="Hapus"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="overlay" onClick={() => setDeleteTarget(null)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <h3>Hapus Item?</h3>
            <p>"{deleteTarget.namaBarang}" akan dihapus secara permanen.</p>
            <div className="dialog-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--red)', boxShadow: 'none' }}
                onClick={doDelete}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
