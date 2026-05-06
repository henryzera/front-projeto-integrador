import { apiRequest } from './api';

export type Contratacao = {
  _id: string;
  anoCompra?: number;
  dataEncerramentoProposta?: string;
  modalidadeNome?: string;
  numeroCompra?: string;
  objetoCompra?: string;
  situacaoCompraNome?: string;
  unidadeOrgao?: {
    municipioNome?: string;
    ufSigla?: string;
  };
  valorTotalEstimado?: number;
};

export type ListContratacoesResponse = {
  data: Contratacao[];
  limit: number;
  skip: number;
  total: number;
};

export function listContratacoes(token: string, limit = 5): Promise<ListContratacoesResponse> {
  return apiRequest<ListContratacoesResponse>(`/contratacoes?limit=${limit}`, { token });
}
