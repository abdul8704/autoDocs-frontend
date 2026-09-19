import {
  AccessibleRepo,
  AdminStats,
  BillingSummary,
  DashboardStats,
  DocJob,
  getNumericCreditBalance,
  ImportedRepo,
  ModelRosterItem,
  PromptTemplate,
  SearchResults,
  TaskConfig,
  User,
} from '../types';

const processEnv = typeof globalThis !== 'undefined' && (globalThis as any).process?.env
  ? ((globalThis as any).process.env as Record<string, string | undefined>)
  : undefined;

const envBackendUrl =
  (import.meta.env && (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKED_URL || (import.meta.env as any).BACKEND_URL || (import.meta.env as any).BACKED_URL)) ||
  (processEnv && (processEnv.VITE_BACKEND_URL || processEnv.BACKEND_URL || processEnv.BACKED_URL)) ||
  '';

export const BACKEND_URL = (typeof window !== 'undefined' ? (envBackendUrl || '') : (envBackendUrl || 'http://localhost:5000')).replace(/\/$/, '');

export function getFullApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return BACKEND_URL ? `${BACKEND_URL}${cleanEndpoint}` : cleanEndpoint;
}

export function formatFormattedTimestamp(rawDate?: string | Date | number | null): string {
  if (!rawDate) {
    return formatDateString(new Date());
  }

  let d = new Date(rawDate);

  if (isNaN(d.getTime())) {
    const now = new Date();
    const str = String(rawDate).toLowerCase();
    if (str.includes('min')) {
      const mins = parseInt(str) || 5;
      now.setMinutes(now.getMinutes() - mins);
    } else if (str.includes('hour')) {
      const hours = parseInt(str) || 2;
      now.setHours(now.getHours() - hours);
    } else if (str.includes('day')) {
      const days = parseInt(str) || 1;
      now.setDate(now.getDate() - days);
    } else if (str.includes('week')) {
      const weeks = parseInt(str) || 2;
      now.setDate(now.getDate() - (weeks * 7));
    }
    d = now;
  }

  return formatDateString(d);
}

function formatDateString(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDescriptionText(description?: string | null): string {
  if (!description) return '—';
  // Replace raw ISO 8601 timestamps (e.g. 2026-09-17T11:35:04.123Z or 2026-09-17T11:35:04Z or 2026-09-17 11:35:04) with human readable date/time
  return description.replace(/\b\d{4}-\d{2}-\d{2}(?:T|\s+)\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/gi, (match) => {
    return formatFormattedTimestamp(match);
  });
}

let currentAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAccessToken = () => currentAccessToken;

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(getFullApiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
        return data.data.accessToken;
      }
    } else {
      setAccessToken(null);
    }
  } catch (err) {
    console.warn('[API] Refresh access token failed:', err);
    setAccessToken(null);
  }
  return null;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let headers = new Headers(options.headers || {});
  if (currentAccessToken) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const fullUrl = getFullApiUrl(endpoint);
  let res = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(fullUrl, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errBody.message || errBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// User & Auth API
export async function logoutUser(): Promise<void> {
  try {
    await fetch(getFullApiUrl('/auth/logout'), {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.warn('[API] Logout request failed:', err);
  } finally {
    setAccessToken(null);
  }
}

export function getDemoUser(): User {
  return {
    id: 'usr_demo_101',
    email: 'alex.dev@autodocs.io',
    githubHandle: 'alexdeveloper',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    plan: 'PRO',
    creditBalance: 45,
    monthlyQuota: 100,
    quotaUsed: 55,
    githubInstallationId: 98124,
  };
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await apiFetch<{ success: boolean; user: any }>('/api/user/me');
    if (res && res.user) {
      const u = res.user;
      return {
        id: u.id,
        email: u.email || 'developer@autodocs.io',
        githubHandle: u.name || u.email || 'developer',
        avatarUrl: u.profileUrl || `https://avatar.vercel.sh/${u.id}`,
        plan: u.planType || 'FREE',
        role: u.role || 'USER',
        creditBalance: getNumericCreditBalance(u.creditBalance, u.usedDocsQuota),
        monthlyQuota: 100,
        quotaUsed: u.usedDocsQuota || 0,
        githubInstallationId: u.githubInstallationId || null,
      };
    }
  } catch (err) {
    console.warn('[API] fetchCurrentUser unauthenticated:', err);
  }
  return null;
}

export async function fetchInstallationStatus(): Promise<{ isInstalled: boolean; installationId: number | null; appSlug?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; isInstalled?: boolean; installationId?: number | null; appSlug?: string }>('/api/github/installation-status');
    if (res && res.success) {
      return {
        isInstalled: Boolean(res.isInstalled),
        installationId: res.installationId ?? null,
        appSlug: res.appSlug || 'aiautodocs',
      };
    }
  } catch (err) {
    console.warn('[API] fetchInstallationStatus error:', err);
  }
  return { isInstalled: false, installationId: null, appSlug: 'aiautodocs' };
}

