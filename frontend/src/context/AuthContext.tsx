import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { loginApi, registerApi, logoutApi, fetchMeApi, changePasswordApi } from '../services/api';
import { db } from '../db/dexieDb';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    department_id?: string;
    job_title?: string;
    role?: Role;
    admin_secret?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('Employee');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('techbridge_token');
    const storedUserStr = localStorage.getItem('techbridge_user');

    if (storedToken && storedUserStr) {
      try {
        const parsedUser: User = JSON.parse(storedUserStr);
        setUser(parsedUser);
        setRole(parsedUser.role || 'Employee');
        setToken(storedToken);

        // Validate token with the API in the background on every page load.
        // If the server rejects it (expired / revoked) the user is logged out.
        fetchMeApi(storedToken).then((validatedUser) => {
          if (validatedUser) {
            setUser(validatedUser);
            setRole(validatedUser.role || 'Employee');
            localStorage.setItem('techbridge_user', JSON.stringify(validatedUser));
          } else {
            // Token rejected by server — force re-login
            localStorage.removeItem('techbridge_token');
            localStorage.removeItem('techbridge_user');
            localStorage.removeItem('techbridge_session_at');
            setUser(null);
            setToken(null);
            setRole('Employee');
          }
        });
      } catch (e) {
        localStorage.removeItem('techbridge_token');
        localStorage.removeItem('techbridge_user');
        localStorage.removeItem('techbridge_session_at');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim();
    try {
      const res = await loginApi(cleanEmail, pass);
      if (res && res.user && res.token) {
        setUser(res.user);
        setRole(res.user.role || 'Employee');
        setToken(res.token);
        localStorage.setItem('techbridge_token', res.token);
        localStorage.setItem('techbridge_user', JSON.stringify(res.user));
        localStorage.setItem('techbridge_session_at', String(Date.now()));
        setIsLoading(false);
        return { success: true };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'Login failed. Please check credentials.' };
    }

    setIsLoading(false);
    return { success: false, error: 'Invalid email or password credentials.' };
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    department_id?: string;
    job_title?: string;
    role?: Role;
    admin_secret?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await registerApi({
        ...data,
        role: data.role || 'Employee',
        // admin_secret is only forwarded if the user explicitly typed it in
        // the registration form. It is NEVER auto-filled client-side.
        admin_secret: data.admin_secret,
      });

      if (res && res.user && res.token) {
        setUser(res.user);
        setRole(res.user.role || 'Employee');
        setToken(res.token);
        localStorage.setItem('techbridge_token', res.token);
        localStorage.setItem('techbridge_user', JSON.stringify(res.user));
        setIsLoading(false);
        return { success: true };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'Registration failed' };
    }

    setIsLoading(false);
    return { success: false, error: 'Registration failed. Email may already be registered.' };
  };

  const logout = () => {
    if (token) {
      logoutApi(token);
    }
    localStorage.removeItem('techbridge_token');
    localStorage.removeItem('techbridge_user');
    localStorage.removeItem('techbridge_session_at');
    setUser(null);
    setToken(null);
    setRole('Employee');
    // Wipe cached user identity from IndexedDB so offline sync cannot impersonate the old user
    db.userProfile.clear().catch(() => {});
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated.' };
    return changePasswordApi(token, currentPassword, newPassword, newPasswordConfirmation);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
