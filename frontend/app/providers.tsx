'use client';

import { ReactNode, createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi, workspacesApi } from '../lib/api';

/**
 * Auth Context for managing authentication state
 */
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
}

interface RegisterResult {
  requiresVerification?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<RegisterResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Workspace Context for multi-tenant support
 */
interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

/**
 * Toast/Notification Context
 */
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Main Providers Component
 */
export function Providers({ children }: { children: ReactNode }) {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Workspace State
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Check authentication on mount
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          if (isMounted) setIsLoading(false);
          return;
        }
        const response = await authApi.me();
        if (isMounted && response.data) {
          setUser(response.data as User);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auth Functions
  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { user: userData, accessToken, refreshToken } = response.data as {
      user: User;
      accessToken: string;
      refreshToken: string;
    };
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setCurrentWorkspace(null);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<RegisterResult> => {
    const response = await authApi.register(email, password, name);
    const data = response.data as {
      user: User;
      accessToken?: string;
      refreshToken?: string;
      requiresVerification?: boolean;
    };
    if (data.accessToken) {
      localStorage.setItem('auth_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken || '');
      setUser(data.user);
    }
    return { requiresVerification: data.requiresVerification };
  }, []);

  // Workspace Functions
  const switchWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem('currentWorkspaceId', workspaceId);
    }
  }, [workspaces]);

  const createWorkspace = useCallback(async (name: string): Promise<Workspace> => {
    const response = await workspacesApi.create(name);
    const newWorkspace = response.data as Workspace;
    setWorkspaces(prev => [...prev, newWorkspace]);
    return newWorkspace;
  }, []);

  // Toast Functions
  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
      }}
    >
      <WorkspaceContext.Provider
        value={{
          currentWorkspace,
          workspaces,
          switchWorkspace,
          createWorkspace,
        }}
      >
        <ToastContext.Provider
          value={{
            toasts,
            addToast,
            removeToast,
          }}
        >
          {children}
          <ToastContainer />
        </ToastContext.Provider>
      </WorkspaceContext.Provider>
    </AuthContext.Provider>
  );
}

/**
 * Toast Container Component
 */
function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const handleRemoveToast = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts?.length > 0 ? toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-slide-up rounded-lg px-4 py-3 shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            toast.type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{toast.message}</span>
            <button
              onClick={() => handleRemoveToast(toast.id)}
              className="ml-2 hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )) : null}
    </div>
  );
}

