import { buildDpsXml, generateDpsId } from '../../src/utils/xml';
import { consultarDpsId, consultarNfseChave, verificarNfsePorDpsId } from '../../src/services/consultas';
import { NfseClient } from '../../src/core/client';
import { DPS } from '../../src/models/dps';

// Mock Client
jest.mock('../../src/core/client');

describe('XML Generation & Service Logic', () => {

    const mockDps: DPS = {
        ambiente: 2,
        versaoAplicacao: '1.0.0',
        dataEmissao: '2026-02-04T10:00:00-03:00',
        serie: '1',
        numero: '100',
        competencia: '2026-02-01',
        tipoEmitente: 1,
        municipioEmissao: '4125506',
        prestador: {
            cnpj: '00.000.000/0000-00',
            optanteSimplesNacional: 3,
            regimeEspecialTributacao: 0,
            regimeApuracaoTributacaoSN: 3
        },
        tomador: {
            cpf: '000.000.000-00',
            nome: 'Tomador Teste',
            endereco: {
                logradouro: 'Rua Teste',
                numero: '123',
                bairro: 'Centro',
                codigoMunicipio: '4125506',
                uf: 'PR',
                cep: '80000-000'
            }
        },
        servico: {
            municipioPrestacao: '4125506',
            codigoTributacaoNacional: '171901',
            descricao: 'Serviço de Teste',
            codigoNbs: '11.30.22.100'
        },
        valores: {
            valorServicos: '150.00',
            tributacaoIssqn: 1,
            tipoRetencaoIssqn: 2,
            percentualTotalTributosSN: 2.0
        }
    };

    describe('buildDpsXml (Enviar DPS)', () => {
        it('should generate valid XML structure matching the snapshot/expected string', () => {
            // We overwrite generateDpsId or pass a fixed ID to ensure deterministic output
            // ID reflects new CNPJ 00000000000000
            const dpsWithId = { ...mockDps, id: 'DPS412550620000000000000000010000000000000100' };
            const xml = buildDpsXml(dpsWithId);

            // Expected XML (minified)
            // Updated with CNPJ 00000000000000 and CPF 00000000000
            const expectedXml = `<?xml version="1.0" encoding="UTF-8"?><DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00"><infDPS Id="DPS412550620000000000000000010000000000000100"><tpAmb>2</tpAmb><dhEmi>2026-02-04T10:00:00-03:00</dhEmi><verAplic>1.0.0</verAplic><serie>1</serie><nDPS>100</nDPS><dCompet>2026-02-01</dCompet><tpEmit>1</tpEmit><cLocEmi>4125506</cLocEmi><prest><CNPJ>00000000000000</CNPJ><regTrib><opSimpNac>3</opSimpNac><regApTribSN>3</regApTribSN><regEspTrib>0</regEspTrib></regTrib></prest><toma><CPF>00000000000</CPF><xNome>Tomador Teste</xNome><end><endNac><cMun>4125506</cMun><CEP>80000000</CEP></endNac><xLgr>Rua Teste</xLgr><nro>123</nro><xBairro>Centro</xBairro></end></toma><serv><locPrest><cLocPrestacao>4125506</cLocPrestacao></locPrest><cServ><cTribNac>171901</cTribNac><xDescServ>Serviço de Teste</xDescServ><cNBS>113022100</cNBS></cServ></serv><valores><vServPrest><vServ>150.00</vServ></vServPrest><trib><tribMun><tribISSQN>1</tribISSQN><tpRetISSQN>2</tpRetISSQN></tribMun><totTrib><pTotTribSN>2</pTotTribSN></totTrib></trib></valores></infDPS></DPS>`;

            expect(xml).toBe(expectedXml);
        });
    });

    describe('generateDpsId', () => {
        it('should generate correct ID format', () => {
            const id = generateDpsId(mockDps);
            // DPS + 4125506 (7) + 2 (1) + 00000000000000 (14) + 00001 (5) + 000000000000100 (15)
            // Total 42 chars
            expect(id).toBe('DPS412550620000000000000000001000000000000100');
        });
    });

    describe('Consultar DPS', () => {
        it('should call client.get with correct URL', async () => {
            const client = new NfseClient({ environment: 'homologacao', certificate: {} as any });
            (client.get as jest.Mock).mockResolvedValue({ some: 'data' });

            const dpsId = 'DPS123456';
            await consultarDpsId(dpsId, client);

            expect(client.get).toHaveBeenCalledWith('/dps/DPS123456');
        });
    });

    describe('Consultar NFSe', () => {
        it('should call client.get with correct URL', async () => {
            const client = new NfseClient({ environment: 'homologacao', certificate: {} as any });
            (client.get as jest.Mock).mockResolvedValue({ some: 'data' });

            const chave = '12345678901234567890123456789012345678901234567890';
            await consultarNfseChave(chave, client);

            expect(client.get).toHaveBeenCalledWith(`/nfse/${chave}`);
        });
    });

});
