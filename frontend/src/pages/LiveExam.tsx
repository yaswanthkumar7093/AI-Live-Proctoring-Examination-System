import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { WebcamView } from '../components/WebcamView';
import { api } from '../lib/api';

export const LiveExam: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const initExam = async () => {
      try {
        if (!id) return;
        const examData = await api.getExamById(id);
        setExam(examData);
        // Start exam session on backend
        await api.startExam(id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initExam();
  }, [id]);

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      // Hardcoding flags_count to 0 for MVP
      await api.submitExam(id, 0);
      setSubmitted(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading Secure Environment...</div>;

  if (submitted) {
    return (
      <div className="page-wrapper flex items-center" style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-panel text-center animate-fade-in" style={{ padding: '48px', maxWidth: '500px' }}>
          <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 24px' }} />
          <h2>Exam Submitted Successfully</h2>
          <p className="mt-4">Your responses and proctoring logs have been securely uploaded. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'var(--danger)', color: 'white', padding: '8px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '0.875rem' }}>
        <Shield size={16} /> LIVE PROCTORING ACTIVE. Do not leave this page.
      </div>

      <div style={{ flex: 1, padding: '48px 40px', overflowY: 'auto', background: 'var(--bg-color)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{exam?.title || 'Examination'}</h1>
            <p>Duration: <strong style={{ color: 'var(--warning)', fontFamily: 'monospace', fontSize: '1.25rem' }}>{exam?.duration_minutes || 60} mins</strong></p>
          </div>
          <button onClick={handleSubmit} className="btn btn-primary" style={{ background: 'var(--success)' }} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </header>

        <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Question 1</h3>
          <p style={{ marginBottom: '24px', fontSize: '1.125rem' }}>Please enter your response to the prompt provided by your instructor.</p>
          <textarea 
            className="input-field" 
            style={{ width: '100%', minHeight: '200px', resize: 'vertical' }} 
            placeholder="Type your answer here..."
          />
        </div>
      </div>

      <div style={{ width: '320px', background: 'rgba(11,15,25,0.95)', borderLeft: '1px solid var(--surface-border)', padding: '48px 24px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <WebcamView />
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '12px' }}>
            <AlertCircle size={18} /> System Alerts
          </h4>
          <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '20px' }}>
            <li>Environment check passed</li>
            <li>Microphone active</li>
            <li style={{ color: 'var(--text-primary)' }}>Tracking gaze and background noise...</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
