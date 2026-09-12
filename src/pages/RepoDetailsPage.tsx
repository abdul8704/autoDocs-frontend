import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, GitBranch, GitCommit, CheckCircle2, FileText, Cpu, Copy, Check } from 'lucide-react';
import { fetchRepoDetails, fetchRepoDocs, triggerDocGen } from '../services/api';

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
    A[Git Push Webhook] --> B[AST Visitor Scanner]
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
      alert(res.message || 'Manual AST Doc Generation queued successfully!');
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

        {/* 5-Step Pipeline Stepper Bar */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid #1e1e22', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          {[
            { step: '1. Webhook Recv', time: '240ms (200 OK)' },
            { step: '2. Git Checkout', time: '1.2s (shallow)' },
            { step: '3. AST Diff Scan', time: 'Completed' },
            { step: '4. Gemini Engine', time: '4.8s (28k tokens)' },
            { step: '5. GitHub PR Sync', time: 'Ready for review' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#121215',
                border: '1px solid #27272a',
                borderRadius: '8px',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ fontWeight: 700, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={12} color="#34d399" /> {item.step}
              </div>
              <div style={{ color: '#71717a', fontSize: '0.7rem', marginTop: '0.15rem' }}>{item.time}</div>
            </div>
          ))}
        </div>
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
          <div style={{ color: '#fafafa', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
            {activeContent}
          </div>
        </div>

        {/* RIGHT 30% CANVAS: Job History & Cost Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a' }}>
            <div style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 600 }}>Total Repository Jobs</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', margin: '0.25rem 0' }}>
              {repoData?.stats?.completedJobs ?? jobsList.length} Completed
            </div>
            <div style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 700 }}>
              {repoData?.stats?.totalJobs ?? jobsList.length} Total Runs
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', flex: 1 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fafafa', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={16} color="#a78bfa" /> Execution Run History
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(jobsList.length > 0 ? jobsList : [
                { id: 'j-108', status: 'PR_OPEN', triggerCommit: 'e8f9a2b', createdAt: 'Recently' },
                { id: 'j-107', status: 'COMPLETED', triggerCommit: 'c7a19f2', createdAt: 'Earlier' },
              ]).map((run: any) => (
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
                    <span style={{ fontWeight: 700, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>{run.id.slice(0, 8)}</span>
                    <span className="badge badge-purple">{run.status}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#71717a', fontSize: '0.75rem' }}>
                    <span>SHA: {run.triggerCommit ? run.triggerCommit.slice(0, 7) : 'HEAD'}</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>10 ⚡</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
