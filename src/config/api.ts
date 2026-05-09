const defaultApiUrl = 'https://api-projeto-integrador-hcu8.onrender.com';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || defaultApiUrl
).replace(/\/$/, '');
