import { DPS } from '../models/dps';
import { format } from 'date-fns';

/**
 * Generates the DPS ID according to the pattern:
 * "DPS" + Cód.Mun (7) + Tipo de Inscrição Federal (1) + Inscrição Federal (14) + Série DPS (5) + Núm. DPS (15)
 */
export function generateDpsId(dps: DPS): string {
  const codMun = dps.municipioEmissao.padStart(7, '0');
  const tpInsc = '2'; // 2=CNPJ (Fixed for now as we only support CNPJ prestador)
  const cnpj = dps.prestador.cnpj.replace(/\D/g, '').padStart(14, '0');
  const serie = dps.serie.padStart(5, '0');
  const numero = dps.numero.padStart(15, '0');

  return `DPS${codMun}${tpInsc}${cnpj}${serie}${numero}`;
}

/**
 * Converts a DPS object to its XML string representation.
 * Matches the structure of the nfse-brazil-national template.
 */
export function buildDpsXml(dps: DPS): string {
  // Helper to format dates to 'yyyy-MM-dd' or ISO date-time
  const formatDate = (date: Date | string) => {
    if (date instanceof Date) return format(date, 'yyyy-MM-dd');
    return date.split('T')[0]; // simple handling for ISO string
  };

  const formatDateTime = (date: Date | string) => {
    if (typeof date === 'string') return date;
    // Format: YYYY-MM-DDThh:mm:ss-03:00
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());

    // Offset handling could be improved, but for "homologacao" usually -03:00 is expected/safe
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}-03:00`;
  };

  // Helper to safely add optional elements
  const addOptional = (tag: string, value: any) => (value ? `<${tag}>${value}</${tag}>` : '');
  const addOptionalFloat = (tag: string, value: any) => (value !== undefined && value !== null ? `<${tag}>${value}</${tag}>` : '');

  const dpsId = dps.id || generateDpsId(dps);

  // Determine tomador identification tag (CNPJ or CPF)
  const tomadorIdTag = dps.tomador.cnpj ?
    `<CNPJ>${dps.tomador.cnpj.replace(/\D/g, '')}</CNPJ>` :
    (dps.tomador.cpf ? `<CPF>${dps.tomador.cpf.replace(/\D/g, '')}</CPF>` : '');

  // Determine discounts/deductions blocks
  let valoresHtml = `<vServPrest><vServ>${dps.valores.valorServicos}</vServ></vServPrest>`;

  if (dps.valores.descontos) {
    valoresHtml += `<vDescCondIncond>`;
    if (dps.valores.descontos.incondicionado) valoresHtml += `<vDescIncond>${dps.valores.descontos.incondicionado}</vDescIncond>`;
    if (dps.valores.descontos.condicionado) valoresHtml += `<vDescCond>${dps.valores.descontos.condicionado}</vDescCond>`;
    valoresHtml += `</vDescCondIncond>`;
  }

  if (dps.valores.deducaoReducao) {
    valoresHtml += `<vDedRed>`;
    if (dps.valores.deducaoReducao.percentual) valoresHtml += `<pDR>${dps.valores.deducaoReducao.percentual}</pDR>`;
    if (dps.valores.deducaoReducao.valor) valoresHtml += `<vDR>${dps.valores.deducaoReducao.valor}</vDR>`;
    valoresHtml += `</vDedRed>`;
  }

  let tribMunHtml = `
          <tribISSQN>${dps.valores.tributacaoIssqn}</tribISSQN>
          <tpRetISSQN>${dps.valores.tipoRetencaoIssqn}</tpRetISSQN>`;

  if (dps.valores.aliquotaIssqn) tribMunHtml += `<pAliq>${dps.valores.aliquotaIssqn}</pAliq>`;
  if (dps.valores.valorIss) tribMunHtml += `<vISSQN>${dps.valores.valorIss}</vISSQN>`;

  let totTribHtml = '';
  if (dps.valores.tributosDetalhado) {
    totTribHtml = `<pTotTrib>
            <pTotTribFed>${dps.valores.tributosDetalhado.federal}</pTotTribFed>
            <pTotTribEst>${dps.valores.tributosDetalhado.estadual}</pTotTribEst>
            <pTotTribMun>${dps.valores.tributosDetalhado.municipal}</pTotTribMun>
          </pTotTrib>`;
  } else if (dps.valores.percentualTotalTributosSN !== undefined) {
    totTribHtml = `<pTotTribSN>${dps.valores.percentualTotalTributosSN}</pTotTribSN>`;
  } else {
    totTribHtml = `<indTotTrib>0</indTotTrib>`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
  <infDPS Id="${dpsId}">
    <tpAmb>${dps.ambiente}</tpAmb>
    <dhEmi>${formatDateTime(dps.dataEmissao)}</dhEmi>
    <verAplic>${dps.versaoAplicacao}</verAplic>
    <serie>${dps.serie}</serie>
    <nDPS>${dps.numero}</nDPS>
    <dCompet>${formatDate(dps.competencia)}</dCompet>
    <tpEmit>${dps.tipoEmitente}</tpEmit>
    <cLocEmi>${dps.municipioEmissao}</cLocEmi>
    <prest>
      <CNPJ>${dps.prestador.cnpj.replace(/\D/g, '')}</CNPJ>
      ${addOptional('fone', dps.prestador.telefone)}
      <regTrib>
        <opSimpNac>${dps.prestador.optanteSimplesNacional}</opSimpNac>
        ${addOptional('regApTribSN', dps.prestador.regimeApuracaoTributacaoSN)}
        <regEspTrib>${dps.prestador.regimeEspecialTributacao ?? 0}</regEspTrib>
      </regTrib>
    </prest>
    <toma>
      ${tomadorIdTag}
      ${addOptional('IM', dps.tomador.inscricaoMunicipal)}
      <xNome>${dps.tomador.nome}</xNome>
      ${dps.tomador.endereco ? `<end>
        ${dps.tomador.endereco.cep ? `<endNac>
          <cMun>${dps.tomador.endereco.codigoMunicipio}</cMun>
          <CEP>${dps.tomador.endereco.cep.replace(/\D/g, '')}</CEP>
        </endNac>` : ''}
        <xLgr>${dps.tomador.endereco.logradouro}</xLgr>
        <nro>${dps.tomador.endereco.numero}</nro>
        ${addOptional('xCpl', dps.tomador.endereco.complemento)}
        <xBairro>${dps.tomador.endereco.bairro}</xBairro>
      </end>` : ''}
      ${addOptional('fone', dps.tomador.telefone)}
      ${addOptional('email', dps.tomador.email)}
    </toma>
    <serv>
      <locPrest>
        <cLocPrestacao>${dps.servico.municipioPrestacao}</cLocPrestacao>
        ${addOptional('cPaisPrestacao', dps.servico.paisPrestacao)}
      </locPrest>
      <cServ>
        <cTribNac>${dps.servico.codigoTributacaoNacional}</cTribNac>
        ${addOptional('cTribMun', dps.servico.codigoTributacaoMunicipal)}
        <xDescServ>${dps.servico.descricao}</xDescServ>
        ${addOptional('cNBS', dps.servico.codigoNbs ? dps.servico.codigoNbs.replace(/\D/g, '') : undefined)}
        ${addOptional('cIntContrib', dps.servico.codigoInterno)}
      </cServ>
    </serv>
    <valores>
      ${valoresHtml}
      <trib>
        <tribMun>
          ${tribMunHtml}
        </tribMun>
        <totTrib>
          ${totTribHtml}
        </totTrib>
      </trib>
    </valores>
  </infDPS>
</DPS>`;

  // Minify XML to remove spaces between tags
  return xml.replace(/>\s+</g, '><').trim();
}