// Dashboard & Stats API
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await apiFetch<any>('/api/dashboard/stats');
    if (res && res.success) {
      const statsObj = res.stats || {};
      const importedReposCount = res.importedReposCount ?? statsObj.totalImportedRepos ?? 0;
      const totalJobsExecuted = res.totalJobsExecuted ?? statsObj.totalJobsRun ?? 0;
      const activePipelinesCount = res.activePipelinesCount ?? statsObj.activeJobsCount ?? 0;
      const openPullRequestsCount = res.openPullRequestsCount ?? statsObj.openPRsCount ?? 0;
      const successRatePercent = res.successRatePercent ?? statsObj.successRate ?? 100;

      const rawJobs = Array.isArray(res.recentJobs) ? res.recentJobs : [];
      const rawEvents = Array.isArray(res.liveEvents)
        ? res.liveEvents
        : Array.isArray(res.liveFeed)
          ? res.liveFeed
          : [];

      return {
        importedReposCount,
        totalJobsExecuted,
        activePipelinesCount,
        openPullRequestsCount,
        avgLatencySeconds: res.avgLatencySeconds || 0,
        successRatePercent,
        creditsBurnedToday: res.creditsBurnedToday || 0,
        sparkline7d: Array.isArray(res.sparkline7d)
          ? res.sparkline7d
          : Array.isArray(statsObj.sparklineData)
            ? statsObj.sparklineData.map((d: any) => d.count || 0)
            : [0, 0, 0, 0, 0, 0, 0],
        recentJobs: rawJobs.map((j: any) => mapBackendJobToDocJob(j)),
        liveEvents: rawEvents.map((ev: any) => ({
          id: ev.id || String(Math.random()),
          type: ev.type || 'PUSH',
          repoName: ev.repoName || 'repository',
          message: ev.message || 'Job activity logged',
          timestamp: formatFormattedTimestamp(ev.timestamp),
        })),
      };
    }
  } catch (err) {
    console.warn('[API] fetchDashboardStats error:', err);
  }
  return {
    importedReposCount: 0,
    totalJobsExecuted: 0,
    activePipelinesCount: 0,
    openPullRequestsCount: 0,
    avgLatencySeconds: 0,
    successRatePercent: 100,
    creditsBurnedToday: 0,
    sparkline7d: [0, 0, 0, 0, 0, 0, 0],
    recentJobs: [],
    liveEvents: [],
  };
}

