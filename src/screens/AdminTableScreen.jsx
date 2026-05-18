import React, { useState, useEffect } from 'react';
import { getItems, deleteItem } from '../store/db';
import UserDropdown from '../components/UserDropdown';

export default function AdminTableScreen({ gudang, onBack, onEdit, theme, user, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [gudang]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getItems(gudang.id);
      setItems(data);
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) return;
    
    try {
      const success = await deleteItem(gudang.id, itemId);
      if (success) {
        loadItems();
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleDownloadExcel = () => {
    const headers = ['ID', 'Nama Barang', 'Stok Awal', 'Stok Datang', 'Total Stok', 'Satuan', 'Catatan'];
    const rows = items.map(item => [
      item.id,
      item.namaBarang,
      item.stokAwal,
      item.stokDatang,
      item.totalStok,
      item.satuan || '-',
      item.catatan || '-'
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${gudang.label}_items.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="admin-table-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-table-screen">
      <div className="admin-table-header">
        <div className="admin-table-top-bar">
          <button onClick={onBack} className="back-btn">← Kembali</button>
          <div className="admin-table-header-actions">
            {user && <UserDropdown user={user} onLogout={onLogout} />}
            <button onClick={handleDownloadExcel} className="download-btn">Download Excel</button>
          </div>
        </div>
        <h2>{gudang.label} - Admin View</h2>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Tidak ada item di {gudang.label}</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Barang</th>
                <th>Stok Awal</th>
                <th>Stok Datang</th>
                <th>Total Stok</th>
                <th>Satuan</th>
                <th>Catatan</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.namaBarang}</td>
                  <td>{item.stokAwal}</td>
                  <td>{item.stokDatang}</td>
                  <td>{item.totalStok}</td>
                  <td>{item.satuan || '-'}</td>
                  <td>{item.catatan || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => onEdit(item)}>Edit</button>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
