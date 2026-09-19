import React, { useEffect, useState } from 'react';
import {
  Search,
  Zap,
  ArrowUpRight,
  GitPullRequest,
  GitCommit,
  Radio,
  TrendingUp,
  RefreshCw,
  Cpu,
  GitMerge,
} from 'lucide-react';
import { DocJob } from '../types';
import { fetchJobs, fetchJobsStats, retryJob, formatFormattedTimestamp } from '../services/api';
import { toast } from '../components/Toast';

interface JobStatsState {
  creditsBurnedToday: number;
  activeRepoHooks: number;
  docPRsDelivered: number;
  openPRsCount: number;
  activeJobsCount: number;
  actionRequiredCount: number;
}

export const JobsLogsPage: React.FC = () => {
  const [jobs, setJobs] = useState<DocJob[]>([]);
  const [stats, setStats] = useState<JobStatsState>({
    creditsBurnedToday: 0,
    activeRepoHooks: 0,
    docPRsDelivered: 0,
    openPRsCount: 0,
    activeJobsCount: 0,
    actionRequiredCount: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');

  const loadData = () => {
    fetchJobs().then((data) => {
      if (Array.isArray(data)) setJobs(data);
    });
    fetchJobsStats().then((s) => {
      if (s) setStats(s);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetryJob = async (jobId: string) => {
    setRetryingJobId(jobId);
    try {
      await retryJob(jobId);
      toast.success(`Job #${jobId.slice(0, 8)} re-queued successfully!`);
      loadData();
    } catch (err) {
      toast.error(`Retry error: ${(err as Error).message || err}`);
    } finally {
      setRetryingJobId(null);
    }
  };

  // Build time series data for Jobs Across Time Graph
  const getTimeSeriesData = () => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const now = new Date();
    const map: Record<string, number> = {};
    const series: Array<{ date: string; fullDate: string; count: number }> = [];

    const getLocalDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = getLocalDateKey(d);
      const display = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map[key] = 0;
      series.push({ date: display, fullDate: key, count: 0 });
    }

    jobs.forEach((j) => {
      if (j.createdAt) {
        const d = new Date(j.createdAt);
        if (!isNaN(d.getTime())) {
          const key = getLocalDateKey(d);
          if (map[key] !== undefined) {
            map[key] += 1;
          }
        }
      }
    });

    return series.map((s) => ({
      ...s,
      count: map[s.fullDate] || 0,
    }));
  };

  const currentSeries = getTimeSeriesData();

  // Render SVG Line Chart Graph
  const renderJobsLineChart = () => {
    if (!currentSeries || currentSeries.length === 0) {
      return (
        <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: '0.8rem' }}>
          No job execution metrics available.
        </div>
      );
    }

    const width = 500;
    const height = 120;
    const padding = 15;

    const maxVal = Math.max(...currentSeries.map((d) => d.count), 4);
    const points = currentSeries.map((item, idx) => {
      const x = padding + (idx / Math.max(1, currentSeries.length - 1)) * (width - 2 * padding);
      const y = height - padding - (item.count / maxVal) * (height - 2 * padding);
      return { x, y, val: item.count, label: item.date };
    });

    const pathD = points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '130px', overflow: 'visible' }}>
          <defs>
            <linearGradient id="jobsChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#27272a" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" />

          {/* Gradient Area Fill */}
          <path d={areaD} fill="url(#jobsChartGrad)" />

          {/* Main Line Path */}
          <path d={pathD} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={p.val > 0 ? 4 : 2} fill={p.val > 0 ? '#a78bfa' : '#34d399'} stroke="#0c0c0f" strokeWidth="2">
                <title>{`${p.label}: ${p.val} job executions`}</title>
              </circle>
            </g>
          ))}
        </svg>

        {/* X-Axis Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#71717a', padding: '0 0.5rem', marginTop: '0.2rem' }}>
          <span>{currentSeries[0]?.date}</span>
          {currentSeries.length > 2 && <span>{currentSeries[Math.floor(currentSeries.length / 2)]?.date}</span>}
          <span>{currentSeries[currentSeries.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    const matchesSearch =
      j.id.toLowerCase().includes(search.toLowerCase()) ||
      (j.sha || '').toLowerCase().includes(search.toLowerCase()) ||
      (j.repoName || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* TOP INFORMATIVE SECTION: METRIC WIDGETS + JOBS ACROSS TIME GRAPH */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 1024 ? '35% 65%' : '1fr', gap: '1.25rem' }}>
        {/* LEFT COLUMN: KEY METRIC CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Card 1: Credits Burned Today */}
          <div className="glass-panel" style={{ padding: '1rem 1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 600 }}>Credits Burned Today</span>
              <div style={{ backgroundColor: '#27272a', padding: '0.35rem', borderRadius: '6px' }}>
                <Zap size={16} color="#eab308" />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fafafa', marginTop: '0.3rem' }}>
              {stats.creditsBurnedToday} <span style={{ fontSize: '1.1rem', color: '#eab308' }}>⚡</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.15rem' }}>
              Across {stats.activeRepoHooks} active repository hooks
            </div>
          </div>

          {/* Card 2: Doc PRs Delivered */}
          <div className="glass-panel" style={{ padding: '1rem 1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 600 }}>Doc PRs Delivered</span>
              <div style={{ backgroundColor: '#14532d33', padding: '0.35rem', borderRadius: '6px' }}>
                <GitPullRequest size={16} color="#34d399" />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '0.3rem' }}>
              {stats.docPRsDelivered}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.15rem' }}>
              {stats.openPRsCount} open PRs awaiting merge on GitHub
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: JOBS ACROSS TIME GRAPH PANEL */}
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#fafafa', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={16} color="#34d399" /> Jobs Execution History Across Time
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.15rem' }}>
                Total Executed Runs: <strong style={{ color: '#fafafa' }}>{jobs.length} jobs</strong>
              </div>
            </div>

            {/* Timeframe Toggle Pill Buttons */}
            <div style={{ display: 'flex', backgroundColor: '#18181b', padding: '0.2rem', borderRadius: '6px', border: '1px solid #27272a' }}>
              <button
                onClick={() => setTimeframe('7d')}
                style={{
                  padding: '0.25rem 0.6rem',
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
                onClick={() => setTimeframe('30d')}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: timeframe === '30d' ? '#27272a' : 'transparent',
                  color: timeframe === '30d' ? '#fafafa' : '#71717a',
                  cursor: 'pointer',
                }}
              >
                30 days
              </button>
              <button
                onClick={() => setTimeframe('all')}
                style={{
                  padding: '0.25rem 0.6rem',
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

          {/* SVG Line Chart Graph */}
          {renderJobsLineChart()}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={14} color="#71717a" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Job ID, Commit SHA, Repository..."
              className="input-field"
              style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input-field"
            style={{ width: '220px', fontSize: '0.85rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Job Statuses</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PR_OPEN">PR_OPEN</option>
            <option value="GENERATING">GENERATING</option>
            <option value="FAILED">FAILED</option>
            <option value="INSUFFICIENT_CREDITS">INSUFFICIENT_CREDITS</option>
            <option value="QUEUED">QUEUED</option>
            <option value="DROPPED">DROPPED</option>
            <option value="LLM_JUDGE_REJECTED">LLM_JUDGE_REJECTED</option>
          </select>
        </div>

        <button onClick={loadData} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* FULL WIDTH EXECUTION LOGS TABLE */}
      <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0.9rem 1.2rem' }}>Job ID</th>
              <th style={{ padding: '0.9rem 1.2rem' }}>Repository</th>
              <th style={{ padding: '0.9rem 1.2rem' }}>Commit SHA</th>
              <th style={{ padding: '0.9rem 1.2rem' }}>Trigger Event</th>
              <th style={{ padding: '0.9rem 1.2rem' }}>Executed Date & Time</th>
              <th style={{ padding: '0.9rem 1.2rem' }}>Status</th>
              <th style={{ padding: '0.9rem 1.2rem' }}>Credits Burned</th>
              <th style={{ padding: '0.9rem 1.2rem' }}>Pull Request</th>
              <th style={{ padding: '0.9rem 1.2rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#71717a', fontSize: '0.85rem' }}>
                  No execution runs match your current filter or search criteria.
                </td>
              </tr>
            ) : (
              filteredJobs.map((j) => {
                const canRetry = j.status === 'FAILED' || j.status === 'INSUFFICIENT_CREDITS' || j.status === 'DROPPED' || j.status === 'LLM_JUDGE_REJECTED' || j.status === 'QUEUED';
                const isRetrying = retryingJobId === j.id;

                return (
                  <tr
                    key={j.id}
                    style={{
                      borderBottom: '1px solid #1e1e22',
                      transition: 'background-color 0.15s ease',
                    }}
                    className="hover:bg-[#121215]"
                  >
                    {/* Job ID */}
                    <td style={{ padding: '1rem 1.2rem', fontWeight: 700, color: '#fafafa', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      #{j.id.slice(0, 8)}
                    </td>

                    {/* Repository */}
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.85rem', fontWeight: 600, color: '#fafafa' }}>
                      {j.repoName}
                    </td>

                    {/* Commit SHA */}
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.8rem', color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#1e1b4b', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #312e81' }}>
                        <GitCommit size={13} color="#a78bfa" />
                        {j.sha}
                      </div>
                    </td>

                    {/* Trigger Event */}
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.8rem', color: '#a1a1aa' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Radio size={12} color="#34d399" />
                        {j.triggerEvent || 'git.push (Webhook)'}
                      </div>
                    </td>

                    {/* Executed Date & Time */}
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.8rem', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                      {j.displayTime || formatFormattedTimestamp(j.createdAt)}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <span className={`badge ${j.status === 'MERGED' ? 'badge-purple' : j.status === 'PR_OPEN' || j.status === 'COMPLETED' ? 'badge-success' : j.status === 'FAILED' || j.status === 'INSUFFICIENT_CREDITS' ? 'badge-danger' : 'badge-warning'}`}>
                        {j.status}
                      </span>
                    </td>

                    {/* Credits Burned */}
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.85rem', fontWeight: 700, color: j.creditsUsed > 0 ? '#fafafa' : '#71717a' }}>
                      {j.creditsUsed} <span style={{ color: '#eab308' }}>⚡</span>
                    </td>

                    {/* Link to PR */}
                    <td style={{ padding: '1rem 1.2rem', fontSize: '0.85rem' }}>
                      {j.status === 'MERGED' ? (
                        j.prUrl ? (
                          <a
                            href={j.prUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            style={{
                              padding: '0.3rem 0.65rem',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              color: '#c084fc',
                              borderColor: 'rgba(168, 85, 247, 0.4)',
                              backgroundColor: 'rgba(168, 85, 247, 0.12)',
                              textDecoration: 'none',
                            }}
                          >
                            <GitMerge size={13} color="#c084fc" />
                            Merged {j.prNumber ? `#${j.prNumber}` : ''} <ArrowUpRight size={13} color="#c084fc" />
                          </a>
                        ) : (
                          <span style={{ color: '#c084fc', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <GitMerge size={13} color="#c084fc" /> Merged
                          </span>
                        )
                      ) : j.status === 'PR_OPEN' && j.prUrl ? (
                        <a
                          href={j.prUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: '#34d399',
                            borderColor: '#05966944',
                            backgroundColor: '#064e3b22',
                            textDecoration: 'none',
                          }}
                        >
                          <GitPullRequest size={13} color="#34d399" />
                          Review PR #{j.prNumber || ''} <ArrowUpRight size={13} color="#34d399" />
                        </a>
                      ) : (
                        <span style={{ color: '#52525b', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                      {canRetry ? (
                        <button
                          onClick={() => handleRetryJob(j.id)}
                          disabled={isRetrying}
                          className="btn btn-primary"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: isRetrying ? 'not-allowed' : 'pointer',
                            opacity: isRetrying ? 0.7 : 1,
                          }}
                        >
                          <RefreshCw size={12} className={isRetrying ? 'spin' : ''} />
                          {isRetrying ? 'Retrying...' : 'Retry Job'}
                        </button>
                      ) : j.status === 'MERGED' && j.prUrl ? (
                        <a
                          href={j.prUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}
                        >
                          Merged PR
                        </a>
                      ) : j.status === 'PR_OPEN' && j.prUrl ? (
                        <a
                          href={j.prUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none' }}
                        >
                          Open GitHub
                        </a>
                      ) : (
                        <span style={{ color: '#52525b', fontSize: '0.75rem' }}>Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
