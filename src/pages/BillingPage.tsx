import React, { useEffect, useState } from 'react';
import { CreditCard, Zap, Plus, ArrowUpRight, History, CheckCircle2, Clock } from 'lucide-react';
import { BillingSummary } from '../types';
import { fetchBillingSummary, requestCreditGrant } from '../services/api';

export const BillingPage: React.FC = () => {
  const [data, setData] = useState<BillingSummary | null>(null);
  const [creditsNeeded, setCreditsNeeded] = useState<number>(20);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'requests'>('ledger');

  const loadData = () => {
    fetchBillingSummary().then((res) => setData(res));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for the credit grant request.');
      return;
    }
    setSubmitting(true);
    try {
      await requestCreditGrant({ requestedCredits: creditsNeeded, reason });
      alert('Credit grant request submitted successfully!');
      setReason('');
      loadData();
    } catch (err) {
      alert(`Request error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return <div style={{ color: '#a1a1aa' }}>Loading Billing & Ledger data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* TOP 2-CARD LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 1024 ? '55% 45%' : '1fr', gap: '1.5rem' }}>
        {/* CARD 1: Active Ledger Balance Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 600 }}>Active Credit Balance</div>
            <span className="badge badge-purple">{data.tier}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fafafa', letterSpacing: '-0.03em' }}>{data.balance}</span>
            <span style={{ fontSize: '1.25rem', color: '#a78bfa', fontWeight: 700 }}>⚡ Credits</span>
          </div>

          {/* Allocation Progress Bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#71717a', marginBottom: '0.35rem' }}>
              <span>Monthly Allocation Progress</span>
              <span>{data.usedThisMonth} / {data.monthlyCap} Max Monthly Cap</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#1e1e22', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(data.usedThisMonth / data.monthlyCap) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #34d399)' }} />
            </div>
          </div>

          {/* Unit Cost Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #1e1e22', fontSize: '0.8rem' }}>
            <div>
              <div style={{ color: '#71717a' }}>Unit Cost / Git Pull</div>
              <div style={{ fontWeight: 700, color: '#fafafa', marginTop: '0.15rem' }}>{data.unitCostPerPull} ⚡ / AST scan</div>
            </div>
            <div>
              <div style={{ color: '#71717a' }}>7-Day Burn Rate</div>
              <div style={{ fontWeight: 700, color: '#34d399', marginTop: '0.15rem' }}>{data.burnRate7d} ⚡ consumed</div>
            </div>
          </div>
        </div>

        {/* CARD 2: Request Credit Grant Form */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} color="#34d399" /> Request Manual Credit Grant
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '1rem' }}>
            Submit a grant application to your workspace administrator for additional execution quota.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', display: 'block', marginBottom: '0.35rem' }}>
                Credits Needed:
              </label>
              <input
                type="number"
                min="5"
                max="100"
                className="input-field"
                value={creditsNeeded}
                onChange={(e) => setCreditsNeeded(Number(e.target.value))}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', display: 'block', marginBottom: '0.35rem' }}>
                Reason / Justification:
              </label>
              <textarea
                rows={2}
                placeholder="Describe project requirements or team trial..."
                className="input-field"
                style={{ fontFamily: 'inherit', resize: 'none' }}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ marginTop: '0.25rem' }}>
              {submitting ? 'Submitting...' : 'Submit Credit Request'}
            </button>
          </form>
        </div>
      </div>

      {/* TABBED TABLES SECTION */}
      <div>
        {/* Tab Triggers */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #27272a', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('ledger')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'ledger' ? '#1e1e22' : 'transparent',
              color: activeTab === 'ledger' ? '#fafafa' : '#71717a',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Immutable Credit Ledger ({data.ledger.length})
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
            }}
          >
            Dispatched Grant Requests ({data.requests.length})
          </button>
        </div>

        {/* TAB 1: Immutable Credit Ledger */}
        {activeTab === 'ledger' && (
          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Transaction Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#71717a' }}>{tx.createdAt}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-neutral">{tx.type}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#fafafa' }}>{tx.description}</td>
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: tx.amount > 0 ? '#34d399' : '#f87171',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount} ⚡
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Dispatched Grant Requests Table */}
        {activeTab === 'requests' && (
          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Requested Credits</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Admin Notes</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#a78bfa' }}>{req.requestedCredits} ⚡</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#fafafa' }}>{req.reason}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${req.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>{req.status}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#71717a' }}>{req.adminNotes || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.8rem', color: '#71717a' }}>{req.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
