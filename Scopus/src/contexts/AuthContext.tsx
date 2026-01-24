import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id?: number;
  username: string;
  facultyId?: string;
  facultyName?: string;
  scopusId?: string;
  accessLevel: number; // 1 = Admin, 2 = Faculty (full), 3 = Faculty (restricted)
  email?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasAccess: (requiredLevels: number[]) => boolean;
  isAdmin: () => boolean;
  isFaculty: () => boolean;
  isRestrictedFaculty: () => boolean;
  canAccessFacultyData: (facultyId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Store user in state and localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Check if user has access level
  const hasAccess = (requiredLevels: number[]): boolean => {
    if (!user) return false;
    return requiredLevels.includes(user.accessLevel);
  };

  // Check if user is admin (access_level = 1)
  const isAdmin = (): boolean => {
    return user?.accessLevel === 1 || false;
  };

  // Check if user is faculty (access_level = 2 or 3)
  const isFaculty = (): boolean => {
    return (user?.accessLevel === 2 || user?.accessLevel === 3) || false;
  };

  // Check if user is restricted faculty (access_level = 3)
  const isRestrictedFaculty = (): boolean => {
    return user?.accessLevel === 3 || false;
  };

  // Check if user can access specific faculty data
  // Admins and full-access faculty can access any faculty
  // Restricted faculty can only access their own
  const canAccessFacultyData = (facultyId: string): boolean => {
    if (!user) return false;
    
    // Admin (1) can access all
    if (user.accessLevel === 1) return true;
    
    // Full-access faculty (2) can access all
    if (user.accessLevel === 2) return true;
    
    // Restricted faculty (3) can only access own
    if (user.accessLevel === 3) {
      return user.facultyId === facultyId;
    }
    
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        hasAccess,
        isAdmin,
        isFaculty,
        isRestrictedFaculty,
        canAccessFacultyData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