export async function importRepository(params: {
  githubRepoId: string;
  name: string;
  cloneUrl: string;
  installation_id: number;
}): Promise<{ success: boolean }> {
  return await apiFetch<{ success: boolean }>('/api/github/import-repo', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function deleteImportedRepository(repoId: string): Promise<void> {
  await apiFetch<void>(`/api/github/repo/${repoId}`, {
    method: 'DELETE',
  });
}

// Repositories Hub API
export async function fetchImportedRepos(): Promise<ImportedRepo[]> {
  try {
    const res = await apiFetch<{ success: boolean; repos: any[] }>('/api/github/imported-repos');
    if (res.success && Array.isArray(res.repos)) {
      return res.repos.map((r: any) => ({
        id: r.id,
        githubRepoId: r.github_repo_id || r.id,
        name: r.full_name ? r.full_name.split('/')[1] || r.full_name : r.name || r.id,
        fullName: r.full_name || r.name || r.id,
        cloneUrl: r.clone_url || '',
        defaultBranch: r.default_branch || 'main',
        language: r.language || 'TypeScript',
        private: r.private ?? false,
        createdAt: r.created_at || new Date().toISOString(),
        lastJobStatus: r.jobs && r.jobs[0] ? r.jobs[0].status : 'COMPLETED',
        lastRunTime: r.jobs && r.jobs[0] ? r.jobs[0].createdAt : 'Recently',
        totalRuns: r._count?.jobs ?? (r.jobs ? r.jobs.length : 0),
      }));
    }
  } catch (err) {
    console.warn('[API] fetchImportedRepos fallback:', err);
  }
  return mockImportedRepos;
}

export async function fetchAccessibleRepos(): Promise<AccessibleRepo[]> {
  try {
    const res = await apiFetch<{ success: boolean; repos: any[] }>('/api/github/accessible-repos');
    if (res.success && Array.isArray(res.repos)) {
      return res.repos.map((r: any) => ({
        id: String(r.githubRepoId || r.github_repo_id || r.id || ''),
        name: r.name ? (r.name.includes('/') ? r.name.split('/')[1] : r.name) : (r.full_name ? r.full_name.split('/')[1] : String(r.id)),
        fullName: r.full_name || r.name || String(r.githubRepoId || r.id),
        private: r.private ?? r.isPrivate ?? false,
        cloneUrl: r.clone_url || r.cloneUrl || '',
        defaultBranch: r.default_branch || r.defaultBranch || 'main',
        installationId: r.installation_id || r.installationId || 0,
        language: r.language || 'TypeScript',
        sizeKb: r.sizeKb || 12000,
        isImported: r.isImported ?? false,
      }));
    }
  } catch (err) {
    console.warn('[API] fetchAccessibleRepos fallback:', err);
  }
  return mockAccessibleRepos;
}

export async function fetchRepoDetails(repoId: string): Promise<any> {
  try {
    const res = await apiFetch<{ success: boolean; repo: any; latestJob: any; stats: any }>(`/api/repos/${repoId}`);
    return res;
  } catch (err) {
    console.warn('[API] fetchRepoDetails fallback:', err);
    return null;
  }
}

export async function triggerDocGen(repoId: string): Promise<{ jobId: string; message: string }> {
  return await apiFetch<{ success: boolean; jobId: string; message: string }>(`/api/repos/${repoId}/trigger`, {
    method: 'POST',
  });
}

export async function fetchRepoDocs(repoId: string): Promise<{ exists: boolean; filename: string; content: string | null }> {
  try {
    return await apiFetch<{ success: boolean; exists: boolean; filename: string; content: string | null }>(`/api/repos/${repoId}/docs`);
  } catch {
    return { exists: false, filename: 'ARCHITECTURE.md', content: null };
  }
}

// Jobs & Execution Logs API
export async function fetchJobsStats(): Promise<{
  creditsBurnedToday: number;
  activeRepoHooks: number;
  docPRsDelivered: number;
  openPRsCount: number;
  activeJobsCount: number;
  actionRequiredCount: number;
}> {
  try {
    const res = await apiFetch<{ success: boolean; stats: any }>('/api/jobs/stats');
    if (res.success && res.stats) {
      return res.stats;
    }
  } catch (err) {
    console.warn('[API] fetchJobsStats fallback:', err);
  }
  return {
    creditsBurnedToday: 0,
    activeRepoHooks: 0,
    docPRsDelivered: 0,
    openPRsCount: 0,
    activeJobsCount: 0,
    actionRequiredCount: 0,
  };
}

export async function fetchJobs(): Promise<DocJob[]> {
  try {
    const res = await apiFetch<{ success: boolean; jobs: any[] }>('/api/jobs');
    if (res.success && Array.isArray(res.jobs)) {
      return res.jobs.map((j: any) => mapBackendJobToDocJob(j));
    }
  } catch (err) {
    console.warn('[API] fetchJobs fallback:', err);
  }
  return mockJobsList;
}

export async function fetchJobById(jobId: string): Promise<any> {
  try {
    const res = await apiFetch<{ success: boolean; job: any }>(`/api/jobs/${jobId}`);
    return res.job;
  } catch (err) {
    console.warn('[API] fetchJobById error:', err);
    return null;
  }
}

export async function retryJob(jobId: string): Promise<any> {
  try {
    const res = await apiFetch<{ success: boolean; message: string; job: any }>(`/api/jobs/${jobId}/retry`, {
      method: 'POST',
    });
    return res;
  } catch (err: any) {
    console.warn('[API] retryJob error:', err);
    throw new Error(err?.message || 'Failed to retry job. Please check your backend connection.');
  }
}

// Billing API
export async function fetchBillingSummary(): Promise<BillingSummary> {
  try {
    const res = await apiFetch<{ success: boolean; balance: any; requests: any[]; ledger: any[] }>('/api/billing/summary');
    if (res.success) {
      return {
        balance: res.balance?.current ?? 0,
        tier: res.balance?.tier ? `${res.balance.tier} Tier Active` : 'FREE TIER ACTIVE',
        monthlyCap: res.balance?.monthlyCap || 100,
        usedThisMonth: (res.balance?.monthlyCap || 100) - (res.balance?.current || 0),
        unitCostPerPull: 10,
        burnRate7d: res.balance?.creditsUsed7d || 0,
        resetDaysRemaining: 12,
        creditsUsedToday: res.balance?.creditsUsedToday || 0,
        creditsUsed7d: res.balance?.creditsUsed7d || 0,
        history7d: res.balance?.history7d || [],
        history28d: res.balance?.history28d || [],
        historyAllTime: res.balance?.historyAllTime || [],
        ledger: (res.ledger || []).map((l: any) => {
          const formatted = formatFormattedTimestamp(l.createdAt);
          return {
            id: l.id,
            amount: l.amount,
            type: l.type || 'USAGE_DEDUCTION',
            description: formatDescriptionText(l.description || ''),
            createdAt: l.createdAt || new Date().toISOString(),
            transactionDate: formatted,
            transactionTime: formatted,
            repoName: l.repoName || (l.job?.repository?.full_name || '-'),
            jobId: l.jobId,
          };
        }),
        requests: (res.requests || []).map((r: any) => ({
          id: r.id,
          requestedCredits: r.amount || r.requestedCredits,
          reason: r.reason || r.userReason || r.description || '',
          status: r.status || 'PENDING',
          grantedCredits: r.amountGranted,
          adminNotes: r.adminReason,
          createdAt: formatFormattedTimestamp(r.createdAt),
        })),
      };
    }
  } catch (err) {
    console.warn('[API] fetchBillingSummary fallback:', err);
  }
  return mockBillingSummary;
}

export async function requestCreditGrant(params: { requestedCredits: number; reason: string }): Promise<void> {
  await apiFetch('/api/billing/request', {
    method: 'POST',
    body: JSON.stringify({
      amount: params.requestedCredits,
      description: params.reason,
    }),
  });
}

export async function fetchAdminCreditRequests(): Promise<any[]> {
  try {
    const res = await apiFetch<{ success: boolean; requests: any[] }>('/api/billing/admin/requests');
    if (res.success && Array.isArray(res.requests)) {
      return res.requests.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.user?.email || 'user@autodocs.io',
        userName: r.user?.name || r.user?.email || 'User',
        githubId: r.user?.githubId || null,
        amountRequested: r.amountRequested || 10,
        amountGranted: r.amountGranted,
        reason: r.userReason || r.description || '',
        adminReason: r.adminReason,
        status: r.status || 'PENDING',
        createdAt: formatFormattedTimestamp(r.createdAt),
      }));
    }
  } catch (err) {
    console.warn('[API] fetchAdminCreditRequests error:', err);
  }
  return [];
}

