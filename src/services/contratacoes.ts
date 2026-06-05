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

export type Elegibilidade = {
  exclusivaMeEpp: boolean;
  dentroLimiteMei: boolean;
  mensagem: string;
};

export type ContratacaoDetail = Contratacao & {
  dadosOrgao?: DadosOrgao;
  datasImportantes?: DatasImportantes;
  documentosExigidos?: string[];
  elegibilidade?: Elegibilidade;
  requisitos?: string[];
  resumoSimplificado?: string[];
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
  modalidadeNome?: string;
  municipio?: string;
  q?: string;
  skip?: number;
  status?: string;
  uf?: string;
  valorMax?: number;
  valorMin?: number;
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

export type ParticipationStatus = 'preparing' | 'submitted' | 'won' | 'lost';

export type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
};

export type Checklist = {
  contratacaoId: string;
  participationStatus: ParticipationStatus;
  items: ChecklistItem[];
  updatedAt: string;
};

export type UpdateChecklistPayload = {
  participationStatus?: ParticipationStatus;
  items?: { id: string; checked: boolean }[];
};

export function getContratacaoChecklist(token: string, id: string): Promise<Checklist> {
  return apiRequest<Checklist>(`/contratacoes/${id}/checklist`, { token });
}

export function updateContratacaoChecklist(
  token: string,
  id: string,
  payload: UpdateChecklistPayload,
): Promise<Checklist> {
  return apiRequest<Checklist>(`/contratacoes/${id}/checklist`, {
    body: payload,
    method: 'PUT',
    token,
  });
}
