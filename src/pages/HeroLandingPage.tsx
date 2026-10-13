import React from 'react';
import {
  Github,
  ArrowRight,
  FileText,
  GitPullRequest,
  Clock,
  Users,
  Eye,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Plug,
  Code2,
  GitMerge,
} from 'lucide-react';

import logoImg from '../assets/logo.svg';

interface HeroLandingPageProps {
  onStartDemo: () => void;
}

const benefits = [
  {
    icon: <Clock size={22} color="#a78bfa" />,
    title: 'Get your time back',
    body: 'Nobody on the team has to stop shipping to rewrite the architecture doc. It keeps itself current.',
  },
  {
    icon: <Users size={22} color="#34d399" />,
    title: 'Onboard people faster',
    body: 'New engineers read a map of the system that matches the code they are about to change, not last year’s version.',
  },
  {
    icon: <Eye size={22} color="#60a5fa" />,
    title: 'You stay in control',
    body: 'Every update arrives as a pull request. Read it, edit it, merge it or close it, just like a teammate’s change.',
  },
  {
    icon: <Layers size={22} color="#fbbf24" />,
    title: 'Only changes that matter',
    body: 'Typo fixes and small tweaks are skipped. Your docs change when the shape of your system changes.',
  },
];

const steps = [
  {
    icon: <Plug size={20} color="#a78bfa" />,
    title: 'Connect your repositories',
    body: 'Sign in with GitHub and choose which repositories AutoDocs should look after.',
  },
  {
    icon: <Code2 size={20} color="#34d399" />,
    title: 'Keep coding as usual',
    body: 'Push your work the way you always do. There is nothing new to learn or remember.',
  },
  {
    icon: <GitMerge size={20} color="#60a5fa" />,
    title: 'Review and merge',
    body: 'When your system changes, a pull request with the updated docs shows up for you to approve.',
  },
];

export const HeroLandingPage: React.FC<HeroLandingPageProps> = ({ onStartDemo }) => {
  return (
    <div className="landing-root">
      {/* TOP NAV */}
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img src={logoImg} alt="" style={{ width: '32px', height: '32px', borderRadius: '9px' }} />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fafafa', letterSpacing: '-0.02em' }}>AutoDocs</span>
          </div>
          <button onClick={onStartDemo} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            Sign in
          </button>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="landing-container landing-hero">
          <div className="landing-pill">
            <FileText size={14} /> Documentation that keeps up with your code
          </div>

          <h1 className="landing-h1">
            Your architecture docs,
            <br />
            <span className="landing-gradient-text">always up to date.</span>
          </h1>

          <p className="landing-lead">
            AutoDocs watches your GitHub repositories and keeps your architecture documentation in step with the code.
            When your system changes, the docs change with it, and you just review and merge.
          </p>

          <div className="landing-cta-row">
            <button onClick={onStartDemo} className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              <Github size={18} /> Get started with GitHub <ArrowRight size={16} />
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '0.9rem' }}>
            Works with your existing GitHub repositories. No new tools for your team.
          </p>

          {/* PRODUCT PREVIEW: what lands in your repo */}
          <div className="landing-preview glass-panel">
            <div className="landing-preview-head">
              <GitPullRequest size={18} color="#34d399" />
              <span style={{ fontWeight: 700, color: '#fafafa' }}>Update architecture docs for new billing service</span>
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Ready to review</span>
            </div>
            <div className="landing-preview-body">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#71717a', marginBottom: '0.75rem' }}>
                ARCHITECTURE.md
              </div>
              <div className="landing-diff landing-diff-del">- Payments are handled inside the API server.</div>
              <div className="landing-diff landing-diff-add">+ Payments now run in a separate billing service that the API calls.</div>
              <div className="landing-diff landing-diff-add">+ Usage is recorded per team so credits can be tracked over time.</div>
              <div className="landing-diff">&nbsp;&nbsp;The web app talks to the API over a single authenticated endpoint.</div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="landing-container landing-section">
          <div className="landing-problem glass-panel">
            <AlertTriangle size={26} color="#fbbf24" style={{ flexShrink: 0 }} />
            <div>
              <h2 className="landing-h2" style={{ marginBottom: '0.5rem' }}>Docs go stale the day they are written</h2>
              <p className="landing-body">
                Code changes every day. The document that explains how it all fits together usually doesn’t. Before long,
                new hires learn the wrong things, reviews take longer, and the one person who knows how it really works
                becomes the bottleneck.
              </p>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="landing-container landing-section">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>Why teams use AutoDocs</h2>
          <p className="landing-body" style={{ textAlign: 'center', maxWidth: '560px', margin: '0.5rem auto 2rem' }}>
            Accurate documentation without anyone having to own the chore.
          </p>
          <div className="landing-grid-4">
            {benefits.map((b) => (
              <div key={b.title} className="glass-card-interactive" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
                <div className="landing-icon-tile">{b.icon}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fafafa', margin: '0.9rem 0 0.4rem' }}>{b.title}</h3>
                <p style={{ fontSize: '0.88rem', color: '#a1a1aa', lineHeight: 1.6 }}>{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* GETTING STARTED */}
        <section className="landing-container landing-section">
          <h2 className="landing-h2" style={{ textAlign: 'center', marginBottom: '2rem' }}>Up and running in minutes</h2>
          <div className="landing-grid-3">
            {steps.map((s, i) => (
              <div key={s.title} className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className="landing-step-num">{i + 1}</span>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.4rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.88rem', color: '#a1a1aa', lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="landing-container landing-section">
          <div className="landing-final glass-panel">
            <h2 className="landing-h2">Stop rewriting docs by hand</h2>
            <p className="landing-body" style={{ maxWidth: '520px', margin: '0.6rem auto 1.75rem' }}>
              Connect a repository and let your documentation keep pace with your team.
            </p>
            <button onClick={onStartDemo} className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              <Github size={18} /> Get started with GitHub <ArrowRight size={16} />
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', marginTop: '1.5rem', fontSize: '0.8rem', color: '#a1a1aa' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={14} color="#34d399" /> Every change goes through review
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={14} color="#34d399" /> You pick the repositories
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-container landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={logoImg} alt="" style={{ width: '20px', height: '20px', borderRadius: '6px' }} />
          <span style={{ fontWeight: 700, color: '#a1a1aa' }}>AutoDocs</span>
        </div>
        <span>© {new Date().getFullYear()} AutoDocs</span>
      </footer>
    </div>
  );
};
