import {
  AccessibleRepo,
  AdminStats,
  BillingSummary,
  DashboardStats,
  DocJob,
  ImportedRepo,
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
        creditBalance: u.creditBalance ?? (100 - (u.usedDocsQuota || 0)),
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
        avgLatencySeconds: res.avgLatencySeconds || 3.12,
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
          timestamp: ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Recently',
        })),
      };
    }
  } catch (err) {
    console.warn('[API] fetchDashboardStats using fallback stats:', err);
  }
  return {
    importedReposCount: 4,
    totalJobsExecuted: 1248,
    activePipelinesCount: 2,
    openPullRequestsCount: 4,
    avgLatencySeconds: 3.12,
    successRatePercent: 98.4,
    creditsBurnedToday: 18,
    sparkline7d: [12, 18, 15, 24, 30, 22, 18],
    recentJobs: mockJobsList,
    liveEvents: [
      { id: 'ev-1', type: 'PUSH', repoName: 'facebook/react', message: 'c7a19f2 push to main branch', timestamp: '2 mins ago' },
      { id: 'ev-2', type: 'PR_OPEN', repoName: 'facebook/react', message: 'PR #42 opened: Sync Architecture Docs', timestamp: '5 mins ago' },
      { id: 'ev-3', type: 'PR_MERGED', repoName: 'vercel/next.js', message: 'PR #108 merged: Update API Routing Specs', timestamp: '22 mins ago' },
    ],
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
        id: String(r.id || r.github_repo_id),
        name: r.name || (r.full_name ? r.full_name.split('/')[1] : r.id),
        fullName: r.full_name || r.name || String(r.id),
        private: r.private ?? false,
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
  return await apiFetch<{ success: boolean; jobId: string; message: string }>(`/api/repos/${repoId}/generate`, {
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
  return await apiFetch<{ success: boolean; message: string; job: any }>(`/api/jobs/${jobId}/retry`, {
    method: 'POST',
  });
}

// Billing API
export async function fetchBillingSummary(): Promise<BillingSummary> {
  try {
    const res = await apiFetch<{ success: boolean; balance: any; requests: any[]; ledger: any[] }>('/api/billing/summary');
    if (res.success) {
      return {
        balance: res.balance?.current ?? 45,
        tier: res.balance?.tier ? `${res.balance.tier} Tier Active` : 'Free Tier Active',
        monthlyCap: res.balance?.monthlyCap || 100,
        usedThisMonth: (res.balance?.monthlyCap || 100) - (res.balance?.current || 45),
        unitCostPerPull: 10,
        burnRate7d: res.balance?.burnRate7d || 10,
        resetDaysRemaining: 12,
        ledger: (res.ledger || []).map((l: any) => ({
          id: l.id,
          amount: l.amount,
          type: l.type || 'USAGE_DEDUCTION',
          description: l.description || '',
          createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Recently',
          jobId: l.jobId,
        })),
        requests: (res.requests || []).map((r: any) => ({
          id: r.id,
          requestedCredits: r.amount || r.requestedCredits,
          reason: r.reason || r.description || '',
          status: r.status || 'PENDING',
          grantedCredits: r.grantedAmount,
          adminNotes: r.adminNotes,
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently',
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

// Admin API
export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const res = await apiFetch<any>('/api/admin/stats');
    if (res.success && res.overview) {
      const qH = res.queueHealth || {};
      return {
        totalUsers: res.overview.totalUsers || 0,
        totalReposConnected: res.overview.totalRepos || 0,
        totalDocJobs: res.overview.totalJobs || 0,
        globalLlmSpendUsd: res.overview.globalLlmSpend || 0,
        activeUsersToday: res.overview.activeUsersToday || 0,
        queues: [
          { name: 'repo-storage-queue', active: qH.repoStorageQueue?.active || 0, waiting: qH.repoStorageQueue?.waiting || 0, completed: qH.repoStorageQueue?.completed || 0, failed: qH.repoStorageQueue?.failed || 0, p95LatencyMs: 240 },
          { name: 'push-classify-queue', active: qH.classifyQueue?.active || 0, waiting: qH.classifyQueue?.waiting || 0, completed: qH.classifyQueue?.completed || 0, failed: qH.classifyQueue?.failed || 0, p95LatencyMs: 110 },
          { name: 'doc-generation-queue', active: qH.docGenQueue?.active || 0, waiting: qH.docGenQueue?.waiting || 0, completed: qH.docGenQueue?.completed || 0, failed: qH.docGenQueue?.failed || 0, p95LatencyMs: 3120 },
        ],
        users: mockAdminStats.users,
      };
    }
  } catch (err) {
    console.warn('[API] fetchAdminStats fallback:', err);
  }
  return mockAdminStats;
}

// LLM & Task Configuration API
export async function fetchTaskConfigs(): Promise<TaskConfig[]> {
  try {
    const res = await apiFetch<{ success: boolean; data: any[] }>('/api/llm-config');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map((c: any) => ({
        id: c.id,
        taskKey: c.taskKey,
        model: c.model?.modelName || 'gemini-1.5-pro',
        provider: c.model?.provider || 'Google',
        promptVersion: c.prompt?.key || 'v1.0',
        temperature: c.temperature || 0.2,
        maxTokens: c.maxOutputTokens || 4096,
        status: 'Active',
      }));
    }
  } catch (err) {
    console.warn('[API] fetchTaskConfigs fallback:', err);
  }
  return mockTaskConfigs;
}

export async function fetchPromptTemplates(): Promise<PromptTemplate[]> {
  try {
    const res = await apiFetch<{ success: boolean; data: any[] }>('/api/prompts');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map((p: any) => ({
        id: p.id,
        key: p.key,
        name: p.name || p.key,
        version: 'v1.0',
        systemPrompt: p.content || '',
        maxOutputTokens: 8192,
        stopTokens: ['```end'],
        estimatedCostPer1k: 0.0025,
      }));
    }
  } catch (err) {
    console.warn('[API] fetchPromptTemplates fallback:', err);
  }
  return mockPromptTemplates;
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
      { repoId: 'r-1', repoName: 'facebook/react', path: 'ARCHITECTURE.md', snippet: 'Root React Fiber reconciler & AST AST tree scan...' },
      { repoId: 'r-2', repoName: 'vercel/next.js', path: 'API_ROUTING.md', snippet: 'App Router layout nesting & server component hydration specs' },
    ],
  };
}

function mapBackendJobToDocJob(j: any): DocJob {
  return {
    id: j.id,
    repoId: j.repoId || j.repository?.id || '',
    repoName: j.repository?.full_name || j.repoName || 'repository',
    sha: j.triggerCommit ? j.triggerCommit.slice(0, 7) : 'e8f9a2b',
    commitMessage: j.commitMessage || `Trigger commit ${j.triggerCommit?.slice(0, 7) || ''}`,
    status: j.status || 'COMPLETED',
    creditsUsed: j.creditsDeducted || 10,
    costUsd: j.tokenBreakdown?.costUsd || 0.025,
    createdAt: j.createdAt ? new Date(j.createdAt).toLocaleTimeString() : 'Recently',
    prUrl: j.prLink || undefined,
    prNumber: j.pullRequestId || undefined,
    latencyMs: j.tokenBreakdown?.durationMs || 3000,
    modelUsed: 'gemini-1.5-pro',
    tokenBreakdown: j.tokenBreakdown ? {
      prompt: j.tokenBreakdown.promptTokens || 0,
      cached: j.tokenBreakdown.cachedTokens || 0,
      input: j.tokenBreakdown.inputTokens || 0,
      output: j.tokenBreakdown.outputTokens || 0,
    } : undefined,
    logs: j.stdoutLogs || [
      `Job ${j.id} initialized for repo ${j.repository?.full_name || ''}`,
      `Status: ${j.status}`,
    ],
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
      '[00:01.44] AST diff scanner extracted 14 file changes',
      '[00:01.88] Dispatched prompt sys.docgen.ast-v1.0 to Gemini 1.5 Pro',
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
    { id: 'req-1', requestedCredits: 20, reason: 'Benchmarking large enterprise repo AST scan', status: 'PENDING', createdAt: '1 hour ago' },
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
    key: 'sys.docgen.ast-v1.0',
    name: 'AST Architecture Generator Prompt',
    version: 'v1.0',
    systemPrompt: `You are AutoDocs AI, a senior software architect. Given the AST diff tree and file list for {{repo_name}}, generate a concise, production-grade ARCHITECTURE.md update in Markdown syntax.`,
    maxOutputTokens: 8192,
    stopTokens: ['```end'],
    estimatedCostPer1k: 0.0025,
  },
  {
    id: 'pt-2',
    key: 'sys.judge.diff-v2.0',
    name: 'AST Diff Impact Classifier',
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
