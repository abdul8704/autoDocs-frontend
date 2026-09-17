import React, { useEffect, useState } from 'react';
import { Github, ArrowRight, Shield, Zap, RefreshCw, CheckCircle } from 'lucide-react';
import { fetchInstallationStatus, getAccessToken } from '../services/api';

interface GitHubOnboardingPageProps {
  onComplete: () => void;
}

export const GitHubOnboardingPage: React.FC<GitHubOnboardingPageProps> = ({ onComplete }) => {
  const [checking, setChecking] = useState<boolean>(false);
  const [appSlug, setAppSlug] = useState<string>('aiautodocs');
  const [installed, setInstalled] = useState<boolean>(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetchInstallationStatus();
      if (res.appSlug) {
        setAppSlug(res.appSlug);
      }
      if (res.isInstalled) {
        setInstalled(true);
        onComplete();
      }
    } catch (err) {
      console.warn('[Onboarding] Failed to check status:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      fetchInstallationStatus().then((res) => {
        if (res.appSlug) setAppSlug(res.appSlug);
        if (res.isInstalled) {
          setInstalled(true);
          onComplete();
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const token = getAccessToken();
  const installUrl = `https://github.com/apps/${appSlug}/installations/new${token ? `?state=${encodeURIComponent(token)}` : ''}`;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>GitHub Integration Required</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em' }}>
          Connect AutoDocs GitHub App
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '0.95rem', marginTop: '0.35rem' }}>
          To access your dashboard and repository documentation, install the AutoDocs GitHub App on your account or organization.
        </p>
      </div>

      {/* 3-Step Wizard Stepper Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', position: 'relative' }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34d399', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
              ✓
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>Step 1</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fafafa' }}>Authenticate</div>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: installed ? 'rgba(52, 211, 153, 0.2)' : '#7c3aed', border: installed ? '1px solid #34d399' : '1px solid #a78bfa', color: installed ? '#34d399' : '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
              {installed ? '✓' : '2'}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600 }}>Step 2</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fafafa' }}>Install App</div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: installed ? 1 : 0.5 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1e1e22', border: '1px solid #3f3f46', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
              3
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>Step 3</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#71717a' }}>Dashboard Access</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Connect Card */}
      <div className="glass-panel" style={{ padding: '2.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <Github size={36} color="#fafafa" />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.5rem' }}>
          GitHub App Installation Required
        </h2>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 2rem' }}>
          You must install and authorize the AutoDocs GitHub App before accessing the dashboard or repositories.
        </p>

        {/* Permissions Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', textAlign: 'left', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.35rem' }}>
              <Shield size={16} color="#34d399" /> Webhook Integration
            </div>
            <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: 0 }}>
              Listens for <code style={{ color: '#a78bfa' }}>push</code> events on default branches to trigger commit diff scanning.
            </p>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.35rem' }}>
              <Zap size={16} color="#a78bfa" /> Pull Request Generation
            </div>
            <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: 0 }}>
              Opens automated PRs with updated <code style={{ color: '#a78bfa' }}>ARCHITECTURE.md</code> docs for developer review.
            </p>
          </div>
        </div>

        {/* Install Action CTA */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
          <a
            href={installUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}
          >
            <Github size={18} /> Install & Authorize GitHub App <ArrowRight size={16} />
          </a>

          <button
            onClick={checkStatus}
            disabled={checking}
            className="btn btn-secondary"
            style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={checking ? 'spin' : ''} />
            {checking ? 'Checking...' : 'Verify Status'}
          </button>
        </div>
      </div>
    </div>
  );
};
