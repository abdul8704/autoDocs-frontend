import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  FolderGit2,
  Cpu,
  DollarSign,
  Activity,
  Search,
  X,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { ActiveScreen, AdminStats, getNumericCreditBalance } from '../types';
import {
  approveCreditRequestApi,
  fetchAdminCreditRequests,
  fetchAdminStats,
  promoteUserToAdminApi,
  rejectCreditRequestApi,
  formatFormattedTimestamp,
} from '../services/api';

interface AdminDashboardPageProps {
  onNavigate?: (screen: ActiveScreen) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [creditRequests, setCreditRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests'>('overview');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states for approving/rejecting requests
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [approvedAmount, setApprovedAmount] = useState<number>(10);
  const [adminNote, setAdminNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminStats, requests] = await Promise.all([
        fetchAdminStats(),
        fetchAdminCreditRequests(),
      ]);
      setStats(adminStats);
      setCreditRequests(requests);
    } catch (err) {
      console.error('[AdminDashboard] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await approveCreditRequestApi(selectedRequest.id, approvedAmount, adminNote);
      alert(`Request approved! Granted ${approvedAmount} credits to ${selectedRequest.userEmail}.`);
      setSelectedRequest(null);
      setActionType(null);
      setAdminNote('');
      loadData();
    } catch (err) {
      alert(`Approval error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await rejectCreditRequestApi(selectedRequest.id, adminNote);
      alert(`Request rejected for ${selectedRequest.userEmail}.`);
      setSelectedRequest(null);
      setActionType(null);
      setAdminNote('');
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromoteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to promote ${userEmail} to ADMIN?`)) return;
    try {
      await promoteUserToAdminApi(userId);
      alert(`User ${userEmail} has been promoted to ADMIN!`);
      await loadData();
    } catch (err) {
      alert(`Failed to promote user: ${(err as Error).message}`);
    }
  };

  if (!stats && loading) {
    return <div style={{ color: '#a1a1aa', padding: '2rem' }}>Loading Admin Master Telemetry & Database Users...</div>;
  }

  const pendingCount = creditRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
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
            <ShieldCheck size={12} /> Superadmin Master Console
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', margin: 0 }}>
            Admin Master Dashboard
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            System database users, BullMQ infrastructure, LLM spend, and manual credit grant requests.
          </p>
        </div>

