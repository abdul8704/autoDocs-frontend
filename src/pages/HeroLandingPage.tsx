import React from 'react';
import { Zap, Github, ArrowRight, ShieldCheck, Cpu, Code2, GitBranch, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeroLandingPageProps {
  onStartDemo: () => void;
}

export const HeroLandingPage: React.FC<HeroLandingPageProps> = ({ onStartDemo }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', padding: '1rem 0' }}>
      {/* HERO SECTION */}
      <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            color: '#a78bfa',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}
        >
          <Sparkles size={14} /> Autonomous Commit-Driven Documentation Engine v1.0
        </div>

        <h1 style={{ fontSize: window.innerWidth < 768 ? '2.2rem' : '3.5rem', fontWeight: 900, color: '#fafafa', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1rem' }}>
          Zero Manual Documentation. <br />
          <span style={{ background: 'linear-gradient(90deg, #7c3aed, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Synced on Every Git Commit.
          </span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#a1a1aa', maxWidth: '640px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          AutoDocs parses repository diffs on webhook push events and generates accurate, production-ready <code style={{ color: '#a78bfa' }}>ARCHITECTURE.md</code> updates directly as GitHub Pull Requests.
        </p>

        {/* Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={onStartDemo} className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
            <Github size={18} /> Get Started with GitHub <ArrowRight size={16} />
          </button>
          <button onClick={onStartDemo} className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            Explore Interactive Demo
          </button>
        </div>
      </div>

      {/* LIVE TERMINAL CODE ANIMATION CONTAINER */}
      <div
        className="glass-panel"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%',
          backgroundColor: '#09090b',
          borderColor: '#27272a',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div style={{ backgroundColor: '#121215', padding: '0.75rem 1rem', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>autodocs-agent :: worker stdout</span>
        </div>

        <div style={{ padding: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#34d399', lineHeight: 1.6 }}>
          <div>[00:00.01] ⚡ GitHub Webhook received: push to main (commit sha: e8f9a2b)</div>
          <div>[00:00.24] 📦 Shallow cloning facebook/react @ e8f9a2b...</div>
          <div>[00:01.44] 🔍 Code diff visitor scanned 14 file modifications</div>
          <div style={{ color: '#a78bfa' }}>[00:01.88] 🤖 Prompting Gemini 1.5 Pro (sys.docgen.code-v1.0)...</div>
          <div style={{ color: '#fafafa' }}>[00:03.42] ✨ Generated ARCHITECTURE.md updates (28k tokens, 3.42s)</div>
          <div style={{ color: '#60a5fa' }}>[00:03.90] 🚀 GitHub Pull Request #42 opened successfully!</div>
        </div>
      </div>

      {/* FEATURES BENTO GRID */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fafafa', textAlign: 'center', marginBottom: '1.5rem' }}>
          Built for Modern Engineering Teams
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 768 ? 'repeat(3, 1fr)' : '1fr', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
            <Code2 size={24} color="#a78bfa" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.35rem' }}>Codebase Diff Scanning</h3>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0 }}>
              Understands structural code alterations, function signature modifications, and framework routing boundaries.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
            <Cpu size={24} color="#34d399" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.35rem' }}>Multi-Model LLM Engine</h3>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0 }}>
              Utilizes Gemini 1.5 Pro for deep codebase reasoning and Gemini Flash for rapid classification runs.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
            <ShieldCheck size={24} color="#60a5fa" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.35rem' }}>Immutable Credit Ledger</h3>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0 }}>
              Transparent usage tracking, team quotas, unit cost breakdowns, and instant manual grant requests.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER SYSTEM STATUS */}
      <div style={{ textAlign: 'center', borderTop: '1px solid #27272a', paddingTop: '2rem', fontSize: '0.8rem', color: '#71717a' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontWeight: 600, marginBottom: '0.5rem' }}>
          <CheckCircle2 size={14} /> All Systems Operational • AutoDocs Engine v1.0
        </div>
        <div>© 2026 AutoDocs Inc. All rights reserved.</div>
      </div>
    </div>
  );
};
