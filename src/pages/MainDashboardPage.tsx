import React, { useEffect, useState } from 'react';
import { FolderGit2, Cpu, GitPullRequest, Zap, ArrowUpRight, Activity, RefreshCw } from 'lucide-react';
import { DashboardStats, User } from '../types';
import { fetchDashboardStats } from '../services/api';

interface MainDashboardPageProps {
  onNavigate: (screen: string) => void;
  user?: User | null;
}

export const MainDashboardPage: React.FC<MainDashboardPageProps> = ({ onNavigate, user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  console.log('[MainDashboardPage] Current Stats State:', stats);

  useEffect(() => {
    console.log('[MainDashboardPage] Requesting fetchDashboardStats...');
    fetchDashboardStats()
      .then((data) => {
        console.log('[MainDashboardPage] fetchDashboardStats resolved:', data);
        setStats(data);
      })
      .catch((err) => {
        console.error('[MainDashboardPage] fetchDashboardStats error:', err);
      });
  }, []);

  if (!stats) return <div style={{ color: '#a1a1aa', padding: '1rem' }}>Loading AutoDocs Dashboard...</div>;
  console.log(stats);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <FolderGit2 size={16} color="#a78bfa" /> Imported Repos
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.25rem' }}>
            {stats.importedReposCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Active Sync Operational</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <Cpu size={16} color="#34d399" /> Doc Jobs Executed
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.25rem' }}>
            {stats.totalJobsExecuted}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a78bfa' }}>7-day activity log</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <Activity size={16} color="#fbbf24" /> Active Pipelines
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.25rem' }}>
            {stats.activePipelinesCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>BullMQ queues healthy</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <GitPullRequest size={16} color="#60a5fa" /> Open Pull Requests
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.25rem' }}>
            {stats.openPullRequestsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Ready for GitHub review</div>
        </div>
      </div>

      {/* MIDDLE 2-COLUMN GRID: Quota Velocity Card + Live Webhook Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 1024 ? '50% 50%' : '1fr', gap: '1.5rem' }}>
        {/* CARD 5: Monthly Quota Velocity Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>Monthly Generation Quota</h3>
            <span className="badge badge-purple">{user?.plan ? `${user.plan} Tier` : 'Free Tier'}</span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '0.35rem' }}>
              <span>{user?.quotaUsed ?? stats.totalJobsExecuted} / {user?.monthlyQuota ?? 100} Docs Generated</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>
                {Math.max(0, (user?.monthlyQuota ?? 100) - (user?.quotaUsed ?? stats.totalJobsExecuted))} Remaining
              </span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#1e1e22', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, (((user?.quotaUsed ?? stats.totalJobsExecuted) / (user?.monthlyQuota ?? 100)) * 100)))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #7c3aed, #34d399)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #1e1e22' }}>
            <span style={{ fontSize: '0.8rem', color: '#71717a' }}>Resets in 12 Days</span>
            <button onClick={() => onNavigate('billing')} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
              Upgrade Plan <Zap size={14} />
            </button>
          </div>
        </div>

        {/* CARD 6: Live Webhook & Pipeline Feed Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fafafa', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} color="#34d399" /> Live Webhook Event Feed
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              ● Live Stream
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.liveEvents.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#71717a', fontSize: '0.85rem' }}>
                No live webhook events received yet. Push a commit or open a PR on an imported repo.
              </div>
            ) : (
              stats.liveEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#fafafa' }}>{ev.repoName}</span>
                    <div style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>{ev.message}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{ev.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CARD 7: Recent Documentation Jobs Table */}
      <div>
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
                <th style={{ padding: '0.75rem 1rem' }}>Triggered</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#71717a', fontSize: '0.85rem' }}>
                    No documentation jobs executed yet. Import a GitHub repository to trigger automatic AST doc generation.
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
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#71717a' }}>{j.createdAt}</td>
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

