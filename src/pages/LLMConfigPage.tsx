import React, { useEffect, useState } from 'react';
import { Sliders, Plus, Save, CheckCircle2, Edit3, Trash2, X, RefreshCw, Layers, HardDrive, FileText, AlertTriangle } from 'lucide-react';
import { ModelRosterItem, PromptTemplate, TaskConfig, User } from '../types';
import {
  addModelApi,
  createPromptTemplate,
  createTaskConfigApi,
  deleteModelApi,
  deletePromptTemplateApi,
  deleteTaskConfigApi,
  fetchModelsApi,
  fetchPromptTemplates,
  fetchTaskConfigs,
  updatePromptTemplate,
  updateTaskConfigApi,
} from '../services/api';

interface LLMConfigPageProps {
  user?: User | null;
  onNavigate?: (screen: string) => void;
}

export const LLMConfigPage: React.FC<LLMConfigPageProps> = ({ user, onNavigate }) => {
  const [configs, setConfigs] = useState<TaskConfig[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [models, setModels] = useState<ModelRosterItem[]>([]);
  const [activeTab, setActiveTab] = useState<'bindings' | 'prompts' | 'models'>('bindings');

  // Deletion Warning Modal State
  const [warningModalInfo, setWarningModalInfo] = useState<{
    type: 'Model' | 'Prompt';
    name: string;
    associatedTaskKeys: string[];
  } | null>(null);
  
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [promptTitle, setPromptTitle] = useState<string>('');
  const [promptText, setPromptText] = useState<string>('');
  const [promptVersion, setPromptVersion] = useState<string>('v1.0');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showModelModal, setShowModelModal] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);

  // Config Modal Form
  const [configTaskKey, setConfigTaskKey] = useState<string>('tinyRepo');
  const [configModelId, setConfigModelId] = useState<string>('');
  const [configPromptId, setConfigPromptId] = useState<string>('');
  const [configTemp, setConfigTemp] = useState<number>(0.2);
  const [configMaxTokens, setConfigMaxTokens] = useState<number>(4096);

  // Model Modal Form
  const [newModelName, setNewModelName] = useState<string>('');
  const [newModelProvider, setNewModelProvider] = useState<string>('gemini');
  const [newModelContextWindow, setNewModelContextWindow] = useState<number>(1048576);
  const [newModelInputPrice, setNewModelInputPrice] = useState<number>(0.075);
  const [newModelOutputPrice, setNewModelOutputPrice] = useState<number>(0.30);
  const [newModelCacheRead, setNewModelCacheRead] = useState<number>(0.01875);
  const [newModelCacheWrite, setNewModelCacheWrite] = useState<number>(0.075);
  const [newModelStorageCostPerHour, setNewModelStorageCostPerHour] = useState<number>(0.001);

  // Prompt Modal Form
  const [newPromptTitle, setNewPromptTitle] = useState<string>('Small Repo Architecture Analyzer');
  const [newPromptKey, setNewPromptKey] = useState<string>('sys.tinyRepo');
  const [newPromptVer, setNewPromptVer] = useState<string>('v1.0');
  const [newPromptContent, setNewPromptContent] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [confData, promptData, modelData] = await Promise.all([
        fetchTaskConfigs(),
        fetchPromptTemplates(),
        fetchModelsApi(),
      ]);
      setConfigs(confData);
      setPrompts(promptData);
      setModels(modelData);

      if (promptData.length > 0) {
        const first = promptData[0];
        setSelectedPrompt(first);
        setPromptTitle(first.promptTitle || first.name || first.key);
        setPromptText(first.systemPrompt);
        setPromptVersion(first.version || 'v1.0');
      }

      if (modelData.length > 0 && !configModelId) {
        setConfigModelId(modelData[0].id);
      }
      if (promptData.length > 0 && !configPromptId) {
        setConfigPromptId(promptData[0].id);
      }
    } catch (err) {
      console.error('[LLMConfig] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const formatContextWindow = (tokens: number): string => {
    if (tokens >= 1000000) {
      const million = tokens / 1000000;
      return `${million % 1 === 0 ? million.toFixed(0) : million.toFixed(2)}M Tokens`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}k Tokens`;
    }
    return `${tokens} Tokens`;
  };

  const handleSavePrompt = async () => {
    if (!selectedPrompt) return;
    setSaving(true);
    try {
      await updatePromptTemplate(selectedPrompt.id, {
        version: promptVersion,
        content: promptText,
        promptKey: selectedPrompt.key,
        promptTitle: promptTitle,
      });
      notifySuccess(`Prompt "${promptTitle || selectedPrompt.key}" saved & deployed!`);
      await loadData();
    } catch (err) {
      alert(`Failed to save prompt: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    const promptObj = prompts.find((p) => p.id === promptId);
    const pTitle = promptObj?.promptTitle || promptObj?.name || promptObj?.key;
    const pKey = promptObj?.key;

    const boundConfigs = configs.filter(
      (c) =>
        c.promptTitle === pTitle ||
        c.promptVersion === pTitle ||
        c.promptVersion === pKey ||
        c.promptTitle === pKey ||
        c.id === promptId
    );

    if (boundConfigs.length > 0) {
      setWarningModalInfo({
        type: 'Prompt',
        name: pTitle || 'Prompt Template',
        associatedTaskKeys: boundConfigs.map((c) => c.taskKey),
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this prompt template?')) return;
    try {
      await deletePromptTemplateApi(promptId);
      notifySuccess('Prompt template deleted.');
      setSelectedPrompt(null);
      await loadData();
    } catch (err: any) {
      if (err?.message && err.message.includes('associated with active task config')) {
        setWarningModalInfo({
          type: 'Prompt',
          name: pTitle || 'Prompt Template',
          associatedTaskKeys: boundConfigs.length > 0 ? boundConfigs.map((c) => c.taskKey) : ['associated tasks'],
        });
      } else {
        alert(`Failed to delete prompt: ${err?.message || String(err)}`);
      }
    }
  };

  const handleSaveTaskConfig = async () => {
    if (!configModelId || !configPromptId) {
      alert('Please select a model and prompt template.');
      return;
    }
    setSaving(true);
    try {
      const exists = configs.some((c) => c.taskKey === configTaskKey);
      if (exists) {
        await updateTaskConfigApi({
          taskKey: configTaskKey,
          modelId: configModelId,
          promptId: configPromptId,
          temperature: configTemp,
          maxOutputTokens: configMaxTokens,
        });
      } else {
        await createTaskConfigApi({
          taskKey: configTaskKey,
          modelId: configModelId,
          promptId: configPromptId,
          temperature: configTemp,
          maxOutputTokens: configMaxTokens,
        });
      }
      notifySuccess(`Task binding for "${configTaskKey}" saved successfully!`);
      setShowConfigModal(false);
      await loadData();
    } catch (err) {
      alert(`Failed to save task config: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTaskConfig = async (taskKey: string) => {
    if (!confirm(`Are you sure you want to delete the task binding for "${taskKey}"?`)) return;
    try {
      await deleteTaskConfigApi(taskKey);
      notifySuccess(`Task binding "${taskKey}" deleted.`);
      await loadData();
    } catch (err) {
      alert(`Failed to delete task config: ${(err as Error).message}`);
    }
  };

  const handleAddModel = async () => {
    if (!newModelName.trim()) {
      alert('Model name is required.');
      return;
    }
    setSaving(true);
    try {
      await addModelApi({
        modelName: newModelName,
        provider: newModelProvider,
        contextWindow: newModelContextWindow,
        inputCost: newModelInputPrice,
        outputCost: newModelOutputPrice,
        cacheRead: newModelCacheRead,
        cacheWrite: newModelCacheWrite,
        cacheStorageCostPerHour: newModelStorageCostPerHour,
      });
      notifySuccess(`Model "${newModelName}" added to roster!`);
      setShowModelModal(false);
      setNewModelName('');
      await loadData();
    } catch (err) {
      alert(`Failed to add model: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    const modelObj = models.find((m) => m.id === modelId);
    const mName = modelObj?.modelName || modelId;

    const boundConfigs = configs.filter(
      (c) => c.model === mName || c.model === modelObj?.id
    );

    if (boundConfigs.length > 0) {
      setWarningModalInfo({
        type: 'Model',
        name: mName,
        associatedTaskKeys: boundConfigs.map((c) => c.taskKey),
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this model from the roster?')) return;
    try {
      await deleteModelApi(modelId);
      notifySuccess('Model deleted from roster.');
      await loadData();
    } catch (err: any) {
      if (err?.message && err.message.includes('associated with active task config')) {
        setWarningModalInfo({
          type: 'Model',
          name: mName,
          associatedTaskKeys: boundConfigs.length > 0 ? boundConfigs.map((c) => c.taskKey) : ['associated tasks'],
        });
      } else {
        alert(`Failed to delete model: ${err?.message || String(err)}`);
      }
    }
  };

  const handleCreatePrompt = async () => {
    if (!newPromptKey.trim() || !newPromptContent.trim()) {
      alert('Prompt key and content are required.');
      return;
    }
    setSaving(true);
    try {
      await createPromptTemplate({
        promptKey: newPromptKey,
        promptTitle: newPromptTitle,
        version: newPromptVer,
        content: newPromptContent,
      });
      notifySuccess(`Prompt template "${newPromptTitle || newPromptKey}" created!`);
      setShowPromptModal(false);
      setNewPromptContent('');
      await loadData();
    } catch (err) {
      alert(`Failed to create prompt: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (user && user.role !== 'ADMIN') {
    return (
      <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#0c0c0f', borderColor: '#27272a', borderRadius: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <AlertTriangle size={28} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fafafa', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
          The LLM Task Pipeline Configuration page is restricted to Administrator accounts only.
        </p>
        {onNavigate && (
          <button onClick={() => onNavigate('dashboard')} className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Success Notification Banner */}
      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            color: '#34d399',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

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
            Manage active LLM providers, model roster, task stage bindings, and system prompt templates.
          </p>
        </div>

        <button onClick={loadData} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
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
          onClick={() => setActiveTab('models')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'models' ? '#1e1e22' : 'transparent',
            color: activeTab === 'models' ? '#fafafa' : '#71717a',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Models Roster ({models.length})
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
              Active Pipeline Stage Bindings
            </h2>
            <button onClick={() => setShowConfigModal(true)} className="btn btn-primary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Configure Task Binding
            </button>
          </div>

          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Task Stage Key</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Assigned Model</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Provider</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Prompt Title / Version</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Temperature</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Max Output Tokens</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((c) => (
                  <tr key={c.id || c.taskKey} style={{ borderBottom: '1px solid #1e1e22' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#fafafa', fontFamily: 'var(--font-mono)' }}>
                      {c.taskKey}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#a78bfa' }}>{c.model}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-neutral">{c.provider}</span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                      <span style={{ color: '#34d399', fontWeight: 600 }}>{c.promptTitle || c.promptVersion}</span>
                      <span style={{ color: '#71717a', fontSize: '0.75rem', marginLeft: '0.35rem', fontFamily: 'var(--font-mono)' }}>({c.promptVersion})</span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                      {c.temperature}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                      {c.maxTokens}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setConfigTaskKey(c.taskKey);
                            const matchModel = models.find((m) => m.modelName === c.model || m.id === c.model);
                            if (matchModel) setConfigModelId(matchModel.id);
                            const matchPrompt = prompts.find((p) => p.promptTitle === c.promptVersion || p.key === c.promptVersion || p.id === c.promptVersion);
                            if (matchPrompt) setConfigPromptId(matchPrompt.id);
                            setConfigTemp(c.temperature);
                            setConfigMaxTokens(c.maxTokens);
                            setShowConfigModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTaskConfig(c.taskKey)}
                          className="btn btn-danger"
                          style={{ padding: '0.35rem 0.55rem' }}
                          title="Delete Task Binding"
                        >
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
      )}

      {/* TAB 2: Models Roster Table */}
      {activeTab === 'models' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
              Registered LLM Provider Models
            </h2>
            <button onClick={() => setShowModelModal(true)} className="btn btn-primary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Register New Model
            </button>
          </div>

          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#121215', borderBottom: '1px solid #27272a', fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Model Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Provider</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Context Window</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Input / Output Price (1M)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Cache Read / Write (1M)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Storage Cost / Hr</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#fafafa' }}>{m.modelName}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-purple">{m.provider}</span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                      {formatContextWindow(m.contextWindow)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#34d399' }}>
                      ${m.inputPrice} / ${m.outputPrice}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#a1a1aa' }}>
                      ${m.cacheRead || 0} / ${m.cacheWrite || 0}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                      ${m.cacheStorageCostPerHour || 0}/hr
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteModel(m.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.55rem' }} title="Delete Model">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Prompt Templates Library & Editor View */}
      {activeTab === 'prompts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
              System Prompt Templates Library
            </h2>
            <button onClick={() => setShowPromptModal(true)} className="btn btn-primary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Create Prompt Template
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 1024 ? '35% 65%' : '1fr', gap: '1.5rem' }}>
            {/* Left Template List */}
            <div className="glass-panel" style={{ padding: '1rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {prompts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPrompt(p);
                    setPromptTitle(p.promptTitle || p.name || p.key);
                    setPromptText(p.systemPrompt);
                    setPromptVersion(p.version || 'v1.0');
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
                  <div style={{ fontWeight: 700, color: '#fafafa', fontSize: '0.9rem' }}>
                    {p.promptTitle || p.name || p.key}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                    Key: {p.key} • Ver: {p.version || 'v1.0'}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Prompt Editor Panel */}
            {selectedPrompt ? (
              <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '0.75rem' }}>
                  <div style={{ flex: 1, marginRight: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                      Prompt Display Title (UI Representation):
                    </label>
                    <input
                      type="text"
                      value={promptTitle}
                      onChange={(e) => setPromptTitle(e.target.value)}
                      placeholder="Display Title..."
                      style={{
                        backgroundColor: '#121215',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        padding: '0.4rem 0.75rem',
                        color: '#fafafa',
                        fontSize: '1rem',
                        fontWeight: 700,
                        width: '100%',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.35rem' }}>
                      System Key: <code style={{ color: '#a78bfa' }}>{selectedPrompt.key}</code> (sent to LLM backend)
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#71717a', marginRight: '0.35rem' }}>Ver:</span>
                      <input
                        type="text"
                        value={promptVersion}
                        onChange={(e) => setPromptVersion(e.target.value)}
                        style={{
                          backgroundColor: '#121215',
                          border: '1px solid #27272a',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          color: '#34d399',
                          fontSize: '0.8rem',
                          width: '70px',
                          fontFamily: 'var(--font-mono)',
                        }}
                      />
                    </div>

                    <button onClick={handleSavePrompt} disabled={saving} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                      <Save size={16} /> {saving ? 'Saving...' : 'Save & Deploy'}
                    </button>

                    <button onClick={() => handleDeletePrompt(selectedPrompt.id)} className="btn btn-danger" style={{ padding: '0.45rem 0.6rem' }} title="Delete Prompt">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', display: 'block', marginBottom: '0.35rem' }}>
                    System Instruction Content (LLM Execution Body):
                  </label>
                  <textarea
                    rows={12}
                    className="input-field"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.5, resize: 'none' }}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '2rem', backgroundColor: '#0c0c0f', borderColor: '#27272a', textAlign: 'center', color: '#71717a' }}>
                Select a prompt template on the left to edit.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Configure Task Binding */}
      {showConfigModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', borderRadius: '16px', padding: '1.75rem', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>Configure Task Stage Binding</h3>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Task Key:</label>
                <select value={configTaskKey} onChange={(e) => setConfigTaskKey(e.target.value)} className="input-field" style={{ width: '100%' }}>
                  <option value="tinyRepo">tinyRepo (Small Codebase Generator)</option>
                  <option value="judge">judge (Webhook Diff Impact Classifier)</option>
                  <option value="docsGenerator">docsGenerator (Full Architecture Generator)</option>
                  <option value="moduleSummary">moduleSummary (Directory Codebase Summaries)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Assigned Model Roster:</label>
                <select value={configModelId} onChange={(e) => setConfigModelId(e.target.value)} className="input-field" style={{ width: '100%' }}>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.modelName} ({m.provider}) - {formatContextWindow(m.contextWindow)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>System Prompt Template:</label>
                <select value={configPromptId} onChange={(e) => setConfigPromptId(e.target.value)} className="input-field" style={{ width: '100%' }}>
                  {prompts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.promptTitle || p.name || p.key} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Temperature ({configTemp}):</label>
                  <input type="range" min="0" max="1" step="0.05" value={configTemp} onChange={(e) => setConfigTemp(parseFloat(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Max Output Tokens:</label>
                  <input type="number" value={configMaxTokens} onChange={(e) => setConfigMaxTokens(parseInt(e.target.value) || 4096)} className="input-field" style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => setShowConfigModal(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleSaveTaskConfig} disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : 'Save Task Binding'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Register New Model */}
      {showModelModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', borderRadius: '16px', padding: '1.75rem', maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>Register New LLM Model</h3>
              <button onClick={() => setShowModelModal(false)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Model Name (e.g. gemini-2.5-flash):</label>
                <input type="text" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} placeholder="gemini-2.5-flash" className="input-field" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Provider:</label>
                  <select value={newModelProvider} onChange={(e) => setNewModelProvider(e.target.value)} className="input-field" style={{ width: '100%' }}>
                    <option value="gemini">Google (gemini)</option>
                    <option value="openai">OpenAI (openai)</option>
                    <option value="anthropic">Anthropic (anthropic)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Context Window (Tokens):</label>
                  <input type="number" value={newModelContextWindow} onChange={(e) => setNewModelContextWindow(parseInt(e.target.value) || 1048576)} className="input-field" style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Input Price / 1M USD:</label>
                  <input type="number" step="0.001" value={newModelInputPrice} onChange={(e) => setNewModelInputPrice(parseFloat(e.target.value) || 0)} className="input-field" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Output Price / 1M USD:</label>
                  <input type="number" step="0.001" value={newModelOutputPrice} onChange={(e) => setNewModelOutputPrice(parseFloat(e.target.value) || 0)} className="input-field" style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Cache Read Discount / 1M:</label>
                  <input type="number" step="0.001" value={newModelCacheRead} onChange={(e) => setNewModelCacheRead(parseFloat(e.target.value) || 0)} className="input-field" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Cache Write Cost / 1M:</label>
                  <input type="number" step="0.001" value={newModelCacheWrite} onChange={(e) => setNewModelCacheWrite(parseFloat(e.target.value) || 0)} className="input-field" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Cache Storage Cost / Hour (USD):</label>
                <input type="number" step="0.0001" value={newModelStorageCostPerHour} onChange={(e) => setNewModelStorageCostPerHour(parseFloat(e.target.value) || 0)} className="input-field" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => setShowModelModal(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleAddModel} disabled={saving} className="btn btn-primary">
                  {saving ? 'Adding...' : 'Add Model to Roster'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Prompt Template */}
      {showPromptModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: '#27272a', borderRadius: '16px', padding: '1.75rem', maxWidth: '540px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>Create New Prompt Template</h3>
              <button onClick={() => setShowPromptModal(false)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Prompt Display Title (UI Representation):</label>
                <input type="text" value={newPromptTitle} onChange={(e) => setNewPromptTitle(e.target.value)} placeholder="Small Repo Architecture Analyzer" className="input-field" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>System Key (e.g. sys.tinyRepo):</label>
                  <input type="text" value={newPromptKey} onChange={(e) => setNewPromptKey(e.target.value)} className="input-field" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>Version:</label>
                  <input type="text" value={newPromptVer} onChange={(e) => setNewPromptVer(e.target.value)} className="input-field" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '0.35rem' }}>System Prompt Instruction (LLM Execution Body):</label>
                <textarea rows={6} value={newPromptContent} onChange={(e) => setNewPromptContent(e.target.value)} placeholder="You are AutoDocs AI..." className="input-field" style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => setShowPromptModal(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleCreatePrompt} disabled={saving} className="btn btn-primary">
                  {saving ? 'Creating...' : 'Create Prompt Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Deletion Warning Modal (Associated Task Configs) */}
      {warningModalInfo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ backgroundColor: '#0c0c0f', borderColor: 'rgba(245, 158, 11, 0.4)', borderRadius: '16px', padding: '1.75rem', maxWidth: '480px', width: '100%', boxShadow: '0 0 30px rgba(245, 158, 11, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.65rem', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', flexShrink: 0 }}>
                <AlertTriangle size={24} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fafafa', margin: 0 }}>
                  Cannot Delete {warningModalInfo.type}
                </h3>
                <p style={{ color: '#fbbf24', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 600 }}>
                  "{warningModalInfo.name}" is currently in use
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ margin: 0 }}>
                This {warningModalInfo.type.toLowerCase()} is associated with the following active pipeline task configuration(s):
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem', borderRadius: '10px', backgroundColor: '#121215', border: '1px solid #27272a' }}>
                {warningModalInfo.associatedTaskKeys.map((key) => (
                  <span key={key} className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {key}
                  </span>
                ))}
              </div>

              <p style={{ margin: 0, fontSize: '0.8rem', color: '#71717a' }}>
                To delete this item, you must first rebind or delete the associated task stage configuration(s) in the <strong>Task Pipeline Bindings</strong> tab.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setWarningModalInfo(null)} className="btn btn-secondary" style={{ width: '100%', padding: '0.6rem' }}>
                Understood, Close Warning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
