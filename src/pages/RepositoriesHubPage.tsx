import React, { useEffect, useState } from 'react';
import { FolderGit2, Plus, Search, RefreshCw, ExternalLink, Play, Trash2, Shield, ArrowRight } from 'lucide-react';
import { AccessibleRepo, ImportedRepo } from '../types';
import { fetchAccessibleRepos, fetchImportedRepos, importRepository, deleteImportedRepository } from '../services/api';

interface RepositoriesHubPageProps {
  onSelectRepo: (repoId: string) => void;
}

export const RepositoriesHubPage: React.FC<RepositoriesHubPageProps> = ({ onSelectRepo }) => {
  const [imported, setImported] = useState<ImportedRepo[]>([]);
  const [accessible, setAccessible] = useState<AccessibleRepo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [impData, accData] = await Promise.all([fetchImportedRepos(), fetchAccessibleRepos()]);
      setImported(impData);
      setAccessible(accData);
    } catch (err) {
      console.error('Error loading repos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImport = async (repo: AccessibleRepo) => {
    try {
      await importRepository({
        githubRepoId: repo.id,
        name: repo.name,
        cloneUrl: repo.cloneUrl,
        installation_id: repo.installationId,
      });
      await loadData();
    } catch (err) {
      alert(`Import error: ${(err as Error).message}`);
    }
  };

  const handleDelete = async (repoId: string) => {
    if (!confirm('Are you sure you want to unlink this repository?')) return;
    try {
      await deleteImportedRepository(repoId);
      await loadData();
    } catch (err) {
      alert(`Delete error: ${(err as Error).message}`);
    }
  };

  const filteredAccessible = accessible.filter((r) =>
    r.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
          <button onClick={loadData} className="btn btn-secondary">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
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
              {imported.map((repo) => (
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
                    <span className={`badge ${repo.lastJobStatus === 'PR_OPEN' ? 'badge-purple' : 'badge-success'}`}>
                      {repo.lastJobStatus || 'COMPLETED'}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.2rem' }}>{repo.lastRunTime || '10m ago'}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>
                    {repo.totalRuns || 124} runs
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Available GitHub Repositories Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} color="#34d399" /> Available GitHub App Repositories ({filteredAccessible.length})
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
              {filteredAccessible.map((repo) => (
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
                    <button onClick={() => handleImport(repo)} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                      <Plus size={14} /> Import Repository
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
