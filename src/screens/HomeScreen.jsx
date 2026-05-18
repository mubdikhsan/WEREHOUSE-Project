import React from 'react';
import kiraLogo from '../assets/img/KIRA-logo.png';
import Auth from '../components/Auth';
import UserDropdown from '../components/UserDropdown';

export default function HomeScreen({ gudangList, onSelect, itemCounts, theme, onToggleTheme, user, onLogin, onLogout, onRequireLogin, authOpen, setAuthOpen }) {
  const [localAuthOpen, setLocalAuthOpen] = React.useState(false);
  const isAuthOpen = authOpen !== undefined ? authOpen : localAuthOpen;
  const setAuth = setAuthOpen !== undefined ? setAuthOpen : setLocalAuthOpen;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Selamat Pagi ☀️' : hour < 18 ? 'Selamat Siang 🌤️' : 'Selamat Malam 🌙';
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="home-screen">
      {/* Header */}
      <div className="home-header">
        <div className="home-brand">
          <img src={kiraLogo} alt="KIRA Logo" style={{ height: '40px', width: 'auto', marginRight: '12px' }} />
          <div className="home-brand-text">
            <div className="name"><span>KIRA</span> PROJECT</div>
            <div className="sub">Manajemen Stok Gudang</div>
          </div>
        </div>
        <div className="header-actions">
          {user ? (
            <UserDropdown user={user} onLogout={onLogout} />
          ) : (
            <>
              <Auth onLogin={onLogin} isOpen={isAuthOpen} setIsOpen={setAuth} />
              <button onClick={() => setAuth(true)} className="auth-btn">Sign In</button>
            </>
          )}
          <button
            className="theme-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            aria-label="Toggle tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="home-greeting">
        <strong>{greeting}</strong> &mdash; {dateStr}
      </div>

      {/* Warehouse cards */}
      <div className="home-grid">
        {gudangList.map(g => (
          <button
            key={g.id}
            onClick={() => user ? onSelect(g) : onRequireLogin()}
            className={`warehouse-card ${g.cls} ${theme}`}
            title={!user ? 'Login dulu untuk mengakses' : ''}
          >
            <div className="card-icon">{g.icon}</div>
            <div className="card-label">{g.label}</div>
            <div className="card-count">{itemCounts[g.id] || 0} item</div>
          </button>
        ))}
      </div>

      <div className="home-footer">
        <p>Tap gudang untuk melihat &amp; mengelola stok</p>
      </div>
    </div>
  );
}
