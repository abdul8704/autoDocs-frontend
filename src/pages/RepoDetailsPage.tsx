import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, GitBranch, GitCommit, FileText, Cpu, Copy, Check, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchRepoDetails, fetchRepoDocs, triggerDocGen, formatFormattedTimestamp } from '../services/api';
import { PipelineTimeline } from '../components/PipelineTimeline';

interface RepoDetailsPageProps {
  repoId: string;
  onBack: () => void;
}

export const RepoDetailsPage: React.FC<RepoDetailsPageProps> = ({ repoId, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [repoData, setRepoData] = useState<any>(null);
  const [docContent, setDocContent] = useState<string | null>(null);

  const loadData = async () => {
    const [details, docs] = await Promise.all([
      fetchRepoDetails(repoId),
      fetchRepoDocs(repoId),
    ]);
    if (details && details.repo) {
      setRepoData(details);
    }
    if (docs && docs.content) {
      setDocContent(docs.content);
    }
  };

  useEffect(() => {
    loadData();
  }, [repoId]);

  const defaultMarkdown = `# ARCHITECTURE.md

## System Architecture Overview

This repository documentation is automatically generated and synchronized on every git commit.

\`\`\`mermaid
graph TD
    A[Git Push Webhook] --> B[Codebase Diff Scanner]
    B --> C[Gemini LLM Engine]
    C --> D[Pull Request Sync]
\`\`\`
`;

  const activeContent = docContent || defaultMarkdown;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await triggerDocGen(repoId);
      alert(res.message || 'Manual Doc Generation queued successfully!');
      await loadData();
    } catch (err) {
      alert(`Trigger error: ${(err as Error).message}`);
    } finally {
      setTriggering(false);
    }
  };

  const repoName = repoData?.repo?.full_name || 'facebook/react';
  const branch = repoData?.repo?.default_branch || 'main';
  const lastCommit = repoData?.repo?.last_processed_commit?.slice(0, 7) || 'e8f9a2b';
  const status = repoData?.repo?.sync_status || 'Synchronized';
  const jobsList = repoData?.repo?.jobs || [];
  const latestJob = repoData?.latestJob || jobsList[0] || null;

  const completedJobsCount =
    repoData?.stats?.completedJobs ??
    jobsList.filter((j: any) => j.status === 'COMPLETED' || j.status === 'PR_OPEN' || j.status === 'MERGED').length;

  const totalJobsCount = repoData?.stats?.totalJobs ?? jobsList.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Repo Action Header */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={onBack} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fafafa', margin: 0 }}>{repoName}</h1>
                <span className="badge badge-success">● {status}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span><GitBranch size={14} color="#a78bfa" /> {branch}</span>
                <span><GitCommit size={14} color="#34d399" /> sha:{lastCommit}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={handleTrigger} disabled={triggering} className="btn btn-primary">
              <Play size={16} className={triggering ? 'animate-spin' : ''} /> {triggering ? 'Triggering...' : 'Trigger Manual Doc Gen'}
            </button>
          </div>
        </div>

        {/* Dynamic Pipeline Timeline Stepper */}
        <PipelineTimeline
          isFirstTime={latestJob?.isFirstTime ?? false}
          status={latestJob?.status || 'COMPLETED'}
          reasoning={latestJob?.judgeReasoning || latestJob?.errorLog}
          prLink={latestJob?.prLink}
        />
      </div>

      {/* 70 / 30 SPLIT LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 1024 ? '70% 30%' : '1fr', gap: '1.5rem' }}>
        {/* LEFT 70% CANVAS: Markdown Document Viewer */}
        <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #27272a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#a78bfa" />
              <span style={{ fontWeight: 700, color: '#fafafa', fontSize: '1rem' }}>ARCHITECTURE.md</span>
            </div>
            <button onClick={handleCopy} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Markdown'}
            </button>
          </div>

          {/* Rendered Markdown Body Container */}
          <div style={{ color: '#fafafa', lineHeight: 1.7, fontSize: '0.9rem' }}>
            <ReactMarkdown>{activeContent}</ReactMarkdown>
          </div>
        </div>

        {/* RIGHT 30% CANVAS: Job History & Cost Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
            <div style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 600 }}>Total Repository Jobs</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', margin: '0.25rem 0' }}>
              {completedJobsCount} Completed
            </div>
            <div style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 700 }}>
              {totalJobsCount} Total Runs
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', flex: 1 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fafafa', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={16} color="#a78bfa" /> Execution Run History
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {jobsList.length === 0 ? (
                <div style={{ color: '#71717a', fontSize: '0.8rem' }}>No execution history available for this repo yet.</div>
              ) : (
                jobsList.map((run: any) => {
                  const isFailed = run.status === 'FAILED';
                  const isSuccess = run.status === 'PR_OPEN' || run.status === 'COMPLETED' || run.status === 'MERGED';
                  const isDropped = run.status === 'DROPPED' || run.status === 'LLM_JUDGE_REJECTED';
                  const prUrl = run.prLink || run.prUrl;
                  const prNumber = run.pullRequestId || run.prNumber;

                  return (
                    <div
                      key={run.id}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#121215',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>#{run.id.slice(0, 8)}</span>
                        <span
                          className={`badge ${
                            isSuccess
                              ? 'badge-success'
                              : isFailed
                              ? 'badge-danger'
                              : isDropped
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#71717a', fontSize: '0.75rem' }}>
                        <span>SHA: {run.triggerCommit ? run.triggerCommit.slice(0, 7) : run.sha ? run.sha.slice(0, 7) : 'HEAD'}</span>
                        {isSuccess && (
                          <span style={{ color: '#34d399', fontWeight: 600 }}>
                            {run.creditsUsed !== null && run.creditsUsed !== undefined ? `${run.creditsUsed} ⚡` : '10 ⚡'}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#52525b', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                        {formatFormattedTimestamp(run.createdAt)}
                      </div>

                      {prUrl && (
                        <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid #1e1e22', display: 'flex', justifyContent: 'flex-end' }}>
                          <a
                            href={prUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            style={{
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: '#a78bfa',
                              borderColor: 'rgba(167, 139, 250, 0.3)',
                              backgroundColor: 'rgba(167, 139, 250, 0.1)',
                            }}
                          >
                            Review PR {prNumber ? `#${prNumber}` : ''} <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
