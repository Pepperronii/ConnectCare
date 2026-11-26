import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import api from '../api/axios';
import type {
  User,
  LoginData,
  LoginResponse,
  RegisterData,
} from '../types/auth';

interface AuthContextType {
  user: User | null;
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = sessionStorage.getItem('user');
      const token = sessionStorage.getItem('access_token');

      return savedUser && token
        ? JSON.parse(savedUser)
        : null;
    } catch {
      return null;
    }
  });

  const login = async (data: LoginData): Promise<User> => {
    const response = await api.post<LoginResponse>(
      '/auth/login',
      data,
    );

    const { access_token, user } = response.data;

    sessionStorage.setItem('access_token', access_token);
    sessionStorage.setItem('user', JSON.stringify(user));

    setUser(user);

    return user;
  };

  const register = async (data: RegisterData) => {
    await api.post('/auth/register', data);
  };

  const logout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}