import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ExamCard } from '../components/ExamCard';
import { api } from '../lib/api';

export const Dashboard: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await api.getExams();
        setExams(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <>
      <Navbar />
      <main className="page-wrapper container animate-fade-in">
        <div style={{ padding: '40px 0' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>My Dashboard</h1>
          <p style={{ fontSize: '1.125rem' }}>Welcome back. You have {exams.filter(e => e.status === 'available').length} exams available to take.</p>
        </div>

        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
            Your Exams
          </h2>
          {loading ? (
             <p>Loading exams...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {exams.map(exam => (
                <ExamCard 
                  key={exam.id} 
                  id={exam.id}
                  title={exam.title}
                  duration={exam.duration_minutes}
                  date={exam.start_time ? new Date(exam.start_time).toLocaleString() : 'Available Now'}
                  status={exam.status || 'available'}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
};
