import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--surface-border)', padding: '16px 24px'
    }}>
      <div className="container flex items-center justify-between">
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={28} color="var(--primary-color)" />
          <span style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>ProctorAI</span>
        </Link>
        <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
};
