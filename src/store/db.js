// src/store/db.js
// API-based persistence with Supabase backend

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function getGudangList() {
  try {
    const response = await fetch(`${API_BASE}/gudang`);
    const result = await response.json();
    if (result.status === 'success') {
      return result.data.map(g => ({
        id: g.id,
        label: g.nama_gudang,
        icon: g.icon,
        cls: g.css_class
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching gudang list:', error);
    return [];
  }
}

export async function getItems(gudangId) {
  try {
    const response = await fetch(`${API_BASE}/items/${gudangId}`);
    const result = await response.json();
    if (result.status === 'success') {
      return result.data.map(item => ({
        id: item.id,
        namaBarang: item.nama_barang,
        stokAwal: item.stok_awal,
        stokDatang: item.stok_datang,
        totalStok: item.total_stok,
        satuan: item.satuan,
        catatan: item.catatan,
        photo: item.photo,
        signature: item.signature,
        location: item.location,
        updatedAt: item.updated_at,
        createdAt: item.created_at
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

export async function saveItem(gudangId, item, isEdit = false) {
  try {
    const payload = {
      id: item.id,
      gudang_id: gudangId,
      nama_barang: item.namaBarang,
      stok_awal: item.stokAwal,
      stok_datang: item.stokDatang,
      satuan: item.satuan,
      catatan: item.catatan,
      photo: item.photo,
      signature: item.signature,
      location: item.location
    };

    const url = isEdit ? `${API_BASE}/items/${item.id}` : `${API_BASE}/items`;
    const method = isEdit ? 'PUT' : 'POST';

    console.log('Saving item to gudang:', gudangId, { method, url, isEdit });
    console.log('Photo length:', item.photo ? item.photo.length : 'null');
    console.log('Signature length:', item.signature ? item.signature.length : 'null');
    console.log('Payload size:', JSON.stringify(payload).length, 'bytes');

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Save response:', result);
    
    if (!response.ok) {
      console.error('Server error:', result);
      return false;
    }
    
    return result.status === 'success';
  } catch (error) {
    console.error('Error saving item:', error);
    return false;
  }
}

export async function deleteItem(gudangId, itemId) {
  try {
    const response = await fetch(`${API_BASE}/items/${itemId}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
}

export async function getSuggestions() {
  try {
    const response = await fetch(`${API_BASE}/suggestions`);
    const result = await response.json();
    if (result.status === 'success') {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Fallback functions for compatibility
export function loadDB() {
  return { gudang: {}, suggestions: [] };
}

export function saveDB(data) {
  // No-op for API-based storage
}
