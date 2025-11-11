import { useContext, createContext, ReactNode, useState, useEffect } from "react";
import { User, AuthContextType } from "@/types/auth";
import api from "@/lib/axiosConfig";
import { useLocation, useNavigate } from "react-router-dom";

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);


  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/auth/me');
      
      const data = response.data;

      const mappedUser = {
        id: data.user._id,
        email: data.user.email,
        name: data.user.name,
        gender: data.user.gender
      };
      setUser(mappedUser);
      setError(null);
    } catch (error: any) {
      // Axios interceptor will handle 401 and refresh automatically
      // We just need to handle the final failure
      setUser(null);
      setError('Authentication check failed');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      console.log('Login successful:', data);

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
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/register', { name, email, password });
      console.log('Registration successful');
      setLoading(false);
      setError(null);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      setLoading(false);
      setError(null);
      navigate('/login');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user, // Simple boolean check
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};