import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, FolderGit2, Cpu, DollarSign, Activity, Search, X, CheckCircle2, Lock } from 'lucide-react';
import { AdminStats } from '../types';
import { fetchAdminStats } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAdminStats().then((data) => setStats(data));
  }, []);

  if (!stats) return <div style={{ color: '#a1a1aa' }}>Loading Admin Master Telemetry...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Superadmin Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem 2rem',
          backgroundColor: '#0c0c0f',
          borderColor: 'rgba(124, 58, 237, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>
            <ShieldCheck size={12} /> Superadmin Access Enabled
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', margin: 0 }}>
            Admin Master Dashboard
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Global system infrastructure, BullMQ queues, user quotas, and LLM budget telemetry.
          </p>
        </div>
      </div>

      {/* 4 Global KPI Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <Users size={16} color="#a78bfa" /> Platform Users
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.25rem' }}>{stats.totalUsers}</div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>{stats.activeUsersToday} active today</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <FolderGit2 size={16} color="#34d399" /> Repos Connected
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.25rem' }}>{stats.totalReposConnected}</div>
          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>across all organizations</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <Cpu size={16} color="#60a5fa" /> Total Doc Gen Jobs
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.25rem' }}>{stats.totalDocJobs}</div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>98.4% success rate</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <DollarSign size={16} color="#fbbf24" /> Global LLM Spend
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>${stats.globalLlmSpendUsd.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Gemini 1.5 Pro & Flash</div>
        </div>
      </div>

      {/* 3 BullMQ Queue Cards */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="#a78bfa" /> BullMQ Infrastructure Pipeline Queues
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {stats.queues.map((q) => (
            <div key={q.name} className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
              <div style={{ fontWeight: 700, color: '#fafafa', fontSize: '0.9rem', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                {q.name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', color: '#a1a1aa' }}>
                <div>Active: <strong style={{ color: '#34d399' }}>{q.active}</strong></div>
                <div>Waiting: <strong style={{ color: '#fbbf24' }}>{q.waiting}</strong></div>
                <div>Completed: <strong style={{ color: '#fafafa' }}>{q.completed}</strong></div>
                <div>Failed: <strong style={{ color: '#f87171' }}>{q.failed}</strong></div>
              </div>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #1e1e22', fontSize: '0.7rem', color: '#71717a' }}>
                p95 Latency: <span style={{ color: '#a78bfa', fontWeight: 600 }}>{q.p95LatencyMs} ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Users Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa' }}>System Users & Plan Quotas</h2>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} color="#71717a" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search user email or handle..."
              className="input-field"
              style={{ paddingLeft: '2.25rem', fontSize: '0.8rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>User Profile</th>
                <th style={{ padding: '0.85rem 1rem' }}>Plan Tier</th>
                <th style={{ padding: '0.85rem 1rem' }}>Credit Balance</th>
                <th style={{ padding: '0.85rem 1rem' }}>Repos / Jobs</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.users
                .filter((u) => u.email.toLowerCase().includes(search.toLowerCase()))
                .map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#fafafa', fontSize: '0.9rem' }}>{u.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#71717a' }}>@{u.githubHandle || 'user'}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${u.plan === 'PRO' ? 'badge-purple' : 'badge-neutral'}`}>{u.plan}</span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#34d399' }}>{u.creditBalance} ⚡</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#a1a1aa' }}>
                      {u.reposCount} repos • {u.jobsCount} runs
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button onClick={() => setSelectedUser(u)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                        Inspect Deep-Dive
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Deep-Dive Audit Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0c0c0f',
              borderColor: '#27272a',
              borderRadius: '16px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#fafafa', fontSize: '1.1rem' }}>User Audit: {selectedUser.email}</div>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem', color: '#a1a1aa' }}>
              <div>Plan Tier: <strong style={{ color: '#a78bfa' }}>{selectedUser.plan}</strong></div>
              <div>Current Balance: <strong style={{ color: '#34d399' }}>{selectedUser.creditBalance} ⚡</strong></div>
              <div>Connected Repos: <strong>{selectedUser.reposCount}</strong></div>
              <div>Doc Jobs Executed: <strong>{selectedUser.jobsCount}</strong></div>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #27272a', display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }}>Grant +50 Credits</button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>Impersonate Session</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
