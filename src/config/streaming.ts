const defaultStreamingUrl = 'wss://cesar-engenharia-de-dados.onrender.com/ws/notificacoes';

export const STREAMING_WS_URL = (
  process.env.EXPO_PUBLIC_STREAMING_WS_URL || defaultStreamingUrl
).replace(/\/$/, '');
