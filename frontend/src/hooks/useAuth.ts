import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/endpoints';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, setLoading, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authApi.me();
        setAuth(res.data.user, '');
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [setAuth, setLoading, logout]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setAuth(res.data.user, res.data.accessToken);
    navigate('/');
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await authApi.register({ email, password, name });
    setAuth(res.data.user, res.data.accessToken);
    navigate('/');
  };

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    navigate('/login');
  };

  return { user, isAuthenticated, isLoading, login, register, logout: handleLogout };
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  return { isAuthenticated, isLoading };
}