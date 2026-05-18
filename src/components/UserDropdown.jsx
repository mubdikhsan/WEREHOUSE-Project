import React, { useState, useRef, useEffect } from 'react';

export default function UserDropdown({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button 
        className="user-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="role-badge">{user.role}</span>
        <span className="user-name">{user.name}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="user-dropdown-menu">
          <div className="user-dropdown-header">
            <span className="user-dropdown-name">{user.name}</span>
            <span className="user-dropdown-email">{user.email}</span>
          </div>
          <div className="user-dropdown-divider"></div>
          <button 
            className="user-dropdown-item logout-item"
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
          >
            <span>🚪 Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
