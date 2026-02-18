import { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import { axiosInstance } from '../services/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const getInitialToken = () => localStorage.getItem('token');
  const getInitialUser = () => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  };

  const [user, setUser] = useState<User | null>(getInitialUser);
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [isLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/user/login', {
        email,
        password,
      });

      const { token: newToken, id, name, email: userEmail, role } = response.data;

      const userData: User = {
        id,
        name,
        email: userEmail,
        role,
      };
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('Login error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/user/register', {
        name,
        email,
        password,
      });

      const { token: newToken, id, name: userName, email: userEmail, role } = response.data;

      const userData: User = {
        id,
        name: userName,
        email: userEmail,
        role,
      };

      // Save to state
      setToken(newToken);
      setUser(userData);

      // Save to localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('Registration error:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAdmin = () => {
    return user?.role === 'Admin';
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
