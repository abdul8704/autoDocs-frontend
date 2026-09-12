import React, { useEffect, useState } from 'react';
import { Sliders, FileCode, Plus, Save, CheckCircle2, Cpu, Edit3 } from 'lucide-react';
import { PromptTemplate, TaskConfig } from '../types';
import { fetchPromptTemplates, fetchTaskConfigs } from '../services/api';

export const LLMConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<TaskConfig[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'bindings' | 'prompts'>('bindings');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [promptText, setPromptText] = useState<string>('');

  useEffect(() => {
    fetchTaskConfigs().then((data) => setConfigs(data));
    fetchPromptTemplates().then((data) => {
      setPrompts(data);
      if (data.length > 0) {
        setSelectedPrompt(data[0]);
        setPromptText(data[0].systemPrompt);
      }
    });
  }, []);

  const handleSavePrompt = () => {
    alert('Prompt template updated & deployed successfully across pipeline workers!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
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
          <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>
            <Sliders size={12} /> Pipeline Runtime Architecture
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', margin: 0 }}>
            LLM & Pipeline Task Configuration
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Bind pipeline stages to specific LLM model providers, parameters, and prompt templates.
          </p>
        </div>
      </div>

      {/* Tab Triggers */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #27272a', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('bindings')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'bindings' ? '#1e1e22' : 'transparent',
            color: activeTab === 'bindings' ? '#fafafa' : '#71717a',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Task Pipeline Bindings ({configs.length})
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'prompts' ? '#1e1e22' : 'transparent',
            color: activeTab === 'prompts' ? '#fafafa' : '#71717a',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Prompt Templates Library ({prompts.length})
        </button>
      </div>

      {/* TAB 1: Task Pipeline Bindings Table */}
      {activeTab === 'bindings' && (
        <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Task Stage Key</th>
                <th style={{ padding: '0.85rem 1rem' }}>Assigned Model</th>
                <th style={{ padding: '0.85rem 1rem' }}>Provider</th>
                <th style={{ padding: '0.85rem 1rem' }}>Prompt Version</th>
                <th style={{ padding: '0.85rem 1rem' }}>Temp / Max Tokens</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>
                    {c.taskKey}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#a78bfa' }}>{c.model}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-neutral">{c.provider}</span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    {c.promptVersion}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#a1a1aa' }}>
                    {c.temperature} / {c.maxTokens}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                      <Edit3 size={14} /> Edit Binding
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Prompt Templates Library & Editor View */}
      {activeTab === 'prompts' && (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 1024 ? '35% 65%' : '1fr', gap: '1.5rem' }}>
          {/* Left Template List */}
          <div className="glass-panel" style={{ padding: '1rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {prompts.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPrompt(p);
                  setPromptText(p.systemPrompt);
                }}
                style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  backgroundColor: selectedPrompt?.id === p.id ? '#1e1e22' : '#121215',
                  border: '1px solid',
                  borderColor: selectedPrompt?.id === p.id ? '#a78bfa' : '#27272a',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, color: '#fafafa', fontSize: '0.9rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>{p.key}</div>
              </div>
            ))}
          </div>

          {/* Right Prompt Editor Panel */}
          {selectedPrompt && (
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>{selectedPrompt.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Version: {selectedPrompt.version}</div>
                </div>
                <button onClick={handleSavePrompt} className="btn btn-primary">
                  <Save size={16} /> Save & Deploy
                </button>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', display: 'block', marginBottom: '0.35rem' }}>
                  System Prompt Template (Supports <code style={{ color: '#a78bfa' }}>{"{{repo_name}}"}</code>, <code style={{ color: '#a78bfa' }}>{"{{ast_diff_tree}}"}</code>):
                </label>
                <textarea
                  rows={10}
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.5, resize: 'none' }}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