        <button onClick={loadData} disabled={loading} className="btn btn-secondary">
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* 4 Global KPI Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <Users size={16} color="#a78bfa" /> System Users
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.25rem' }}>{stats?.totalUsers || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>{stats?.activeUsersToday || 0} active today</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <FolderGit2 size={16} color="#34d399" /> Repos Connected
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.25rem' }}>{stats?.totalReposConnected || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>across database</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <Cpu size={16} color="#60a5fa" /> Total Doc Jobs
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.25rem' }}>{stats?.totalDocJobs || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>100% database verified</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#71717a' }}>
            <DollarSign size={16} color="#fbbf24" /> Pending Grant Requests
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: pendingCount > 0 ? '#fbbf24' : '#34d399', marginTop: '0.25rem' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>awaiting admin action</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #27272a', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'overview' ? '#1e1e22' : 'transparent',
            color: activeTab === 'overview' ? '#fafafa' : '#71717a',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          System Users & Infrastructure ({stats?.users?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'requests' ? '#1e1e22' : 'transparent',
            color: activeTab === 'requests' ? '#fafafa' : '#71717a',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          Credit Grant Requests ({creditRequests.length})
          {pendingCount > 0 && (
            <span style={{ backgroundColor: '#eab308', color: '#000', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: System Users & Infrastructure Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* BullMQ Pipeline Queues */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#a78bfa" /> BullMQ Infrastructure Pipeline Queues
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {(stats?.queues || []).map((q) => (
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
                </div>
              ))}
            </div>
          </div>

          {/* Database System Users Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa' }}>Database System Users</h2>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={14} color="#71717a" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by email or handle..."
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
                    <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Plan Tier</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Credit Balance</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Repos / Jobs</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.users || [])
                    .filter((u) => u.email.toLowerCase().includes(search.toLowerCase()) || (u.githubHandle || '').toLowerCase().includes(search.toLowerCase()))
                    .map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#fafafa', fontSize: '0.9rem' }}>{u.email}</div>
                          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>@{u.githubHandle || 'user'}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${u.role === 'ADMIN' ? 'badge-success' : 'badge-neutral'}`}>
                            {u.role || 'USER'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${u.plan === 'PRO' ? 'badge-purple' : 'badge-neutral'}`}>{u.plan}</span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#34d399' }}>{getNumericCreditBalance(u.creditBalance)} ⚡</td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#a1a1aa' }}>
                          {u.reposCount} repos • {u.jobsCount} runs
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => handlePromoteUser(u.id, u.email)}
                                className="btn btn-primary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                title="Promote to Admin"
                              >
                                <ShieldCheck size={14} /> Promote to Admin
                              </button>
                            )}
                            <button onClick={() => setSelectedUser(u)} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                              Inspect Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Admin Credit Grant Requests Interface */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
              Manual Credit Grant Applications ({creditRequests.length})
            </h2>
          </div>

          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Applicant User</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Requested Credits</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Reason / Justification</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Submitted Date</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {creditRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#71717a', fontSize: '0.85rem' }}>
                      No manual credit grant applications found in database.
                    </td>
                  </tr>
                ) : (
                  creditRequests.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#fafafa', fontSize: '0.9rem' }}>{r.userEmail}</div>
                        <div style={{ fontSize: '0.75rem', color: '#71717a' }}>ID: {r.userId?.slice(0, 8)}</div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#a78bfa', fontSize: '1rem' }}>
                        {r.amountRequested} ⚡
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#fafafa', maxWidth: '300px' }}>
                        {r.reason || 'No justification provided.'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${r.status === 'APPROVED' ? 'badge-success' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                        {formatFormattedTimestamp(r.createdAt)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {r.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setSelectedRequest(r);
                                setActionType('approve');
                                setApprovedAmount(r.amountRequested || 10);
                              }}
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            >
                              <CheckCircle2 size={12} /> Accept
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(r);
                                setActionType('reject');
                              }}
                              className="btn btn-danger"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Audit Modal */}
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
            padding: '1rem',
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
              <div>User ID: <code style={{ color: '#fafafa' }}>{selectedUser.id}</code></div>
              <div>Plan Tier: <strong style={{ color: '#a78bfa' }}>{selectedUser.plan}</strong></div>
              <div>Current Balance: <strong style={{ color: '#34d399' }}>{getNumericCreditBalance(selectedUser.creditBalance)} ⚡</strong></div>
              <div>Connected Repos: <strong>{selectedUser.reposCount}</strong></div>
              <div>Doc Jobs Executed: <strong>{selectedUser.jobsCount}</strong></div>

              {/* User Direct Navigation Actions */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase' }}>
                  Direct User Actions
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    onNavigate?.('repos');
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                >
                  <FolderGit2 size={16} color="#34d399" /> View User's Repositories
                </button>

                <button
                  onClick={() => {
                    setSelectedUser(null);
                    onNavigate?.('jobs');
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                >
                  <Cpu size={16} color="#60a5fa" /> View User's Execution Logs
                </button>

                <button
                  onClick={() => {
                    setSelectedUser(null);
                    onNavigate?.('billing');
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                >
                  <DollarSign size={16} color="#fbbf24" /> View User's Billing & Credit Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accept / Reject Grant Request Modal */}
      {selectedRequest && actionType && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', borderRadius: '16px', padding: '1.75rem', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
                {actionType === 'approve' ? 'Approve Credit Grant Application' : 'Reject Credit Grant Application'}
              </h3>
              <button onClick={() => { setSelectedRequest(null); setActionType(null); }} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                Applicant User: <strong style={{ color: '#fafafa' }}>{selectedRequest.userEmail}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                Requested Credits: <strong style={{ color: '#a78bfa' }}>{selectedRequest.amountRequested} ⚡</strong>
              </div>

              {actionType === 'approve' && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>
                    Approved Credits Amount:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    className="input-field"
                    style={{ width: '100%' }}
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(parseInt(e.target.value) || 10)}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>
                  {actionType === 'approve' ? 'Admin Approval Note (Optional):' : 'Rejection Reason / Note:'}
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  style={{ width: '100%', resize: 'none' }}
                  placeholder={actionType === 'approve' ? 'Granted trial extension...' : 'Daily quota limit reached...'}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => { setSelectedRequest(null); setActionType(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                {actionType === 'approve' ? (
                  <button onClick={handleApprove} disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Approving...' : 'Approve & Grant Credits'}
                  </button>
                ) : (
                  <button onClick={handleReject} disabled={submitting} className="btn btn-danger">
                    {submitting ? 'Rejecting...' : 'Reject Application'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
