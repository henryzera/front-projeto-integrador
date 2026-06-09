import { apiRequest } from './api';

export type DocumentStatus = 'attention' | 'expired' | 'ok' | 'pending';

export type UserDocument = {
  expiresAt?: string | null;
  fileUrl?: string | null;
  id: string;
  name: string;
  status: DocumentStatus;
  updatedAt?: string | null;
};

export type DocumentGroup = {
  documents: UserDocument[];
  id: string;
  summary: string;
  title: string;
};

export type DocumentsSummary = {
  categoriesCount: number;
  expiredCount: number;
  healthPercent: number;
  pendingCount: number;
};

export type ListDocumentsResponse = {
  groups: DocumentGroup[];
};

export type CreateDocumentPayload = {
  categoryId: string;
  categoryTitle?: string;
  expiresAt?: string;
  name: string;
  status?: DocumentStatus;
};

export type UpdateDocumentPayload = Partial<CreateDocumentPayload>;

export function getDocumentsSummary(token: string): Promise<DocumentsSummary> {
  return apiRequest<DocumentsSummary>('/documents/summary', { token });
}

export function listDocuments(token: string): Promise<ListDocumentsResponse> {
  return apiRequest<ListDocumentsResponse>('/documents', { token });
}

// SUBMISSION FEATURE DISABLED — document creation through the app is not supported.
// export function createDocument(
//   token: string,
//   payload: CreateDocumentPayload,
// ): Promise<{ document: UserDocument }> {
//   return apiRequest<{ document: UserDocument }>('/documents', {
//     body: payload,
//     method: 'POST',
//     token,
//   });
// }

export function updateDocument(
  token: string,
  id: string,
  payload: UpdateDocumentPayload,
): Promise<{ document: UserDocument }> {
  return apiRequest<{ document: UserDocument }>(`/documents/${id}`, {
    body: payload,
    method: 'PATCH',
    token,
  });
}

export function deleteDocument(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/documents/${id}`, {
    method: 'DELETE',
    token,
  });
}
