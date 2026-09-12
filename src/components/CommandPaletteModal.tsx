import React, { useEffect, useState } from 'react';
import { Search, FolderGit2, Cpu, FileText, X, ArrowRight } from 'lucide-react';
import { performGlobalSearch } from '../services/api';
import { SearchResults } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await performGlobalSearch(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#0c0c0f',
          borderColor: '#27272a',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #27272a', gap: '0.75rem' }}>
          <Search size={20} color="#a1a1aa" />
          <input
            id="command-palette-title"
            type="text"
            autoFocus
            placeholder="Search repositories, commits, jobs, docs (⌘K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fafafa',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem 1rem' }}>
          {loading && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#a1a1aa', fontSize: '0.9rem' }}>
              Searching AutoDocs database...
            </div>
          )}

          {!loading && !query && (
            <div style={{ padding: '1rem', color: '#71717a', fontSize: '0.85rem' }}>
              <p style={{ fontWeight: 600, color: '#a1a1aa', marginBottom: '0.5rem' }}>Quick Navigation Shortcuts:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <button
                  onClick={() => { onNavigate('dashboard'); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                    background: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', cursor: 'pointer'
                  }}
                >
                  <FolderGit2 size={14} color="#a78bfa" /> Main Dashboard
                </button>
                <button
                  onClick={() => { onNavigate('repos'); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                    background: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', cursor: 'pointer'
                  }}
                >
                  <FolderGit2 size={14} color="#34d399" /> Repositories Hub
                </button>
                <button
                  onClick={() => { onNavigate('jobs'); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                    background: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', cursor: 'pointer'
                  }}
                >
                  <Cpu size={14} color="#fbbf24" /> Jobs & Telemetry Logs
                </button>
                <button
                  onClick={() => { onNavigate('billing'); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                    background: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', cursor: 'pointer'
                  }}
                >
                  <FileText size={14} color="#60a5fa" /> Billing & Credit Ledger
                </button>
              </div>
            </div>
          )}

          {!loading && query && results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Repositories */}
              {results.repositories.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#71717a', marginBottom: '0.35rem' }}>
                    Repositories ({results.repositories.length})
                  </div>
                  {results.repositories.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => { onNavigate('repo-details'); onClose(); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                        background: '#121215', marginBottom: '0.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FolderGit2 size={16} color="#a78bfa" />
                        <span style={{ fontWeight: 600, color: '#fafafa', fontSize: '0.9rem' }}>{r.fullName}</span>
                      </div>
                      <ArrowRight size={14} color="#71717a" />
                    </div>
                  ))}
                </div>
              )}

              {/* Jobs */}
              {results.jobs.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#71717a', marginBottom: '0.35rem' }}>
                    Jobs & Execution Runs ({results.jobs.length})
                  </div>
                  {results.jobs.map((j) => (
                    <div
                      key={j.id}
                      onClick={() => { onNavigate('jobs'); onClose(); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                        background: '#121215', marginBottom: '0.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Cpu size={16} color="#34d399" />
                        <div>
                          <span style={{ fontWeight: 600, color: '#fafafa', fontSize: '0.85rem' }}>#{j.id}</span>
                          <span style={{ color: '#71717a', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({j.repoName} @ {j.sha})</span>
                        </div>
                      </div>
                      <span className="badge badge-success">{j.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Documentation */}
              {results.docs.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#71717a', marginBottom: '0.35rem' }}>
                    Generated Documentation
                  </div>
                  {results.docs.map((d, idx) => (
                    <div
                      key={idx}
                      onClick={() => { onNavigate('repo-details'); onClose(); }}
                      style={{
                        padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                        background: '#121215', marginBottom: '0.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <FileText size={16} color="#60a5fa" />
                        <span style={{ fontWeight: 600, color: '#fafafa', fontSize: '0.85rem' }}>{d.repoName} / {d.path}</span>
                      </div>
                      <p style={{ color: '#a1a1aa', fontSize: '0.75rem', margin: 0 }}>{d.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
