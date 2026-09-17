import React, { useEffect, useState } from 'react';
import { Plus, Zap, TrendingUp, Clock, GitBranch, Calendar } from 'lucide-react';
import { BillingSummary } from '../types';
import { fetchBillingSummary, requestCreditGrant, formatFormattedTimestamp, formatDescriptionText } from '../services/api';

export const BillingPage: React.FC = () => {
  const [data, setData] = useState<BillingSummary | null>(null);
  const [creditsNeeded, setCreditsNeeded] = useState<number>(20);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'requests'>('ledger');
  const [timeframe, setTimeframe] = useState<'7d' | '28d' | 'all'>('7d');

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

  if (!data) return <div style={{ color: '#a1a1aa', padding: '2rem' }}>Loading Billing & Ledger data...</div>;

  const currentSeries =
    timeframe === '7d'
      ? data.history7d || []
      : timeframe === '28d'
      ? data.history28d || []
      : data.historyAllTime || [];

  // Generate SVG path for line chart
  const renderLineChart = () => {
    if (!currentSeries || currentSeries.length === 0) {
      return (
        <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: '0.8rem' }}>
          No credit usage recorded for this timeframe.
        </div>
      );
    }

    const width = 500;
    const height = 130;
    const padding = 20;

    const maxVal = Math.max(...currentSeries.map((d) => d.credits), 5);
    const points = currentSeries.map((item, idx) => {
      const x = padding + (idx / Math.max(1, currentSeries.length - 1)) * (width - 2 * padding);
      const y = height - padding - (item.credits / maxVal) * (height - 2 * padding);
      return { x, y, val: item.credits, label: item.date };
    });

    const pathD = points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '140px', overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#27272a" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" />

          {/* Gradient Area Fill */}
          <path d={areaD} fill="url(#chartGrad)" />

          {/* Main Line Path */}
          <path d={pathD} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={p.val > 0 ? 4 : 2} fill={p.val > 0 ? '#34d399' : '#a78bfa'} stroke="#0c0c0f" strokeWidth="2">
                <title>{`${p.label}: ${p.val} ⚡ credits used`}</title>
              </circle>
            </g>
          ))}
        </svg>

        {/* X-Axis Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#71717a', padding: '0 0.5rem' }}>
          <span>{currentSeries[0]?.date}</span>
          {currentSeries.length > 2 && (
            <span>{currentSeries[Math.floor(currentSeries.length / 2)]?.date}</span>
          )}
          <span>{currentSeries[currentSeries.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* TOP 2-CARD LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 1024 ? '60% 40%' : '1fr', gap: '1.5rem' }}>
        
        {/* CARD 1: Active Credit Balance & Line Graph Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          
          {/* Main Content Split: Left Balance, Right Line Graph */}
          <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: '1.25rem', alignItems: 'flex-start' }}>
            
            {/* Left Side: Active Balance */}
            <div>
              <div style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 600, marginBottom: '0.5rem' }}>
                Active Credit Balance
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem', marginBottom: '0.75rem', display: 'inline-block' }}>
                {data.tier}
              </span>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fafafa', letterSpacing: '-0.03em' }}>
                  {data.balance}
                </span>
                <span style={{ fontSize: '1.2rem', color: '#eab308', fontWeight: 700 }}>⚡ Credits</span>
              </div>
            </div>

            {/* Right Side: Credit Usage Line Graph */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <TrendingUp size={14} color="#a78bfa" /> Credit Usage History
                </span>

                {/* Timeframe Toggle Buttons */}
                <div style={{ display: 'flex', backgroundColor: '#18181b', padding: '0.2rem', borderRadius: '6px', border: '1px solid #27272a' }}>
                  <button
                    onClick={() => setTimeframe('7d')}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: timeframe === '7d' ? '#27272a' : 'transparent',
                      color: timeframe === '7d' ? '#fafafa' : '#71717a',
                      cursor: 'pointer',
                    }}
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => setTimeframe('28d')}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: timeframe === '28d' ? '#27272a' : 'transparent',
                      color: timeframe === '28d' ? '#fafafa' : '#71717a',
                      cursor: 'pointer',
                    }}
                  >
                    28 days
                  </button>
                  <button
                    onClick={() => setTimeframe('all')}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: timeframe === 'all' ? '#27272a' : 'transparent',
                      color: timeframe === 'all' ? '#fafafa' : '#71717a',
                      cursor: 'pointer',
                    }}
                  >
                    All time
                  </button>
                </div>
              </div>

              {/* Line Chart Component */}
              {renderLineChart()}
            </div>
          </div>

          {/* Bottom Row: Today & 7-Day Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #1e1e22' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#121215', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #27272a' }}>
              <Zap size={16} color="#eab308" />
              <div>
                <div style={{ fontSize: '0.7rem', color: '#a1a1aa', fontWeight: 500 }}>Credits used today</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fafafa' }}>
                  {data.creditsUsedToday || 0} <span style={{ fontSize: '0.8rem', color: '#eab308' }}>⚡</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#121215', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #27272a' }}>
              <Calendar size={16} color="#34d399" />
              <div>
                <div style={{ fontSize: '0.7rem', color: '#a1a1aa', fontWeight: 500 }}>Credits used last 7 days</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>
                  {data.creditsUsed7d || 0} <span style={{ fontSize: '0.8rem', color: '#eab308' }}>⚡</span>
                </div>
              </div>
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

        {/* TAB 1: Immutable Credit Ledger Table */}
        {activeTab === 'ledger' && (
          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.9rem 1.2rem' }}>Date & Time</th>
                  <th style={{ padding: '0.9rem 1.2rem' }}>Type</th>
                  <th style={{ padding: '0.9rem 1.2rem' }}>Repo Name</th>
                  <th style={{ padding: '0.9rem 1.2rem' }}>Description</th>
                  <th style={{ padding: '0.9rem 1.2rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                    {/* 1. Date & Time */}
                    <td style={{ padding: '0.9rem 1.2rem', fontSize: '0.85rem', color: '#fafafa', fontFamily: 'var(--font-mono)' }}>
                      {formatFormattedTimestamp(tx.createdAt || tx.transactionDate)}
                    </td>

                    {/* 2. Type */}
                    <td style={{ padding: '0.9rem 1.2rem' }}>
                      <span className="badge badge-neutral">{tx.type}</span>
                    </td>

                    {/* 3. Repo Name */}
                    <td style={{ padding: '0.9rem 1.2rem', fontSize: '0.85rem', color: tx.repoName && tx.repoName !== '-' ? '#a78bfa' : '#71717a', fontWeight: tx.repoName && tx.repoName !== '-' ? 600 : 400 }}>
                      {tx.repoName && tx.repoName !== '-' ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <GitBranch size={13} color="#a78bfa" />
                          {tx.repoName}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* 4. Description */}
                    <td style={{ padding: '0.9rem 1.2rem', fontSize: '0.85rem', color: '#a1a1aa' }}>
                      {formatDescriptionText(tx.description)}
                    </td>

                    {/* 5. Amount */}
                    <td
                      style={{
                        padding: '0.9rem 1.2rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: '0.9rem',
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
                  <th style={{ padding: '0.9rem 1.2rem' }}>Requested Credits</th>
                  <th style={{ padding: '0.9rem 1.2rem' }}>Reason</th>
                  <th style={{ padding: '0.9rem 1.2rem' }}>Status</th>
                  <th style={{ padding: '0.9rem 1.2rem' }}>Admin Notes</th>
                  <th style={{ padding: '0.9rem 1.2rem', textAlign: 'right' }}>Submitted Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                    <td style={{ padding: '0.9rem 1.2rem', fontWeight: 700, color: '#a78bfa' }}>{req.requestedCredits} ⚡</td>
                    <td style={{ padding: '0.9rem 1.2rem', fontSize: '0.85rem', color: '#fafafa' }}>{req.reason}</td>
                    <td style={{ padding: '0.9rem 1.2rem' }}>
                      <span className={`badge ${req.status === 'APPROVED' ? 'badge-success' : req.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{req.status}</span>
                    </td>
                    <td style={{ padding: '0.9rem 1.2rem', fontSize: '0.8rem', color: '#71717a' }}>{req.adminNotes || '—'}</td>
                    <td style={{ padding: '0.9rem 1.2rem', textAlign: 'right', fontSize: '0.8rem', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                      {formatFormattedTimestamp(req.createdAt)}
                    </td>
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
