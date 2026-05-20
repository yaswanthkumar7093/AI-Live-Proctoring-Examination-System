import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export const WebcamView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err: any) {
        setHasPermission(false);
        setError(err.message || 'Camera permission denied');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="glass-panel" style={{ overflow: 'hidden', position: 'relative', aspectRatio: '4/3', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasPermission ? 'var(--danger)' : 'var(--text-secondary)', animation: hasPermission ? 'pulse 2s infinite' : 'none' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Live Proctoring Feed</span>
      </div>
      
      <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasPermission === null ? (
          <p style={{ color: 'var(--text-secondary)' }}>Requesting camera access...</p>
        ) : hasPermission === false ? (
          <div className="text-center" style={{ padding: '24px' }}>
            <AlertTriangle size={48} color="var(--warning)" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'white', marginBottom: '8px' }}>Camera Access Required</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
    </div>
  );
};
