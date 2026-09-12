import React, { useEffect, useState } from 'react';
import { Cpu, RefreshCw, Search, Filter, Play, CheckCircle2, AlertTriangle, Terminal, X, Zap, ArrowUpRight } from 'lucide-react';
import { DocJob } from '../types';
import { fetchJobById, fetchJobs, retryJob } from '../services/api';

export const JobsLogsPage: React.FC = () => {
  const [jobs, setJobs] = useState<DocJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DocJob | null>(null);
  const [liveStream, setLiveStream] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [retrying, setRetrying] = useState<boolean>(false);

  const loadData = () => {
    fetchJobs().then((data) => {
      setJobs(data);
      if (data.length > 0 && !selectedJob) setSelectedJob(data[0]);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectJob = async (j: DocJob) => {
    setSelectedJob(j);
    const details = await fetchJobById(j.id);
    if (details) {
      setSelectedJob({
        ...j,
        modelUsed: details.llmLogs && details.llmLogs[0] ? details.llmLogs[0].modelName : j.modelUsed,
        latencyMs: details.tokenBreakdown?.durationMs || j.latencyMs,
        tokenBreakdown: details.tokenBreakdown ? {
          prompt: details.tokenBreakdown.promptTokens || 0,
          cached: details.tokenBreakdown.cachedTokens || 0,
          input: details.tokenBreakdown.inputTokens || 0,
          output: details.tokenBreakdown.outputTokens || 0,
        } : j.tokenBreakdown,
        logs: details.stdoutLogs || j.logs,
      });
    }
  };

  const handleRetryJob = async (jobId: string) => {
    setRetrying(true);
    try {
      await retryJob(jobId);
      alert('Job re-queued successfully!');
      loadData();
    } catch (err) {
      alert(`Retry error: ${(err as Error).message}`);
    } finally {
      setRetrying(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    const matchesSearch = j.id.toLowerCase().includes(search.toLowerCase()) || j.sha.toLowerCase().includes(search.toLowerCase()) || j.repoName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Quick Metrics Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 600 }}>Avg AST Pipeline Latency</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.25rem' }}>3.12s</div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>⚡ Optimized Gemini 1.5 Pro TTFT</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 600 }}>Job Success Rate</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>98.4%</div>
          <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>1,248 completed runs</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
          <div style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 600 }}>Credits Burned Today</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.25rem' }}>18 ⚡</div>
          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>4 active repository hooks</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} color="#71717a" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Job ID, SHA, Repo..."
              className="input-field"
              style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input-field"
            style={{ width: '180px', fontSize: '0.85rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Job Statuses</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PR_OPEN">PR_OPEN</option>
            <option value="GENERATING">GENERATING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        {/* Live SSE Stream Toggle */}
        <button
          onClick={() => setLiveStream(!liveStream)}
          className={`btn ${liveStream ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: liveStream ? '#34d399' : '#71717a', display: 'inline-block' }} />
          {liveStream ? 'Live Telemetry Stream ON' : 'Paused'}
        </button>
      </div>

      {/* SPLIT TABLE & DRAWER LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '60% 40%' : '1fr', gap: '1.5rem' }}>
        {/* EXECUTION STREAM TABLE */}
        <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Job ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Repository</th>
                <th style={{ padding: '0.75rem 1rem' }}>Commit SHA</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Credits</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((j) => (
                <tr
                  key={j.id}
                  onClick={() => handleSelectJob(j)}
                  style={{
                    borderBottom: '1px solid #1e1e22',
                    backgroundColor: selectedJob?.id === j.id ? '#1e1e22' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>
                    #{j.id.slice(0, 8)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#fafafa' }}>
                    {j.repoName}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                    {j.sha}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${j.status === 'PR_OPEN' || j.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                      {j.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: '#fafafa' }}>
                    {j.creditsUsed} ⚡
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      {(j.status === 'FAILED' || j.status === 'INSUFFICIENT_CREDITS') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetryJob(j.id);
                          }}
                          disabled={retrying}
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <Play size={12} /> Retry
                        </button>
                      )}
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        <Terminal size={12} /> Logs
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TELEMETRY & LLM LOGS DRAWER (RIGHT PANEL) */}
        {selectedJob && (
          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={18} color="#34d399" />
                <span style={{ fontWeight: 700, color: '#fafafa' }}>Telemetry Logs #{selectedJob.id}</span>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* Token & Latency Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', backgroundColor: '#121215', padding: '0.85rem', borderRadius: '8px', border: '1px solid #27272a' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Assigned Model</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa' }}>{selectedJob.modelUsed || 'gemini-1.5-pro'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Latency / TTFT</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>{selectedJob.latencyMs || 3420} ms</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Prompt Tokens</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>
                  {selectedJob.tokenBreakdown?.prompt || 4200}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Output Tokens</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>
                  {selectedJob.tokenBreakdown?.output || 850}
                </div>
              </div>
            </div>

            {/* Stdout Terminal Log Output */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Stdout Console Stream
              </div>
              <div
                style={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {(selectedJob.logs || [
                  '[00:00.01] GitHub Webhook signature verified (event: push)',
                  '[00:00.24] Cloned commit e8f9a2b (shallow depth 1)',
                  '[00:01.44] AST diff scanner extracted 14 file changes',
                  '[00:01.88] Dispatched prompt sys.docgen.ast-v1.0 to Gemini 1.5 Pro',
                  '[00:03.42] Generated ARCHITECTURE.md diff successfully',
                  '[00:03.90] Pull Request #42 opened on GitHub',
                ]).map((logLine, idx) => (
                  <div key={idx} style={{ marginBottom: '0.2rem' }}>
                    {logLine}
                  </div>
                ))}
              </div>
            </div>

            {selectedJob.prUrl && (
              <a
                href={selectedJob.prUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.6rem' }}
              >
                Review Pull Request #{selectedJob.prNumber} <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
