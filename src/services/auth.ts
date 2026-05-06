import { apiRequest } from './api';

export type AuthUser = {
  id: string;
  cnae: string;
  cnpj: string;
  createdAt: string;
  email: string;
  firstName: string;
  lastName: string;
  updatedAt: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type RegisterPayload = {
  cnae: string;
  cnpj: string;
  confirmPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    body: payload,
    method: 'POST',
  });
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    body: payload,
    method: 'POST',
  });
}

export function getMe(token: string): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>('/me', { token });
}
