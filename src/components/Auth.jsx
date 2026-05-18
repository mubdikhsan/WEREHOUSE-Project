import React, { useState } from 'react';

export default function Auth({ onLogin, isOpen, setIsOpen }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'user',
    userId: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (formData.password !== formData.confirmPassword) {
        setError('Password tidak cocok');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password minimal 6 karakter');
        return;
      }
    }

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();

      if (result.status === 'success') {
        onLogin(result.data);
        setIsOpen(false);
        setFormData({ email: '', password: '', confirmPassword: '', name: '', role: 'user', userId: '' });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="auth-overlay" onClick={() => setIsOpen(false)}>
      <div className="auth-popup" onClick={e => e.stopPropagation()}>
        <div className="auth-header">
          <h2>{isRegister ? 'Register' : 'Login'}</h2>
          <p className="auth-subtitle">Silakan masukkan detail akun Anda</p>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
              <select
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="Kepala Dapur">Kepala Dapur</option>
                <option value="Akuntansi">Akuntansi</option>
                <option value="Pengawas Gizi">Pengawas Gizi</option>
                <option value="Admin Gudang">Admin Gudang</option>
                <option value="Asisten Lapangan">Asisten Lapangan</option>
                <option value="user">User</option>
              </select>
            </>
          )}
          {!isRegister && (
            <select
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="Kepala Dapur">Kepala Dapur</option>
              <option value="Akuntansi">Akuntansi</option>
              <option value="Pengawas Gizi">Pengawas Gizi</option>
              <option value="Admin Gudang">Admin Gudang</option>
              <option value="Asisten Lapangan">Asisten Lapangan</option>
              <option value="user">User</option>
            </select>
          )}
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="ID User"
            value={formData.userId}
            onChange={e => setFormData({...formData, userId: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            required
          />
          {isRegister && (
            <input
              type="password"
              placeholder="Konfirmasi Password"
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />
          )}
          <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <div className="auth-footer">
          <p>
            {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button type="button" className="auth-link-btn" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
          <button type="button" className="auth-close-btn" onClick={() => setIsOpen(false)}>Batal</button>
        </div>
      </div>
    </div>
  );
}
