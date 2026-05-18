import React, { useState, useEffect, useRef } from 'react';
import { saveItem, getSuggestions, generateId } from '../store/db';
import SignaturePad from '../components/SignaturePad';
import UserDropdown from '../components/UserDropdown';

const SATUAN_LIST = [
  'Kg', 'Gram', 'Liter', 'mL', 'Buah', 'Pcs',
  'Dus', 'Karton', 'Bal', 'Pak', 'Botol', 'Kaleng', 'Sak', 'Meter', 'Roll',
];

function formatDateTime(date = new Date()) {
  return date.toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function FormScreen({ gudang, editItem, onBack, onSaved, user, onLogout }) {
  const isEdit = !!editItem;
  const fileInputRef = useRef(null);

  const [namaBarang, setNamaBarang]   = useState(editItem?.namaBarang || '');
  const [stokAwal, setStokAwal]       = useState(String(editItem?.stokAwal ?? ''));
  const [stokDatang, setStokDatang]   = useState(String(editItem?.stokDatang ?? ''));
  const [satuan, setSatuan]           = useState(editItem?.satuan || 'Kg');
  const [catatan, setCatatan]         = useState(editItem?.catatan || '');
  const [photo, setPhoto]             = useState(editItem?.photo || null);
  const [signature, setSignature]     = useState(editItem?.signature || null);
  const [saving, setSaving]           = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg]       = useState(false);
  const [location, setLocation]       = useState('Mendapatkan lokasi...');

  const totalStok = (parseFloat(stokAwal) || 0) + (parseFloat(stokDatang) || 0);

  useEffect(() => {
    const loadSuggestions = async () => {
      const data = await getSuggestions();
      setSuggestions(data);
    };
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocation('GPS tidak didukung'); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          const address = data.display_name || `${lat}, ${lng}`;
          setLocation(address);
        } catch {
          setLocation(`${lat}, ${lng}`);
        }
      },
      () => setLocation('Lokasi tidak tersedia'),
      { timeout: 8000 }
    );
  }, []);

  const filteredSugg = namaBarang.trim()
    ? suggestions.filter(s =>
        s.toLowerCase().startsWith(namaBarang.toLowerCase()) && s !== namaBarang
      ).slice(0, 6)
    : [];

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const wm = `📅 ${formatDateTime()}   📍 ${location}`;
        const fontSize = Math.max(18, Math.floor(canvas.width / 32));
        ctx.font = `bold ${fontSize}px Plus Jakarta Sans, sans-serif`;
        ctx.textBaseline = 'bottom';
        const pad  = fontSize * 0.6;
        const bgH  = fontSize + pad * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, canvas.height - bgH, canvas.width, bgH);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(wm, pad, canvas.height - pad / 2);
        setPhoto(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleSave() {
    if (!namaBarang.trim()) { alert('Nama Barang wajib diisi!'); return; }
    setSaving(true);
    const now  = new Date().toISOString();
    const item = {
      id:          editItem?.id || generateId(),
      namaBarang:  namaBarang.trim(),
      stokAwal:    parseFloat(stokAwal)   || 0,
      stokDatang:  parseFloat(stokDatang) || 0,
      totalStok,
      satuan,
      catatan,
      photo,
      signature,
      location,
      updatedAt:   now,
      createdAt:   editItem?.createdAt || now,
    };
    
    try {
      const success = await saveItem(gudang.id, item, isEdit);
      setTimeout(() => { 
        setSaving(false); 
        if (success) {
          onSaved(item);
        } else {
          alert('Gagal menyimpan item. Silakan coba lagi.');
        }
      }, 400);
    } catch (error) {
      console.error('Error saving item:', error);
      setSaving(false);
      alert('Terjadi kesalahan saat menyimpan item. Silakan coba lagi.');
    }
  }

  return (
    <div className="form-screen page-enter">
      {/* Header */}
      <div className="header">
        <button className="icon-btn back" onClick={onBack} aria-label="Kembali">←</button>
        <div className="header-title">
          {isEdit ? '✏️ Edit Item' : '➕ Tambah Item'}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user && <UserDropdown user={user} onLogout={onLogout} />}
        </div>
      </div>

      <div className="form-body">
        {/* Gudang chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>Gudang:</span>
          <span className="chip">{gudang.icon} {gudang.label}</span>
        </div>

        <div className="form-grid">
          {/* Nama Barang – full width */}
          <div className="form-group full autocomplete-wrap">
            <label className="form-label">Nama Barang *</label>
            <input
              className="form-input"
              placeholder="Contoh: Tepung Terigu"
              value={namaBarang}
              onChange={e => { setNamaBarang(e.target.value); setShowSugg(true); }}
              onFocus={() => setShowSugg(true)}
              onBlur={() => setTimeout(() => setShowSugg(false), 150)}
              autoComplete="off"
            />
            {showSugg && filteredSugg.length > 0 && (
              <div className="autocomplete-list">
                {filteredSugg.map(s => (
                  <div
                    key={s}
                    className="autocomplete-item"
                    onMouseDown={() => { setNamaBarang(s); setShowSugg(false); }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stok Awal */}
          <div className="form-group">
            <label className="form-label">Stok Saat Ini</label>
            <div className="stok-row">
              <input
                className="form-input"
                type="number" inputMode="decimal" placeholder="0"
                value={stokAwal}
                onChange={e => setStokAwal(e.target.value)}
              />
              <select className="unit-select" value={satuan} onChange={e => setSatuan(e.target.value)}>
                {SATUAN_LIST.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Stok Datang */}
          <div className="form-group">
            <label className="form-label">Stok Datang Hari Ini</label>
            <div className="stok-row">
              <input
                className="form-input"
                type="number" inputMode="decimal" placeholder="0"
                value={stokDatang}
                onChange={e => setStokDatang(e.target.value)}
              />
              <select className="unit-select" value={satuan} onChange={e => setSatuan(e.target.value)}>
                {SATUAN_LIST.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Total Stok – full width */}
          <div className="form-group full">
            <label className="form-label">Total Stok (Otomatis)</label>
            <input
              className="form-input total"
              value={`${totalStok % 1 === 0 ? totalStok : totalStok.toFixed(2)}  ${satuan}`}
              readOnly
            />
          </div>

          {/* Catatan – full width */}
          <div className="form-group full">
            <label className="form-label">Catatan</label>
            <textarea
              className="form-input"
              placeholder="Tambahkan catatan (opsional)..."
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Dokumentasi section */}
        <div className="section-divider">Dokumentasi</div>

        {/* Foto */}
        <div className="form-group">
          <label className="form-label">Foto Barang</label>
          <input
            ref={fileInputRef}
            type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }}
            onChange={handlePhoto}
          />
          {photo ? (
            <div>
              <div className="photo-preview">
                <img src={photo} alt="Foto barang" />
              </div>
              <button
                className="camera-btn has-photo"
                style={{ marginTop: 8 }}
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 Ambil Ulang Foto
              </button>
            </div>
          ) : (
            <button className="camera-btn" type="button" onClick={() => fileInputRef.current?.click()}>
              📷 Ambil / Pilih Foto &nbsp;
              <span style={{ fontSize: 12, opacity: 0.7 }}>(watermark otomatis)</span>
            </button>
          )}
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
            📍 {location}
          </div>
        </div>

        {/* Signature */}
        <div className="form-group">
          <label className="form-label">Paraf / TTD</label>
          <SignaturePad onChange={setSignature} />
        </div>

        <div style={{ height: 8 }} />
      </div>

      {/* Bottom actions */}
      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {saving ? <><div className="spinner" /> Menyimpan...</> : '💾 Simpan'}
        </button>
        {isEdit && (
          <button className="btn btn-danger" type="button" onClick={onBack} title="Batal">✕</button>
        )}
      </div>
    </div>
  );
}
