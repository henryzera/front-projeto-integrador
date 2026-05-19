import { apiRequest } from './api';

export type AlertKind =
  | 'documentExpired'
  | 'info'
  | 'proposalCritical'
  | 'proposalSafe'
  | 'proposalSoon';

export type AlertStatus = 'open' | 'read' | 'resolved';
export type AlertView = 'calendar' | 'list';

export type DeadlineAlert = {
  date: string;
  description: string;
  id: string;
  kind: AlertKind;
  priority: number;
  relatedId?: string;
  relatedType?: 'contratacao' | 'document' | string;
  status: AlertStatus;
  title: string;
};

export type ListAlertsParams = {
  from?: string;
  priority?: number;
  status?: AlertStatus;
  to?: string;
  view?: AlertView;
};

export type ListAlertsResponse = {
  data: DeadlineAlert[];
};

export function listAlerts(
  token: string,
  params: ListAlertsParams = {},
): Promise<ListAlertsResponse> {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';

  return apiRequest<ListAlertsResponse>(`/alerts${suffix}`, { token });
}

export function markAlertAsRead(token: string, id: string): Promise<{ alert: DeadlineAlert }> {
  return apiRequest<{ alert: DeadlineAlert }>(`/alerts/${id}/read`, {
    method: 'PATCH',
    token,
  });
}

export function resolveAlert(token: string, id: string): Promise<{ alert: DeadlineAlert }> {
  return apiRequest<{ alert: DeadlineAlert }>(`/alerts/${id}/resolve`, {
    method: 'PATCH',
    token,
  });
}
