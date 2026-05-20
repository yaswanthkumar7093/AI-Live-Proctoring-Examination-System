import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { api } from '../lib/api';

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (isRegister) {
      // Custom Register
      try {
        const { user, token } = await api.register({ 
          email, 
          password,
          first_name: firstName,
          last_name: lastName
        });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        // Force reload to update App session state
        window.location.href = '/dashboard';
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      // Custom Login
      try {
        const { user, token } = await api.login({ email, password });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        // Force reload to update App session state
        window.location.href = '/dashboard';
      } catch (err: any) {
        setError(err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="page-wrapper flex items-center" style={{ justifyContent: 'center', minHeight: '100vh', padding: '0 24px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px' }}>
        <div className="text-center mb-4">
          <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', marginBottom: '16px' }}>
            <Shield size={40} color="var(--primary-color)" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isRegister ? 'Sign up to start taking exams' : 'Sign in to continue to your exams'}</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)', color: 'var(--danger)', marginBottom: '24px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth}>
          {isRegister && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">First Name</label>
                <input type="text" className="input-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Last Name</label>
                <input type="text" className="input-field" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '24px', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button 
            type="button" 
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', marginLeft: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};
