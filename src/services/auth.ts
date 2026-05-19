import { apiRequest } from './api';

export type AuthUser = {
  id: string;
  cnae: string;
  cnpj: string;
  createdAt: string;
  email: string;
  firstName: string;
  lastName: string;
  notificationPreferences?: NotificationPreferences;
  updatedAt: string;
};

export type NotificationPreferences = {
  daysBeforeDeadline: number;
  documentAlerts: boolean;
  email: boolean;
  proposalAlerts: boolean;
  push: boolean;
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

export type UpdateMePayload = Partial<
  Pick<AuthUser, 'cnae' | 'cnpj' | 'email' | 'firstName' | 'lastName'>
> & {
  notificationPreferences?: Partial<NotificationPreferences>;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type ProfileDashboard = {
  contratacoesCount: number;
  documentHealthPercent: number;
  expiredDocumentsCount: number;
  openAlertsCount: number;
  pendingDocumentsCount: number;
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

export function logout(token: string): Promise<void> {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    token,
  });
}

export function getMe(token: string): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>('/me', { token });
}

export function getMeDashboard(token: string): Promise<ProfileDashboard> {
  return apiRequest<ProfileDashboard>('/me/dashboard', { token });
}

export function updateMe(token: string, payload: UpdateMePayload): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>('/me', {
    body: payload,
    method: 'PATCH',
    token,
  });
}