// Admin API
export async function fetchAdminUsers(): Promise<any[]> {
  try {
    const res = await apiFetch<{ success: boolean; users: any[] }>('/api/admin/users');
    if (res.success && Array.isArray(res.users)) {
      return res.users.map((u: any) => ({
        id: u.id,
        email: u.email || 'developer@autodocs.io',
        githubHandle: u.name || u.email?.split('@')[0] || 'user',
        avatarUrl: u.profileUrl || `https://avatar.vercel.sh/${u.id}`,
        plan: u.planType || 'FREE',
        role: u.role || 'USER',
        creditBalance: getNumericCreditBalance(u.creditBalance, u.usedDocsQuota),
        reposCount: u.repoCount ?? (u.repos ? u.repos.length : 0),
        jobsCount: u.importedRepos ? u.importedRepos.reduce((acc: number, r: any) => acc + (r._count?.jobs || 0), 0) : 0,
        createdAt: u.created_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn('[API] fetchAdminUsers error:', err);
  }
  return [];
}

export async function promoteUserToAdminApi(userId: string): Promise<any> {
  return await apiFetch<{ success: boolean; message: string; user: any }>(`/api/admin/users/${userId}/promote`, {
    method: 'POST',
  });
}

export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const [res, realUsers] = await Promise.all([
      apiFetch<any>('/api/admin/stats'),
      fetchAdminUsers(),
    ]);

    if (res.success && res.overview) {
      const qH = res.queueHealth || {};
      return {
        totalUsers: res.overview.totalUsers || realUsers.length || 0,
        totalReposConnected: res.overview.totalRepos || 0,
        totalDocJobs: res.overview.totalJobs || 0,
        globalLlmSpendUsd: res.overview.globalLlmSpend || 0,
        activeUsersToday: res.overview.activeUsersToday || 0,
        queues: [
          { name: 'repo-storage-queue', active: qH.repoStorageQueue?.active || 0, waiting: qH.repoStorageQueue?.waiting || 0, completed: qH.repoStorageQueue?.completed || 0, failed: qH.repoStorageQueue?.failed || 0, p95LatencyMs: 240 },
          { name: 'push-classify-queue', active: qH.classifyQueue?.active || 0, waiting: qH.classifyQueue?.waiting || 0, completed: qH.classifyQueue?.completed || 0, failed: qH.classifyQueue?.failed || 0, p95LatencyMs: 110 },
          { name: 'doc-generation-queue', active: qH.docGenQueue?.active || 0, waiting: qH.docGenQueue?.waiting || 0, completed: qH.docGenQueue?.completed || 0, failed: qH.docGenQueue?.failed || 0, p95LatencyMs: 3120 },
        ],
        users: realUsers,
      };
    }
  } catch (err) {
    console.warn('[API] fetchAdminStats error:', err);
  }
  return {
    totalUsers: 0,
    totalReposConnected: 0,
    totalDocJobs: 0,
    globalLlmSpendUsd: 0,
    activeUsersToday: 0,
    queues: [],
    users: [],
  };
}



export async function approveCreditRequestApi(requestId: string, amount: number, description?: string): Promise<void> {
  await apiFetch(`/api/billing/admin/requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ amount, description }),
  });
}

export async function rejectCreditRequestApi(requestId: string, description?: string): Promise<void> {
  await apiFetch(`/api/billing/admin/requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}

// LLM & Task Configuration API
export async function fetchTaskConfigs(): Promise<TaskConfig[]> {
  try {
    const res = await apiFetch<{ success: boolean; configs?: any[]; data?: any[] }>('/api/llm-config');
    const list = res.configs || res.data;
    if (res.success && Array.isArray(list)) {
      return list.map((c: any) => ({
        id: c.id,
        taskKey: c.taskKey,
        model: c.model?.modelName || 'gemini-3.6-flash',
        provider: (c.model?.provider ? (c.model.provider.charAt(0).toUpperCase() + c.model.provider.slice(1)) : 'Google') as any,
        promptTitle: c.prompt?.promptTitle || c.prompt?.prompt_key || 'Untitled Prompt',
        promptVersion: c.prompt?.version || c.prompt?.prompt_key || 'v1.0',
        temperature: c.temperature ?? 0.2,
        maxTokens: c.maxOutputTokens || 4096,
        status: 'Active',
      }));
    }
  } catch (err) {
    console.warn('[API] fetchTaskConfigs error:', err);
  }
  return [];
}

export async function updateTaskConfigApi(params: {
  taskKey: string;
  modelId: string;
  promptId: string;
  temperature: number;
  maxOutputTokens: number;
}): Promise<void> {
  await apiFetch('/api/llm-config', {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function createTaskConfigApi(params: {
  taskKey: string;
  modelId: string;
  promptId: string;
  temperature: number;
  maxOutputTokens: number;
}): Promise<void> {
  await apiFetch('/api/llm-config', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function deleteTaskConfigApi(taskKey: string): Promise<void> {
  await apiFetch(`/api/llm-config/${taskKey}`, {
    method: 'DELETE',
  });
}

export async function fetchModelsApi(): Promise<ModelRosterItem[]> {
  try {
    const res = await apiFetch<{ success?: boolean; models?: any[] }>('/api/models');
    const list = res.models || (Array.isArray(res) ? res : []);
    if (Array.isArray(list)) {
      return list.map((m: any) => ({
        id: m.id,
        modelName: m.modelName,
        provider: m.provider,
        contextWindow: m.contextWindow || 1048576,
        inputPrice: m.inputPrice || 0,
        outputPrice: m.outputPrice || 0,
        cacheRead: m.cacheRead || 0,
        cacheWrite: m.cacheWrite || 0,
        cacheStorageCostPerHour: m.cacheStorageCostPerHour || 0,
      }));
    }
  } catch (err) {
    console.warn('[API] fetchModelsApi fallback:', err);
  }
  return [];
}

export async function addModelApi(params: {
  modelName: string;
  provider: string;
  contextWindow: number;
  inputCost: number;
  outputCost: number;
  cacheRead?: number;
  cacheWrite?: number;
  cacheStorageCostPerHour?: number;
}): Promise<void> {
  await apiFetch('/api/models', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function deleteModelApi(modelId: string): Promise<void> {
  await apiFetch(`/api/models/${modelId}`, {
    method: 'DELETE',
  });
}

export async function fetchPromptTemplates(): Promise<PromptTemplate[]> {
  try {
    const res = await apiFetch<any>('/api/prompts');
    const list = Array.isArray(res) ? res : (res.prompts || res.data || []);
    if (Array.isArray(list)) {
      return list.map((p: any) => ({
        id: p.id,
        key: p.prompt_key || p.key || p.id,
        name: p.promptTitle || p.prompt_key || p.name || p.id,
        promptTitle: p.promptTitle || p.prompt_key || p.name || p.id,
        version: p.version || 'v1.0',
        systemPrompt: p.content || '',
        maxOutputTokens: 8192,
        stopTokens: ['```end'],
        estimatedCostPer1k: 0.0025,
      }));
    }
  } catch (err) {
    console.warn('[API] fetchPromptTemplates error:', err);
  }
  return [];
}

export async function updatePromptTemplate(
  promptId: string,
  params: { version: string; content: string; promptKey?: string; promptTitle?: string }
): Promise<void> {
  await apiFetch(`/api/prompts/${promptId}`, {
    method: 'PUT',
    body: JSON.stringify({
      promptId,
      version: params.version,
      content: params.content,
      promptTitle: params.promptTitle,
    }),
  });
}

export async function createPromptTemplate(params: {
  promptKey: string;
  version: string;
  content: string;
  promptTitle?: string;
}): Promise<void> {
  await apiFetch('/api/prompts', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function deletePromptTemplateApi(promptId: string): Promise<void> {
  await apiFetch(`/api/prompts/${promptId}`, {
    method: 'DELETE',
  });
}

// Search API
export async function performGlobalSearch(query: string): Promise<SearchResults> {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>(`/api/search?q=${encodeURIComponent(query)}`);
    if (res.success && res.data) {
      return {
        repositories: (res.data.repositories || []).map((r: any) => ({ id: r.id, name: r.full_name?.split('/')[1] || r.id, fullName: r.full_name })),
        jobs: (res.data.jobs || []).map((j: any) => ({ id: j.id, sha: j.triggerCommit?.slice(0, 7) || 'HEAD', repoName: j.repository?.full_name || 'repo', status: j.status })),
        docs: [],
      };
    }
  } catch (err) {
    console.warn('[API] performGlobalSearch fallback:', err);
  }
  return {
    repositories: [
      { id: 'r-1', name: 'react', fullName: 'facebook/react' },
      { id: 'r-2', name: 'next.js', fullName: 'vercel/next.js' },
    ],
    jobs: [
      { id: 'j-108', sha: 'e8f9a2b', repoName: 'facebook/react', status: 'COMPLETED' },
      { id: 'j-109', sha: 'c7a19f2', repoName: 'vercel/next.js', status: 'PR_OPEN' },
    ],
    docs: [
      { repoId: 'r-1', repoName: 'facebook/react', path: 'ARCHITECTURE.md', snippet: 'Root React Fiber reconciler & codebase tree scan...' },
      { repoId: 'r-2', repoName: 'vercel/next.js', path: 'API_ROUTING.md', snippet: 'App Router layout nesting & server component hydration specs' },
    ],
  };
}

function mapBackendJobToDocJob(j: any): DocJob {
  const creditsUsed = typeof j.creditsDeducted === 'number'
    ? j.creditsDeducted
    : (typeof j.creditsUsed === 'number' ? j.creditsUsed : 0);

  const rawCreatedAt = j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString();
  const displayTime = formatFormattedTimestamp(j.createdAt);

  return {
    id: j.id,
    repoId: j.repoId || j.repository?.id || '',
    repoName: j.repository?.full_name || j.repoName || 'repository',
    sha: j.triggerCommit ? j.triggerCommit.slice(0, 7) : (j.sha || 'HEAD'),
    triggerEvent: j.triggerCommit ? 'git.push (Webhook)' : 'First Import Sync',
    commitMessage: j.commitMessage || `Trigger commit ${j.triggerCommit?.slice(0, 7) || 'HEAD'}`,
    status: j.status || 'COMPLETED',
    creditsUsed,
    costUsd: j.tokenBreakdown?.costUsd || 0,
    createdAt: rawCreatedAt,
    displayTime,
    prUrl: j.prLink || j.prUrl || undefined,
    prNumber: j.pullRequestId || j.prNumber || undefined,
    latencyMs: j.tokenBreakdown?.durationMs || 0,
    modelUsed: j.modelUsed || 'gemini-3.6-flash',
    logs: j.stdoutLogs || [],
  };
}

// MOCK DATA SEEDS
export const mockImportedRepos: ImportedRepo[] = [
  {
    id: 'repo-1',
    githubRepoId: '101',
    name: 'react',
    fullName: 'facebook/react',
    cloneUrl: 'https://github.com/facebook/react.git',
    defaultBranch: 'main',
    language: 'TypeScript',
    private: false,
    createdAt: '2026-08-10',
    lastJobStatus: 'PR_OPEN',
    lastRunTime: '5 mins ago',
    totalRuns: 1248,
  },
  {
    id: 'repo-2',
    githubRepoId: '102',
    name: 'next.js',
    fullName: 'vercel/next.js',
    cloneUrl: 'https://github.com/vercel/next.js.git',
    defaultBranch: 'main',
    language: 'TypeScript',
    private: false,
    createdAt: '2026-08-14',
    lastJobStatus: 'COMPLETED',
    lastRunTime: '2 hours ago',
    totalRuns: 642,
  },
  {
    id: 'repo-3',
    githubRepoId: '103',
    name: 'core-engine',
    fullName: 'acme/core-engine',
    cloneUrl: 'https://github.com/acme/core-engine.git',
    defaultBranch: 'main',
    language: 'Go',
    private: true,
    createdAt: '2026-09-01',
    lastJobStatus: 'COMPLETED',
    lastRunTime: '1 day ago',
    totalRuns: 89,
  },
  {
    id: 'repo-4',
    githubRepoId: '104',
    name: 'analytics-pipeline',
    fullName: 'acme/analytics-pipeline',
    cloneUrl: 'https://github.com/acme/analytics-pipeline.git',
    defaultBranch: 'master',
    language: 'Python',
    private: true,
    createdAt: '2026-09-05',
    lastJobStatus: 'GENERATING',
    lastRunTime: 'Just now',
    totalRuns: 14,
  },
];

export const mockAccessibleRepos: AccessibleRepo[] = [
  {
    id: 'gh-201',
    name: 'awesome-backend',
    fullName: 'acme/awesome-backend',
    private: true,
    cloneUrl: 'https://github.com/acme/awesome-backend.git',
    defaultBranch: 'main',
    installationId: 98124,
    language: 'Go',
    sizeKb: 14200,
    isImported: false,
  },
  {
    id: 'gh-202',
    name: 'docs-site',
    fullName: 'acme/docs-site',
    private: false,
    cloneUrl: 'https://github.com/acme/docs-site.git',
    defaultBranch: 'main',
    installationId: 98124,
    language: 'TypeScript',
    sizeKb: 3400,
    isImported: false,
  },
  {
    id: 'gh-203',
    name: 'ml-transformer',
    fullName: 'acme/ml-transformer',
    private: true,
    cloneUrl: 'https://github.com/acme/ml-transformer.git',
    defaultBranch: 'main',
    installationId: 98124,
    language: 'Python',
    sizeKb: 89100,
    isImported: false,
  },
];

export const mockJobsList: DocJob[] = [
  {
    id: 'j-108',
    repoId: 'repo-1',
    repoName: 'facebook/react',
    sha: 'e8f9a2b',
    commitMessage: 'feat(reconciler): add Fiber AST node visitor optimization',
    status: 'PR_OPEN',
    creditsUsed: 4,
    costUsd: 0.032,
    createdAt: '5 mins ago',
    prUrl: 'https://github.com/facebook/react/pull/42',
    prNumber: 42,
    latencyMs: 3420,
    modelUsed: 'gemini-1.5-pro',
    tokenBreakdown: { prompt: 4200, cached: 2100, input: 2100, output: 850 },
    logs: [
      '[00:00.01] GitHub Webhook signature verified (event: push)',
      '[00:00.24] Cloned commit e8f9a2b (shallow depth 1)',
      '[00:01.44] Code diff scanner extracted 14 file changes',
      '[00:01.88] Dispatched prompt sys.docgen.code-v1.0 to Gemini 1.5 Pro',
      '[00:03.42] Generated ARCHITECTURE.md diff successfully',
      '[00:03.90] Pull Request #42 opened on GitHub',
    ],
  },
  {
    id: 'j-107',
    repoId: 'repo-2',
    repoName: 'vercel/next.js',
    sha: 'c7a19f2',
    commitMessage: 'fix(router): update app router layout hydration boundary',
    status: 'COMPLETED',
    creditsUsed: 4,
    costUsd: 0.028,
    createdAt: '2 hours ago',
    prUrl: 'https://github.com/vercel/next.js/pull/108',
    prNumber: 108,
    latencyMs: 2890,
    modelUsed: 'gemini-1.5-pro',
    tokenBreakdown: { prompt: 3100, cached: 1500, input: 1600, output: 720 },
    logs: [
      '[00:00.02] Webhook received for vercel/next.js',
      '[00:01.10] Checkout shallow commit c7a19f2',
      '[00:02.89] Gemini 1.5 Pro returned updated API router spec',
    ],
  },
  {
    id: 'j-106',
    repoId: 'repo-3',
    repoName: 'acme/core-engine',
    sha: '992ab10',
    commitMessage: 'refactor(auth): add OAuth JWT refresh token handler',
    status: 'COMPLETED',
    creditsUsed: 2,
    costUsd: 0.014,
    createdAt: '1 day ago',
    prUrl: 'https://github.com/acme/core-engine/pull/19',
    prNumber: 19,
    latencyMs: 1980,
    modelUsed: 'gemini-1.5-flash',
    tokenBreakdown: { prompt: 1800, cached: 900, input: 900, output: 410 },
  },
  {
    id: 'j-105',
    repoId: 'repo-4',
    repoName: 'acme/analytics-pipeline',
    sha: '102fa88',
    commitMessage: 'feat(stream): real-time event aggregation handler',
    status: 'GENERATING',
    creditsUsed: 0,
    createdAt: 'Just now',
    latencyMs: 1200,
    modelUsed: 'gemini-1.5-pro',
  },
];

export const mockBillingSummary: BillingSummary = {
  balance: 45,
  tier: 'Free Tier Active',
  monthlyCap: 100,
  usedThisMonth: 55,
  unitCostPerPull: 0.42,
  burnRate7d: -12,
  resetDaysRemaining: 12,
  ledger: [
    { id: 'tx-101', amount: -4, type: 'USAGE_DEDUCTION', description: 'Doc generation run #j-108 for facebook/react', createdAt: '5 mins ago', jobId: 'j-108' },
    { id: 'tx-100', amount: -4, type: 'USAGE_DEDUCTION', description: 'Doc generation run #j-107 for vercel/next.js', createdAt: '2 hours ago', jobId: 'j-107' },
    { id: 'tx-099', amount: 30, type: 'ADMIN_GRANT', description: 'Granted by admin: Onboarding bonus credits', createdAt: '3 days ago' },
    { id: 'tx-098', amount: 20, type: 'SIGNUP_GRANT', description: 'Initial account activation grant', createdAt: '2 weeks ago' },
  ],
  requests: [
    { id: 'req-1', requestedCredits: 20, reason: 'Benchmarking large enterprise repo codebase scan', status: 'PENDING', createdAt: '1 hour ago' },
    { id: 'req-2', requestedCredits: 30, reason: 'Initial onboarding pilot project', status: 'APPROVED', grantedCredits: 30, adminNotes: 'Approved for onboarding pilot', createdAt: '3 days ago' },
  ],
};

export const mockTaskConfigs: TaskConfig[] = [
  { id: 'tc-1', taskKey: 'tinyRepo', model: 'gemini-1.5-flash', provider: 'Google', promptVersion: 'v1.2', temperature: 0.2, maxTokens: 4096, status: 'Active' },
  { id: 'tc-2', taskKey: 'judge', model: 'gpt-4o-mini', provider: 'OpenAI', promptVersion: 'v2.0', temperature: 0.0, maxTokens: 1024, status: 'Active' },
  { id: 'tc-3', taskKey: 'docGen', model: 'gemini-1.5-pro', provider: 'Google', promptVersion: 'v1.0', temperature: 0.3, maxTokens: 8192, status: 'Active' },
];

export const mockPromptTemplates: PromptTemplate[] = [
  {
    id: 'pt-1',
    key: 'sys.docgen.code-v1.0',
    name: 'Architecture Generator Prompt',
    version: 'v1.0',
    systemPrompt: `You are AutoDocs AI, a senior software architect. Given the codebase diff tree and file list for {{repo_name}}, generate a concise, production-grade ARCHITECTURE.md update in Markdown syntax.`,
    maxOutputTokens: 8192,
    stopTokens: ['```end'],
    estimatedCostPer1k: 0.0025,
  },
  {
    id: 'pt-2',
    key: 'sys.judge.diff-v2.0',
    name: 'Code Diff Impact Classifier',
    version: 'v2.0',
    systemPrompt: `Evaluate whether the provided git commit contains architectural or documentation-impacting code changes. Return JSON: { "shouldGenerate": boolean, "impactScore": number }`,
    maxOutputTokens: 1024,
    stopTokens: ['}\n'],
    estimatedCostPer1k: 0.00015,
  },
];

export const mockAdminStats: AdminStats = {
  totalUsers: 142,
  totalReposConnected: 389,
  totalDocJobs: 1840,
  globalLlmSpendUsd: 142.5,
  activeUsersToday: 28,
  queues: [
    { name: 'repo-storage-queue', active: 0, waiting: 0, completed: 389, failed: 1, p95LatencyMs: 240 },
    { name: 'push-classify-queue', active: 1, waiting: 2, completed: 1420, failed: 3, p95LatencyMs: 110 },
    { name: 'doc-generation-queue', active: 0, waiting: 0, completed: 1840, failed: 8, p95LatencyMs: 3120 },
  ],
  users: [
    { id: 'u-1', email: 'alex.dev@autodocs.io', githubHandle: 'alexdeveloper', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', plan: 'PRO', creditBalance: 145, reposCount: 4, jobsCount: 18 },
    { id: 'u-2', email: 'sarah.tech@acme.com', githubHandle: 'sarahtech', plan: 'FREE', creditBalance: 15, reposCount: 2, jobsCount: 6 },
    { id: 'u-3', email: 'devops@enterprise.org', githubHandle: 'enterprise-admin', plan: 'ENTERPRISE', creditBalance: 1200, reposCount: 24, jobsCount: 340 },
  ],
};
