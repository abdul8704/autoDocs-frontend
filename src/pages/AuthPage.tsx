import React, { useMemo } from 'react';
import { Zap, Github, ShieldCheck, CheckCircle2, Lock, AlertCircle } from 'lucide-react';
import { getFullApiUrl, getDemoUser } from '../services/api';
import { User } from '../types';

interface AuthPageProps {
  onLoginSuccess: (demoUser?: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const oauthError = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('error');
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(124, 58, 237, 0.15), transparent 70%)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0c0c0f',
          borderColor: '#27272a',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          textAlign: 'center',
        }}
      >
        {/* Brand Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #34d399 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 30px rgba(124, 58, 237, 0.5)',
          }}
        >
          <Zap size={32} color="#ffffff" />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          AutoDocs AI Portal
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '1.5rem' }}>
          Zero manual synced docs. Autonomous documentation generation on every git commit.
        </p>

        {oauthError && (
          <div
            style={{
              margin: '0 auto 1.5rem',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={16} />
            <span>GitHub Sign-In Error: {oauthError}</span>
          </div>
        )}

        {/* Promo Credit Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            color: '#34d399',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '2rem',
          }}
        >
          <CheckCircle2 size={14} />
          Claim 20 Free Credits on First OAuth Sign-In
        </div>

        {/* Login Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <button
            onClick={() => {
              window.location.href = getFullApiUrl('/auth/github');
            }}
            className="btn btn-github"
            style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '0.95rem' }}
          >
            <Github size={18} /> Continue with GitHub OAuth
          </button>

          <button
            onClick={() => onLoginSuccess(getDemoUser())}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '0.95rem' }}
          >
            <Lock size={18} color="#a78bfa" /> Demo Instant Developer Sign-In
          </button>
        </div>

        {/* SOC2 & Security Badges */}
        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            fontSize: '0.75rem',
            color: '#71717a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={14} color="#34d399" /> SOC2 Type II Certified
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Lock size={14} color="#a78bfa" /> 256-bit TLS Encrypted
          </div>
        </div>
      </div>
    </div>
  );
};
