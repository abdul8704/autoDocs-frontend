import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Cpu,
  CreditCard,
  Sliders,
  ShieldCheck,
  Github,
  Zap,
  Search,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { ActiveScreen, getNumericCreditBalance, User } from '../types';
import { CommandPaletteModal } from './CommandPaletteModal';

import logoImg from '../assets/logo.svg';

interface AppShellProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  user: User;
  onLogout?: () => void;
  isGitHubInstalled?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ currentScreen, onNavigate, user, onLogout, isGitHubInstalled = true, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const numericCreditBalance = getNumericCreditBalance(user?.creditBalance);

  const isAdmin = user?.role === 'ADMIN';

  const navItems: Array<{ id: ActiveScreen; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Main Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'repos', label: 'Repositories Hub', icon: <FolderGit2 size={18} />, badge: '4 Repos' },
    { id: 'jobs', label: 'Jobs & Execution Logs', icon: <Cpu size={18} />, badge: 'Live Stream' },
    { id: 'billing', label: 'Billing & Credit Requests', icon: <CreditCard size={18} /> },
    ...(isAdmin ? [
      { id: 'llm-config' as ActiveScreen, label: 'LLM Task Pipeline Config', icon: <Sliders size={18} /> },
      { id: 'admin' as ActiveScreen, label: 'Admin Master Console', icon: <ShieldCheck size={18} />, badge: 'Admin' },
    ] : []),
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#09090b', color: '#fafafa' }}>
      {/* SIDEBAR NAVIGATION (256px Fixed) */}
      <aside
        style={{
          width: '256px',
          backgroundColor: '#0c0c0f',
          borderRight: '1px solid #27272a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
          transition: 'transform 0.3s ease',
          transform: window.innerWidth < 1024 && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        <div>
          {/* Brand Logo Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
              <img
                src={logoImg}
                alt="AutoDocs Logo"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)',
                  objectFit: 'contain',
                }}
              />
              <div>
                <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#fafafa' }}>
                  AutoDocs
                </h1>
                <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>v1.0</span>
              </div>
            </div>
            {mobileOpen && (
              <button onClick={() => setMobileOpen(false)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa' }}>
                <X size={20} />
              </button>
            )}
          </div>

          {/* Nav Items List */}
          <nav style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!isGitHubInstalled) {
                      onNavigate('onboarding');
                    } else {
                      onNavigate(item.id);
                    }
                    setMobileOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#1e1e22' : 'transparent',
                    color: isActive ? '#fafafa' : '#a1a1aa',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: isActive ? '#a78bfa' : 'inherit' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '9999px',
                        background: isActive ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        color: isActive ? '#a78bfa' : '#71717a',
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Widgets */}
        <div style={{ padding: '1rem', borderTop: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Active Credit Usage Widget */}
          <div
            onClick={() => onNavigate('billing')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} color="#34d399" />
              <span style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 600 }}>Credit Usage</span>
            </div>
            <span style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {numericCreditBalance} ⚡
            </span>
          </div>

          {/* User Profile Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', flex: 1 }}>
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt="User Avatar"
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #52525b', flexShrink: 0 }}
              />
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.githubHandle || user.email}
                </div>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                style={{
                  background: 'transparent',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '0.45rem',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, marginLeft: window.innerWidth >= 1024 ? '256px' : 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* STICKY HEADER BAR */}
        <header
          style={{
            height: '64px',
            backgroundColor: '#0c0c0f',
            borderBottom: '1px solid #27272a',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {window.innerWidth < 1024 && (
              <button
                onClick={() => setMobileOpen(true)}
                style={{ background: 'transparent', border: 'none', color: '#fafafa', cursor: 'pointer' }}
              >
                <Menu size={22} />
              </button>
            )}

            {/* Command Palette Trigger Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: '#121215',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '0.45rem 1rem',
                color: '#a1a1aa',
                fontSize: '0.85rem',
                cursor: 'pointer',
                width: window.innerWidth < 640 ? '160px' : '320px',
              }}
            >
              <Search size={16} color="#71717a" />
              <span style={{ flex: 1, textAlign: 'left' }}>Search (⌘K)...</span>
              <kbd style={{ backgroundColor: '#1e1e22', border: '1px solid #3f3f46', borderRadius: '4px', padding: '1px 5px', fontSize: '0.7rem', color: '#d4d4d8' }}>
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Header Action Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Credit Balance Pill */}
            <button
              onClick={() => onNavigate('billing')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                color: '#a78bfa',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Zap size={14} color="#a78bfa" />
              {numericCreditBalance} ⚡
            </button>

            {/* GitHub App Link CTA */}
            <a
              href="https://github.com/apps/aiautodocs"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#a1a1aa',
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Github size={16} />
              <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>GitHub App</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </header>

        {/* SCREEN CANVAS */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>{children}</main>
      </div>

      {/* COMMAND PALETTE MODAL (⌘K) */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(screen) => onNavigate(screen as ActiveScreen)}
      />
    </div>
  );
};
