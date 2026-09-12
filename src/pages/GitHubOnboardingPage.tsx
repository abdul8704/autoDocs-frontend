import React, { useState } from 'react';
import { Github, CheckCircle, ArrowRight, Shield, Zap } from 'lucide-react';

interface GitHubOnboardingPageProps {
  onComplete: () => void;
}

export const GitHubOnboardingPage: React.FC<GitHubOnboardingPageProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(2); // Step 2: Install GitHub App

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>GitHub Integration Wizard</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em' }}>
          Connect AutoDocs GitHub App
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '0.95rem', marginTop: '0.35rem' }}>
          Authorize webhooks and AST repository read access to enable zero-manual documentation sync.
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
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#7c3aed', border: '1px solid #a78bfa', color: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
              2
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600 }}>Step 2</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fafafa' }}>Install App</div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.5 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1e1e22', border: '1px solid #3f3f46', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
              3
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}>Step 3</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#71717a' }}>Sync Repos</div>
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
          AutoDocs GitHub App Permission Overview
        </h2>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 2rem' }}>
          The GitHub App requires read access to repository contents and write access to pull requests for automated documentation syncing.
        </p>

        {/* Permissions Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', textAlign: 'left', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.35rem' }}>
              <Shield size={16} color="#34d399" /> Webhook Events
            </div>
            <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: 0 }}>
              Listens for <code style={{ color: '#a78bfa' }}>push</code> events on default branches to trigger AST diff scanning.
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
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a
            href="https://github.com/apps/aiautodocs/installations/new"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}
          >
            <Github size={18} /> Install & Authorize GitHub App <ArrowRight size={16} />
          </a>

          <button
            onClick={onComplete}
            className="btn btn-secondary"
            style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem' }}
          >
            Skip to Repositories Hub
          </button>
        </div>
      </div>
    </div>
  );
};
