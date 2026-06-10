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
  acceptTerms: boolean;
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

export type RequestPasswordResetResponse = {
  message: string;
  resetToken?: string;
  expiresInMinutes: number;
};

export type ResetPasswordResponse = {
  message: string;
};

export type ProfileFunnel = {
  preparing: number;
  submitted: number;
  won: number;
  lost: number;
};

export type ProfileHistoryEntry = {
  month: string;
  preparing: number;
  submitted: number;
  won: number;
  lost: number;
  total: number;
};

export type ProfileDashboard = {
  contratacoesCount: number;
  documentHealthPercent: number;
  expiredDocumentsCount: number;
  openAlertsCount: number;
  pendingDocumentsCount: number;
  funnel?: ProfileFunnel;
  history?: ProfileHistoryEntry[];
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

export function requestPasswordReset(identifier: string): Promise<RequestPasswordResetResponse> {
  return apiRequest<RequestPasswordResetResponse>('/auth/forgot-password', {
    body: { identifier },
    method: 'POST',
  });
}

export function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
  return apiRequest<ResetPasswordResponse>('/auth/reset-password', {
    body: { newPassword, token },
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
