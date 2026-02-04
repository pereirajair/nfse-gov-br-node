/**
 * Based on ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe
 */

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
}

export interface Contato {
  telefone?: string;
  email?: string;
}

export interface DPS {
  id?: string;
  ambiente: 1 | 2; // 1-Produção, 2-Homologação
  versaoAplicacao: string;
  dataEmissao: string | Date; // ISO string or Date
  competencia: string | Date; // YYYY-MM-DD or Date
  serie: string;
  numero: string;
  tipoEmitente: number; // 1-Prestador, 2-Tomador, 3-Intermediário
  municipioEmissao: string;
  prestador: {
    cnpj: string;
    optanteSimplesNacional: 1 | 2 | 3; // 1-Não, 2-MEI, 3-ME/EPP
    regimeEspecialTributacao?: number;
    regimeApuracaoTributacaoSN?: number;
    inscricaoMunicipal?: string;
    telefone?: string;
    email?: string;
  };
  tomador: {
    cpf?: string;
    cnpj?: string;
    inscricaoMunicipal?: string;
    nome: string; // Was razaoSocial
    endereco?: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: string;
      uf: string;
      cep: string;
    };
    telefone?: string;
    email?: string;
  };
  servico: {
    municipioPrestacao: string;
    codigoTributacaoNacional: string;
    codigoTributacaoMunicipal?: string; // Optional/Empty in test.js
    descricao: string;
    codigoNbs?: string; // Optional but recommended
    codigoInterno?: string;
    paisPrestacao?: string;
  };
  valores: {
    valorServicos: number | string;
    tributacaoIssqn: 1 | 2 | 3;
    tipoRetencaoIssqn: 1 | 2 | 3;
    percentualTotalTributosSN?: number;
    valorIss?: number;
    aliquotaIssqn?: number;
    valorDeducoes?: number;
    valorPis?: number;
    valorCofins?: number;
    valorInss?: number;
    valorIr?: number;
    valorCsll?: number;
    issRetido?: boolean; // Keep for backward compat or logic checks
    descontos?: {
      incondicionado?: number;
      condicionado?: number;
    };
    deducaoReducao?: {
      percentual?: number;
      valor?: number;
    };
    tributosDetalhado?: {
      federal: number;
      estadual: number;
      municipal: number;
    };
  };
  infosComp?: string;
  construcaoCivil?: {
    codigoObra?: string;
    art?: string;
  };
}

export interface MensagemProcessamento {
  codigo?: string;
  descricao?: string;
  correcao?: string;
}

export interface NFSeResponse {
  tipoAmbiente: number;
  versaoAplicativo: string;
  dataHoraProcessamento: string;
  idDps: string;
  chaveAcesso: string;
  nfseXmlGZipB64: string;
  alertas?: MensagemProcessamento[];
}

export interface DPSResponse {
  tipoAmbiente: number;
  versaoAplicativo: string;
  dataHoraProcessamento: string;
  idDps: string;
  chaveAcesso: string;
}
