export type ActiveScreen =
  | 'hero'
  | 'auth'
  | 'onboarding'
  | 'dashboard'
  | 'repos'
  | 'repo-details'
  | 'jobs'
  | 'billing'
  | 'llm-config'
  | 'admin';

export function getNumericCreditBalance(cb: any, fallbackQuotaUsed: number = 0): number {
  if (typeof cb === 'number' && !isNaN(cb)) return cb;
  if (cb && typeof cb === 'object' && typeof cb.balance === 'number' && !isNaN(cb.balance)) {
    return cb.balance;
  }
  return Math.max(0, 100 - (fallbackQuotaUsed || 0));
}

export interface User {
  id: string;
  email: string;
  githubHandle?: string;
  avatarUrl?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  role?: 'ADMIN' | 'USER';
  creditBalance: number | { balance?: number; [key: string]: any };
  monthlyQuota: number;
  quotaUsed: number;
  githubInstallationId?: number | null;
}

export interface AccessibleRepo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  cloneUrl: string;
  defaultBranch: string;
  installationId: number;
  language?: string;
  sizeKb?: number;
  isImported?: boolean;
}

export interface ImportedRepo {
  id: string;
  githubRepoId: string;
  name: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
  language?: string;
  private: boolean;
  createdAt: string;
  lastJobStatus?: 'COMPLETED' | 'PR_OPEN' | 'GENERATING' | 'FAILED' | 'IDLE' | 'DROPPED' | 'LLM_JUDGE_REJECTED' | 'MERGED';
  lastRunTime?: string;
  totalRuns?: number;
}

export interface DocJob {
  id: string;
  repoId: string;
  repoName: string;
  sha: string;
  triggerEvent?: string;
  commitMessage?: string;
  status: 'PENDING' | 'CLONING' | 'SCANING' | 'GENERATING' | 'COMPLETED' | 'PR_OPEN' | 'FAILED' | 'INSUFFICIENT_CREDITS' | 'QUEUED' | 'DROPPED' | 'LLM_JUDGE_REJECTED' | 'MERGED' | 'WAITING_LLM_JUDGE';
  creditsUsed: number;
  costUsd?: number;
  createdAt: string;
  displayTime?: string;
  prUrl?: string;
  prNumber?: number;
  latencyMs?: number;
  modelUsed?: string;
  tokenBreakdown?: {
    prompt: number;
    cached: number;
    input: number;
    output: number;
  };
  logs?: string[];
}

export interface DashboardStats {
  importedReposCount: number;
  totalJobsExecuted: number;
  activePipelinesCount: number;
  openPullRequestsCount: number;
  avgLatencySeconds: number;
  successRatePercent: number;
  creditsBurnedToday: number;
  sparkline7d: number[];
  recentJobs: DocJob[];
  liveEvents: Array<{
    id: string;
    type: 'PUSH' | 'PR_OPEN' | 'PR_MERGED' | 'JOB_COMPLETE';
    repoName: string;
    message: string;
    timestamp: string;
  }>;
}

export interface LedgerTransaction {
  id: string;
  amount: number;
  type: 'USAGE_DEDUCTION' | 'SIGNUP_GRANT' | 'ADMIN_GRANT' | 'ADMIN_TOP_UP' | 'PURCHASE';
  description: string;
  createdAt: string;
  transactionDate?: string;
  transactionTime?: string;
  repoName?: string;
  jobId?: string;
}

export interface CreditRequest {
  id: string;
  requestedCredits: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  grantedCredits?: number;
  adminNotes?: string;
  createdAt: string;
}

export interface BillingSummary {
  balance: number;
  tier: string;
  monthlyCap: number;
  usedThisMonth: number;
  unitCostPerPull: number;
  burnRate7d: number;
  resetDaysRemaining: number;
  creditsUsedToday?: number;
  creditsUsed7d?: number;
  history7d?: Array<{ date: string; fullDate: string; credits: number }>;
  history28d?: Array<{ date: string; fullDate: string; credits: number }>;
  historyAllTime?: Array<{ date: string; fullDate: string; credits: number }>;
  ledger: LedgerTransaction[];
  requests: CreditRequest[];
}

export interface TaskConfig {
  id: string;
  taskKey: string;
  model: string;
  provider: 'Google' | 'OpenAI' | 'Anthropic';
  promptTitle?: string;
  promptVersion: string;
  temperature: number;
  maxTokens: number;
  status: 'Active' | 'Draft' | 'Deprecated';
}

export interface PromptTemplate {
  id: string;
  key: string;
  name: string;
  promptTitle?: string;
  version: string;
  systemPrompt: string;
  maxOutputTokens: number;
  stopTokens: string[];
  estimatedCostPer1k: number;
}

export interface ModelRosterItem {
  id: string;
  modelName: string;
  provider: string;
  contextWindow: number;
  inputPrice: number;
  outputPrice: number;
  cacheRead?: number;
  cacheWrite?: number;
  cacheStorageCostPerHour?: number;
}

export interface AdminStats {
  totalUsers: number;
  totalReposConnected: number;
  totalDocJobs: number;
  globalLlmSpendUsd: number;
  activeUsersToday: number;
  queues: Array<{
    name: string;
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    p95LatencyMs: number;
  }>;
  users: Array<{
    id: string;
    email: string;
    githubHandle?: string;
    avatarUrl?: string;
    plan: string;
    role?: string;
    creditBalance: number;
    reposCount: number;
    jobsCount: number;
  }>;
}

export interface SearchResults {
  repositories: Array<{ id: string; name: string; fullName: string }>;
  jobs: Array<{ id: string; sha: string; repoName: string; status: string }>;
  docs: Array<{ repoId: string; repoName: string; path: string; snippet: string }>;
}
