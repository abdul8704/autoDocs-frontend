import React, { useEffect, useState } from 'react';
import { FolderGit2, Plus, Search, RefreshCw, ExternalLink, Play, Trash2, Shield, ArrowRight } from 'lucide-react';
import { AccessibleRepo, ImportedRepo } from '../types';
import { fetchAccessibleRepos, fetchImportedRepos, importRepository, deleteImportedRepository, formatFormattedTimestamp } from '../services/api';
import { toast } from '../components/Toast';

interface RepositoriesHubPageProps {
  onSelectRepo: (repoId: string) => void;
}

export const RepositoriesHubPage: React.FC<RepositoriesHubPageProps> = ({ onSelectRepo }) => {
  const [imported, setImported] = useState<ImportedRepo[]>([]);
  const [accessible, setAccessible] = useState<AccessibleRepo[]>([]);
  const [importedLoading, setImportedLoading] = useState<boolean>(true);
  const [accessibleLoading, setAccessibleLoading] = useState<boolean>(true);
  const [importingRepoId, setImportingRepoId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const loadData = () => {
    setImportedLoading(true);
    setAccessibleLoading(true);

    fetchImportedRepos()
      .then((impData) => {
        setImported(impData);
      })
      .catch((err) => console.error('Error loading imported repos:', err))
      .finally(() => setImportedLoading(false));

    fetchAccessibleRepos()
      .then((accData) => {
        setAccessible(accData);
      })
      .catch((err) => console.error('Error loading accessible repos:', err))
      .finally(() => setAccessibleLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImport = async (repo: AccessibleRepo) => {
    setImportingRepoId(repo.id);
    try {
      await importRepository({
        githubRepoId: repo.id,
        name: repo.fullName || repo.name,
        cloneUrl: repo.cloneUrl,
        installation_id: repo.installationId,
      });
      await loadData();
    } catch (err) {
      toast.error(`Import error: ${(err as Error).message}`);
    } finally {
      setImportingRepoId(null);
    }
  };

  const handleDelete = async (repoId: string) => {
    if (!confirm('Are you sure you want to unlink this repository?')) return;
    try {
      await deleteImportedRepository(repoId);
      await loadData();
    } catch (err) {
      toast.error(`Delete error: ${(err as Error).message}`);
    }
  };

  const importedGithubIds = new Set(imported.map((r) => r.githubRepoId || (r as any).github_repo_id || r.id));
  const importedNames = new Set(imported.map((r) => (r.fullName || (r as any).full_name || r.name || '').toLowerCase()));

  const filteredAccessible = accessible.filter((r) => {
    const rId = r.id || (r as any).githubRepoId;
    const rName = (r.fullName || r.name || '').toLowerCase();
    const isAlreadyImported = r.isImported || importedGithubIds.has(rId) || importedNames.has(rName);
    if (isAlreadyImported) return false;
    return search ? rName.includes(search.toLowerCase()) : true;
  });

  const currentImportingRepo = accessible.find((r) => r.id === importingRepoId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Import Loading Modal Overlay */}
      {importingRepoId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(9, 9, 11, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              backgroundColor: '#0c0c0f',
              borderColor: '#27272a',
              borderRadius: '20px',
              padding: '2.5rem',
              maxWidth: '460px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #34d399 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 0 30px rgba(124, 58, 237, 0.5)',
              }}
            >
              <RefreshCw size={32} color="#ffffff" style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fafafa', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Importing Repository...
            </h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Importing <code style={{ color: '#a78bfa' }}>{currentImportingRepo?.fullName || 'repository'}</code> into AutoDocs. Cloning codebase, setting up codebase scanner, and scheduling doc generation...
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                color: '#a78bfa',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a78bfa', animation: 'pulse 1.5s infinite' }} />
              Connecting Webhooks & Processing Request
            </div>
          </div>
        </div>
      )}

      {/* Summary Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem 2rem',
          backgroundColor: '#0c0c0f',
          borderColor: '#27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span className="badge badge-success" style={{ marginBottom: '0.35rem' }}>
            ● Webhooks Operational
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', margin: 0, letterSpacing: '-0.02em' }}>
            Repositories Hub
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage imported codebase repositories and authorize available GitHub App projects.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa' }}>{imported.length} Active</div>
            <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Connected Repositories</div>
          </div>
          <button onClick={loadData} className="btn btn-secondary" disabled={importedLoading || accessibleLoading || importingRepoId !== null}>
            <RefreshCw size={16} className={importedLoading || accessibleLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* SECTION 1: Imported Repositories Bento Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderGit2 size={18} color="#a78bfa" /> Connected Active Repositories ({imported.length})
          </h2>
        </div>

        <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.8rem', color: '#71717a', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Repository</th>
                <th style={{ padding: '0.85rem 1rem' }}>Stack</th>
                <th style={{ padding: '0.85rem 1rem' }}>Last Run Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Total Executions</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {importedLoading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="theme-spinner-container">
                      <div className="theme-spinner-ring">
                        <div className="theme-spinner-inner">
                          <FolderGit2 size={20} color="#a78bfa" />
                        </div>
                      </div>
                      <div className="theme-spinner-text">Loading Connected Repositories...</div>
                    </div>
                  </td>
                </tr>
              ) : imported.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#71717a', fontSize: '0.9rem' }}>
                    No connected repositories found. Select a repository below to import.
                  </td>
                </tr>
              ) : (
                imported.map((repo) => (
                  <tr key={repo.id} style={{ borderBottom: '1px solid #1e1e22', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#fafafa', fontSize: '0.95rem', cursor: 'pointer' }} onClick={() => onSelectRepo(repo.id)}>
                        {repo.fullName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#71717a' }}>
                        Branch: <code style={{ color: '#a78bfa' }}>{repo.defaultBranch}</code> • {repo.private ? '🔒 Private' : '🌐 Public'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-neutral">{repo.language || 'TypeScript'}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${repo.lastJobStatus === 'PR_OPEN' ? 'badge-purple' : repo.lastJobStatus === 'DROPPED' ? 'badge-warning' : 'badge-success'}`}>
                        {repo.lastJobStatus || 'COMPLETED'}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                        {formatFormattedTimestamp(repo.lastRunTime)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>
                      {repo.totalRuns || 0} runs
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => onSelectRepo(repo.id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                          Details <ArrowRight size={14} />
                        </button>
                        <button onClick={() => handleDelete(repo.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }} title="Unlink Repo">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Available GitHub Repositories Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} color="#34d399" /> Available GitHub App Repositories ({accessibleLoading ? '...' : filteredAccessible.length})
          </h2>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} color="#71717a" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search GitHub repos..."
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
              <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.8rem', color: '#71717a', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>GitHub Repository</th>
                <th style={{ padding: '0.85rem 1rem' }}>Default Branch</th>
                <th style={{ padding: '0.85rem 1rem' }}>Stack</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {accessibleLoading ? (
                <tr>
                  <td colSpan={4}>
                    <div className="theme-spinner-container">
                      <div className="theme-spinner-ring">
                        <div className="theme-spinner-inner">
                          <Plus size={20} color="#34d399" />
                        </div>
                      </div>
                      <div className="theme-spinner-text">Fetching Available GitHub App Repositories...</div>
                    </div>
                  </td>
                </tr>
              ) : filteredAccessible.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#71717a', fontSize: '0.9rem' }}>
                    No available GitHub repositories to import.
                  </td>
                </tr>
              ) : (
                filteredAccessible.map((repo) => (
                  <tr key={repo.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#fafafa', fontSize: '0.9rem' }}>{repo.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#71717a' }}>{repo.private ? '🔒 Private' : '🌐 Public'}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <code style={{ fontSize: '0.8rem', color: '#a78bfa' }}>{repo.defaultBranch}</code>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-neutral">{repo.language || 'Go'}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleImport(repo)}
                        disabled={importingRepoId !== null}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {importingRepoId === repo.id ? (
                          <>
                            <RefreshCw size={14} className="spin" /> Importing...
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Import Repository
                          </>
                        )}
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
