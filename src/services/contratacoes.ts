import { apiRequest } from './api';

export type Contratacao = {
  _id: string;
  anoCompra?: number;
  codigoIbge?: string;
  compatibilityScore?: number;
  dataAberturaProposta?: string;
  dataAtualizacao?: string;
  dataEncerramentoProposta?: string;
  linkOficial?: string;
  linkProcessoEletronico?: string;
  linkSistemaOrigem?: string;
  linksOficiais?: OfficialLink[];
  modalidadeNome?: string;
  municipioNome?: string;
  numeroCompra?: string;
  orgaoEntidade?: {
    razaoSocial?: string;
  };
  objetoCompra?: string;
  situacaoCompraNome?: string;
  uf?: string;
  unidadeOrgao?: {
    codigoIbge?: string;
    nomeUnidade?: string;
    municipioNome?: string;
    ufSigla?: string;
  };
  valorTotalEstimado?: number;
};

export type OfficialLink = {
  label?: string;
  type?: string;
  url: string;
};

export type DadosOrgao = {
  cnpj?: string;
  codigoIbge?: string;
  municipio?: string;
  razaoSocial?: string;
  uf?: string;
  unidade?: string;
};

export type DatasImportantes = {
  aberturaProposta?: string;
  encerramentoProposta?: string;
  publicacaoPncp?: string;
  ultimaAtualizacao?: string;
};

export type ContratacaoDetail = Contratacao & {
  dadosOrgao?: DadosOrgao;
  datasImportantes?: DatasImportantes;
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
