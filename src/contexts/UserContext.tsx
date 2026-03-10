import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User } from '../services/auth-service';
import { authService } from '../services/auth-service';
import { getUserServiceClient } from '../services/api-client';

interface UserContextType {
  currentUser?: User;
  setCurrentUser: (user?: User) => void;
  isLoading: boolean;
  refreshUser: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Function to load current user data from API
  const refreshUser = async (): Promise<boolean> => {
    try {
      const token = authService.getAccessToken();
      if (!token) {
        setCurrentUser(undefined);
        setIsLoading(false);
        return false;
      }

      const client = await getUserServiceClient();
      const apiUser = await client.getCurrentUser(token);
      
      // Map API user to auth service User interface
      const user: User = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
        status: apiUser.status,
        basePermissions: apiUser.basePermissions || [],
        specialPermissions: apiUser.specialPermissions || [],
        joinedDate: apiUser.joinedDate,
        lastActive: apiUser.lastActive,
        gitUsername: (apiUser as any).gitUsername,
        gitEmail: (apiUser as any).gitEmail,
      };
      
      setCurrentUser(user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Failed to load current user:", error);
      setCurrentUser(undefined);
      setIsLoading(false);
      return false;
    }
  };

  // Check auth on load
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        // Try to load fresh data from API first
        const success = await refreshUser();

        // If API call fails, use cached data
        if (!success) {
          const user = authService.getCurrentUser();
          if (user) {
            setCurrentUser(user);
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const value: UserContextType = {
    currentUser,
    setCurrentUser,
    isLoading,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
