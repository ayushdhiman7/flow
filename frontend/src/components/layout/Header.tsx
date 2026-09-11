import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Avatar, Dropdown, Input } from '../ui';
import { useAuthStore, useUIStore } from '../../store';
import { authApi } from '../../api/endpoints';
import { classNames } from '../../utils';

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar, rightSidebarOpen, toggleRightSidebar } = useUIStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { label: 'Profile', onClick: () => navigate('/settings/profile') },
    { label: 'Settings', onClick: () => navigate('/settings') },
    { label: 'Logout', onClick: handleLogout, danger: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b dark:border-slate-700">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">Flow</Link>
        </div>

        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </Button>

          <Button variant="ghost" size="sm" onClick={toggleRightSidebar} aria-label="Toggle chat">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </Button>

          <Dropdown trigger={
            <Button variant="ghost" size="sm" className="p-1">
              <Avatar name={user?.name || 'User'} src={user?.avatar} size="sm" status="online" />
            </Button>
          } items={userMenuItems} align="right" />
        </div>
      </div>
    </header>
  );
}