import React, { useEffect, useState } from 'react';
import { ActiveScreen, User } from './types';
import { fetchCurrentUser, logoutUser, refreshAccessToken } from './services/api';
import { AppShell } from './components/AppShell';

// Page Components
import { AuthPage } from './pages/AuthPage';
import { GitHubOnboardingPage } from './pages/GitHubOnboardingPage';
import { RepositoriesHubPage } from './pages/RepositoriesHubPage';
import { RepoDetailsPage } from './pages/RepoDetailsPage';
import { JobsLogsPage } from './pages/JobsLogsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { BillingPage } from './pages/BillingPage';
import { LLMConfigPage } from './pages/LLMConfigPage';
import { MainDashboardPage } from './pages/MainDashboardPage';
import { HeroLandingPage } from './pages/HeroLandingPage';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('dashboard');
  const [selectedRepoId, setSelectedRepoId] = useState<string>('repo-1');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    refreshAccessToken()
      .then((token) => {
        if (token) {
          return fetchCurrentUser();
        }
        return null;
      })
      .then((userData) => {
        setUser(userData);
        if (userData && window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })
      .catch((err) => {
        console.warn('[App] Init auth failed:', err);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setCurrentScreen('auth');
  };

  // Spinner while checking backend JWT refresh session on startup
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#09090b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #7c3aed, #34d399)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(124, 58, 237, 0.5)',
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: 800,
          }}
        >
          ⚡
        </div>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 600 }}>Authenticating Session...</p>
      </div>
    );
  }

  // Strictly block unauthenticated users from seeing AppShell / Dashboard
  if (!user) {
    if (currentScreen === 'hero') {
      return <HeroLandingPage onStartDemo={() => setCurrentScreen('auth')} />;
    }
    return (
      <AuthPage
        onLoginSuccess={(demoUser) => {
          if (demoUser) {
            setUser(demoUser);
          }
          setCurrentScreen('dashboard');
        }}
      />
    );
  }

  // Render Page Content inside App Shell for authenticated users
  const renderScreen = () => {
    switch (currentScreen) {
      case 'hero':
        return <HeroLandingPage onStartDemo={() => setCurrentScreen('onboarding')} />;
      case 'onboarding':
        return <GitHubOnboardingPage onComplete={() => setCurrentScreen('repos')} />;
      case 'repos':
        return (
          <RepositoriesHubPage
            onSelectRepo={(id) => {
              setSelectedRepoId(id);
              setCurrentScreen('repo-details');
            }}
          />
        );
      case 'repo-details':
        return <RepoDetailsPage repoId={selectedRepoId} onBack={() => setCurrentScreen('repos')} />;
      case 'jobs':
        return <JobsLogsPage />;
      case 'admin':
        return <AdminDashboardPage />;
      case 'billing':
        return <BillingPage />;
      case 'llm-config':
        return <LLMConfigPage />;
      case 'dashboard':
      default:
        return <MainDashboardPage onNavigate={(s) => setCurrentScreen(s as ActiveScreen)} user={user} />;
    }
  };

  return (
    <AppShell currentScreen={currentScreen} onNavigate={setCurrentScreen} user={user} onLogout={handleLogout}>
      {renderScreen()}
    </AppShell>
  );
};

export default App;

