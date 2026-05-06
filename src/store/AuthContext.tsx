import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  getMe,
  login,
  register,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from '../services';
import { clearStoredToken, getStoredToken, setStoredToken } from './authStorage';

type AuthContextValue = {
  isLoading: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  token: string | null;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const applySession = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    await setStoredToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const signIn = useCallback(
    async (payload: LoginPayload) => {
      const auth = await login(payload);
      await applySession(auth.token, auth.user);
    },
    [applySession],
  );

  const signUp = useCallback(
    async (payload: RegisterPayload) => {
      const auth = await register(payload);
      await applySession(auth.token, auth.user);
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedToken = await getStoredToken();

        if (!storedToken) {
          return;
        }

        const response = await getMe(storedToken);

        if (isMounted) {
          setToken(storedToken);
          setUser(response.user);
        }
      } catch {
        await clearStoredToken();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      signIn,
      signOut,
      signUp,
      token,
      user,
    }),
    [isLoading, signIn, signOut, signUp, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
