import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, ChevronRight } from 'lucide-react';

interface ExamCardProps {
  id: string;
  title: string;
  duration: number;
  date: string;
  status: 'upcoming' | 'available' | 'completed';
}

export const ExamCard: React.FC<ExamCardProps> = ({ id, title, duration, date, status }) => {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s', cursor: 'pointer' }} 
         onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
         onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
      
      <div className="flex items-center justify-between">
        <h3 style={{ fontSize: '1.25rem' }}>{title}</h3>
        {status === 'available' && (
          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>
            Live Now
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} />
          <span>{duration} mins</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={16} />
          <span>{date}</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
        {status === 'available' ? (
          <Link to={`/exam/${id}`} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
            Start Exam <ChevronRight size={18} />
          </Link>
        ) : (
          <button className="btn" disabled style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
            {status === 'completed' ? 'View Results' : 'Starts Soon'}
          </button>
        )}
      </div>
    </div>
  );
};
