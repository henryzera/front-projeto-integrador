import { createContext, useContext, type PropsWithChildren } from 'react';

import { useLicitacoesStreaming, type LicitacoesStreamingState } from '../hooks';
import { useAuth } from './AuthContext';

const StreamingContext = createContext<LicitacoesStreamingState | undefined>(undefined);

export function StreamingProvider({ children }: PropsWithChildren) {
  const { token } = useAuth();
  const streaming = useLicitacoesStreaming(Boolean(token));

  return <StreamingContext.Provider value={streaming}>{children}</StreamingContext.Provider>;
}

export function useLicitacoesStream() {
  const context = useContext(StreamingContext);

  if (!context) {
    throw new Error('useLicitacoesStream must be used inside StreamingProvider');
  }

  return context;
}
