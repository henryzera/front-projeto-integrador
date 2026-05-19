import { apiRequest } from './api';

export type Contratacao = {
  _id: string;
  anoCompra?: number;
  compatibilityScore?: number;
  dataEncerramentoProposta?: string;
  modalidadeNome?: string;
  numeroCompra?: string;
  orgaoEntidade?: {
    razaoSocial?: string;
  };
  objetoCompra?: string;
  situacaoCompraNome?: string;
  unidadeOrgao?: {
    nomeUnidade?: string;
    municipioNome?: string;
    ufSigla?: string;
  };
  valorTotalEstimado?: number;
};

export type ContratacaoDetail = Contratacao & {
  dadosOrgao?: unknown;
  datasImportantes?: unknown[];
  documentosExigidos?: string[];
  requisitos?: string[];
  statusOportunidade?: string;
  valorEstimado?: number;
};

export type ListContratacoesResponse = {
  data: Contratacao[];
  limit: number;
  skip: number;
  total: number;
};

export type ListContratacoesParams = {
  cnae?: string;
  limit?: number;
  meOnly?: boolean;
  municipio?: string;
  q?: string;
  skip?: number;
  status?: string;
  uf?: string;
};

export function listContratacoes(
  token: string,
  paramsOrLimit: ListContratacoesParams | number = {},
): Promise<ListContratacoesResponse> {
  const params =
    typeof paramsOrLimit === 'number'
      ? {
          limit: paramsOrLimit,
        }
      : paramsOrLimit;
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';

  return apiRequest<ListContratacoesResponse>(`/contratacoes${suffix}`, { token });
}

export function getContratacao(token: string, id: string): Promise<ContratacaoDetail> {
  return apiRequest<ContratacaoDetail>(`/contratacoes/${id}`, { token });
}
