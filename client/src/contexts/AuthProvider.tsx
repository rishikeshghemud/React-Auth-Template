import { useContext, createContext, ReactNode, useState, useEffect } from "react";
import { User, AuthContextType } from "@/types/auth";

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Simple state hooks instead of reducer
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies in request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Map MongoDB user to client User type
        const mappedUser = {
          id: data.user._id,
          email: data.user.email,
          name: data.user.name,
          gender: data.user.gender
        };
        setUser(mappedUser);
        setLoading(false);
        setError(null);
      } else if (response.status === 401) {
        // Try to refresh token
        await refreshAccessToken();
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include cookies in request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Try to get user info again after successful refresh
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (userResponse.ok) {
          const data = await userResponse.json();
          // Map MongoDB user to client User type
          const mappedUser = {
            id: data.user._id,
            email: data.user.email,
            name: data.user.name,
            gender: data.user.gender
          };
          setUser(mappedUser);
          setLoading(false);
          setError(null);
          return true;
        }
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      setLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // No need to store token manually - it's in HTTP-only cookie
      // Map MongoDB user to client User type
      const mappedUser = {
        id: data.user._id,
        email: data.user.email,
        name: data.user.name,
        gender: data.user.gender
      };
      
      setUser(mappedUser);
      setLoading(false);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Registration successful - don't auto-login, just stop loading
      setLoading(false);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint to clear cookies on server
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Even if logout request fails, clear local state
      console.error('Logout request failed:', error);
    } finally {
      // Clear all auth state
      setUser(null);
      setLoading(false);
      setError(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user, // Simple boolean check
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};