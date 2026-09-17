import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  Cpu,
  GitPullRequest,
  Zap,
  ArrowUpRight,
  Sparkles,
  X,
} from 'lucide-react';
import { BillingSummary, DashboardStats, getNumericCreditBalance, User } from '../types';
import { fetchBillingSummary, fetchDashboardStats, formatFormattedTimestamp, formatDescriptionText } from '../services/api';

interface MainDashboardPageProps {
  onNavigate: (screen: string) => void;
  user?: User | null;
}

export const MainDashboardPage: React.FC<MainDashboardPageProps> = ({ onNavigate, user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [showHeroBanner, setShowHeroBanner] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => console.error('[MainDashboardPage] fetchDashboardStats error:', err));

    fetchBillingSummary()
      .then((b) => setBillingSummary(b))
      .catch((err) => console.error('[MainDashboardPage] fetchBillingSummary error:', err));
  }, []);

  if (!stats) return <div style={{ color: '#a1a1aa', padding: '1rem' }}>Loading AutoDocs Dashboard...</div>;

  const getSparklineDatesAndValues = (sparklineData: number[]) => {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      dates.push(`${day}/${month}`);
    }
    return { dates, values: sparklineData };
  };

  const renderSparkline = (data: number[]) => {
    const width = 360;
    const height = 90;
    const paddingX = 22;
    const paddingTop = 22;
    const paddingBottom = 22;

    const { dates, values } = getSparklineDatesAndValues(data);
    const max = Math.max(...values, 3);

    const points = values.map((val, idx) => {
      const x = paddingX + (idx / Math.max(1, values.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingBottom - (val / max) * (height - paddingTop - paddingBottom);
      return { x, y, val, date: dates[idx] };
    });

    const pointsString = points.map((p) => `${p.x},${p.y}`).join(' ');
    const areaD = `M ${points[0].x},${height - paddingBottom} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${height - paddingBottom} Z`;

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '85px', overflow: 'visible' }}>
          <defs>
            <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill under curve */}
          <path d={areaD} fill="url(#sparklineGrad)" />

          {/* Main Line */}
          <polyline points={pointsString} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points + count labels + date labels */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r={p.val > 0 ? 4 : 3} fill={p.val > 0 ? '#a78bfa' : '#34d399'} stroke="#0c0c0f" strokeWidth="2">
                <title>{`${p.date}: ${p.val} jobs executed`}</title>
              </circle>
              {/* Job Count Label above node */}
              <text x={p.x} y={p.y - 7} textAnchor="middle" fill={p.val > 0 ? '#34d399' : '#71717a'} fontSize="10" fontWeight="700">
                {p.val}
              </text>
              {/* Date Label below node */}
              <text x={p.x} y={height - 4} textAnchor="middle" fill="#a1a1aa" fontSize="9" fontWeight="600">
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* FIRST-TIME WELCOME HERO BANNER */}
      {stats.importedReposCount === 0 && showHeroBanner && (
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem 2rem',
            backgroundColor: '#0c0c0f',
            borderColor: 'rgba(124, 58, 237, 0.4)',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(52, 211, 153, 0.05) 100%)',
            position: 'relative',
          }}
        >
          <button
            onClick={() => setShowHeroBanner(false)}
            style={{ position: 'absolute', top: '1rem', right: '1.25rem', background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}
            title="Dismiss Banner"
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-purple">
              <Sparkles size={12} /> Welcome to AutoDocs
            </span>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Autonomous Pipeline Ready</span>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fafafa', margin: '0 0 0.5rem 0' }}>
            Automate Your Codebase Documentation in 3 Simple Steps
          </h2>

          <p style={{ color: '#a1a1aa', fontSize: '0.875rem', maxWidth: '800px', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
            AutoDocs continuously monitors your git repository commits. When code changes occur, AI automatically analyzes structural diffs and opens GitHub Pull Requests with up-to-date documentation.
          </p>

          {/* 3 Steps Visual Flow */}
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 768 ? 'repeat(3, 1fr)' : '1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(18, 18, 21, 0.8)', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700, marginBottom: '0.2rem' }}>STEP 1</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fafafa' }}>Import Repository</div>
              <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.2rem' }}>Connect any public or private GitHub repository to AutoDocs.</div>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(18, 18, 21, 0.8)', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, marginBottom: '0.2rem' }}>STEP 2</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fafafa' }}>Push Code Commits</div>
              <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.2rem' }}>AutoDocs listens to `git push` webhooks & evaluates diffs.</div>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(18, 18, 21, 0.8)', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, marginBottom: '0.2rem' }}>STEP 3</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fafafa' }}>Receive Automated PR</div>
              <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.2rem' }}>Review & merge AI-generated doc pull requests on GitHub.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => onNavigate('repos')} className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
              Import Your First Repository <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* TOP METRICS ROW (3 COLUMNS: REPOS | EXPANDED 7-DAY GRAPH JOBS | OPEN PRS) */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 1024 ? '1fr 2.4fr 1fr' : '1fr', gap: '1rem' }}>
        {/* Card 1: Imported Repos */}
        <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#71717a' }}>
            <FolderGit2 size={16} color="#a78bfa" /> Imported Repos
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fafafa', marginTop: '0.35rem' }}>
            {stats.importedReposCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.2rem' }}>Active Sync Operational</div>
        </div>

        {/* Card 2: Doc Jobs Executed (Expanded Width & Height + Embedded 7-Day Line Graph with Date/Count Labels) */}
        <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#71717a' }}>
              <Cpu size={16} color="#34d399" /> Doc Jobs Executed
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fafafa', marginTop: '0.35rem' }}>
              {stats.totalJobsExecuted}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a78bfa', marginTop: '0.2rem' }}>7-day execution trend</div>
          </div>

          {/* Embedded 7-Day Sparkline SVG Graph */}
          <div style={{ flex: 1, maxWidth: '360px' }}>
            {renderSparkline(stats.sparkline7d || [0, 0, 0, 0, 0, 0, stats.totalJobsExecuted])}
          </div>
        </div>

        {/* Card 3: Open Pull Requests */}
        <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#71717a' }}>
            <GitPullRequest size={16} color="#60a5fa" /> Open Pull Requests
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.35rem' }}>
            {stats.openPullRequestsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.2rem' }}>Ready for GitHub review</div>
        </div>
      </div>

      {/* FULL-WIDTH CREDIT USAGE COMPONENT */}
      <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', width: '100%', boxSizing: 'border-box' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="#34d399" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>Credit Usage</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {getNumericCreditBalance(user?.creditBalance)} ⚡ Available
              </span>
              <button onClick={() => onNavigate('billing')} className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
                View Ledger
              </button>
            </div>
          </div>

          {/* Recent Credit Usage Table */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', color: '#71717a', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Credits</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Action / Description</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Repository</th>
                </tr>
              </thead>
              <tbody>
                {(!billingSummary?.ledger || billingSummary.ledger.length === 0) ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '1.25rem', textAlign: 'center', color: '#71717a' }}>
                      No recent credit usage logged yet.
                    </td>
                  </tr>
                ) : (
                  billingSummary.ledger.slice(0, 5).map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                        {formatFormattedTimestamp(item.createdAt || item.transactionDate)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: item.amount < 0 ? '#f87171' : '#34d399' }}>
                        {item.amount > 0 ? `+${item.amount}` : item.amount} ⚡
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#fafafa' }}>
                        {formatDescriptionText(item.description)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {item.repoName && item.repoName !== '-' ? (
                          <button
                            onClick={() => onNavigate('repos')}
                            style={{ background: 'transparent', border: 'none', color: '#a78bfa', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '0.85rem', textDecoration: 'underline' }}
                          >
                            {item.repoName}
                          </button>
                        ) : (
                          <span style={{ color: '#52525b' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RECENT DOCUMENTATION JOBS TABLE */}
      <div style={{ width: '100%' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={18} color="#a78bfa" /> Recent Documentation Jobs
        </h2>

        <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Repository</th>
                <th style={{ padding: '0.75rem 1rem' }}>Commit & Branch</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Triggered Date & Time</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#71717a', fontSize: '0.85rem' }}>
                    No documentation jobs executed yet. Import a GitHub repository to trigger automatic doc generation.
                  </td>
                </tr>
              ) : (
                stats.recentJobs.map((j) => (
                  <tr key={j.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#fafafa' }}>{j.repoName}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                      {j.sha} main
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-purple">{j.status}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                      {j.displayTime || formatFormattedTimestamp(j.createdAt)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button onClick={() => onNavigate('jobs')} className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
                        Details <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
