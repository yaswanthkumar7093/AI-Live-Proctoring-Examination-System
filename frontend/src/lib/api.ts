import { supabase } from './supabase';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`
  };
};

export const api = {
  async register(data: any) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to register');
    }
    return res.json();
  },

  async login(data: any) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to login');
    }
    return res.json();
  },
  async getExams() {
    const res = await fetch('/api/exams', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch exams');
    return res.json();
  },

  async getExamById(id: string) {
    const res = await fetch(`/api/exams/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch exam details');
    return res.json();
  },

  async startExam(id: string) {
    const res = await fetch(`/api/exams/${id}/start`, { 
      method: 'POST', 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error('Failed to start exam');
    return res.json();
  },

  async submitExam(id: string, flagsCount: number) {
    const res = await fetch(`/api/exams/${id}/submit`, { 
      method: 'POST', 
      headers: getHeaders(),
      body: JSON.stringify({ flags_count: flagsCount })
    });
    if (!res.ok) throw new Error('Failed to submit exam');
    return res.json();
  }
};
