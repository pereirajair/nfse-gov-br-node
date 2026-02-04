const fs = require('fs');
const path = require('path');
// In a real project, use: require('@pereirajair/nfse-gov-br-node')
const { loadA1Certificate, NfseClient, enviaDps, generateDpsId } = require('../dist/index');

// --- Configuration ---
// IMPORTANT: Update these values before running
const certPassword = 'YOUR_CERTIFICATE_PASSWORD';
const prestadorCnpj = 'YOUR_CNPJ'; // Should match the CNPJ in the certificate

// The certificate file should be placed in the same folder as this script
const pfxPath = path.resolve(__dirname, 'CERTIFICATE.pfx');

async function main() {
    console.log('--- NFSe Nacional: Send DPS Sample ---');

    if (certPassword === 'YOUR_CERTIFICATE_PASSWORD') {
        console.error('ERROR: Please update "certPassword" in index.js before running.');
        return;
    }

    if (!fs.existsSync(pfxPath)) {
        console.error(`ERROR: Certificate file not found at: ${pfxPath}`);
        console.error('Please place your CERTIFICATE.pfx file in the root folder of this example.');
        return;
    }

    try {
        // 1. Load the Certificate
        console.log('Loading A1 certificate...');
        const pfxBuffer = fs.readFileSync(pfxPath);
        const certificateData = loadA1Certificate(pfxBuffer, certPassword);
        console.log('Certificate loaded successfully.');

        // 2. Create the mTLS HTTP Client for Homologation environment
        console.log('Initializing HTTP client for homologation...');
        const client = new NfseClient({
            environment: 'homologacao',
            certificate: certificateData,
        });
        console.log('Client initialized.');

        // 3. Generate ID and Data
        // "DPS" + Cód.Mun (7) + Tipo de Inscrição Federal (1) + Inscrição Federal (14) + Série DPS (5) + Núm. DPS (15)
        const dpsDataForId = {
            municipioEmissao: '4125506',
            prestador: { cnpj: prestadorCnpj },
            serie: '1',
            numero: '10' // Incremented number
        };
        const idDps = generateDpsId(dpsDataForId);
        console.log('Generated DPS ID:', idDps);

        const dataEmissao = new Date();
        const competencia = dataEmissao.toISOString().split('T')[0];

        // 4. Create the DPS object
        const dps = {
            id: idDps,
            ambiente: 2, // 2-Homologação
            versaoAplicacao: '1.0.0',
            dataEmissao: dataEmissao,
            competencia: competencia,
            serie: dpsDataForId.serie,
            numero: dpsDataForId.numero,
            tipoEmitente: 1, // 1-Prestador
            municipioEmissao: '4125506',
            prestador: {
                cnpj: prestadorCnpj.replace(/\D/g, ''),
                optanteSimplesNacional: 3, // 3-ME/EPP
                regimeEspecialTributacao: 0,
                regimeApuracaoTributacaoSN: 3
            },
            tomador: {
                cpf: '00000000000', // Update with valid CPF
                nome: 'Nome do Tomador',
                endereco: {
                    logradouro: 'Rua Exemplo',
                    numero: '100',
                    bairro: 'Centro',
                    codigoMunicipio: '4125506',
                    uf: 'PR',
                    cep: '80000000',
                },
            },
            servico: {
                municipioPrestacao: '4125506',
                codigoTributacaoNacional: '171901',
                descricao: 'Honorários Contabeis',
                codigoNbs: '113022100',
            },
            valores: {
                valorServicos: '100.00',
                tributacaoIssqn: 1, // 1-Operação Tributável
                tipoRetencaoIssqn: 2, // 2-Não Retido
                percentualTotalTributosSN: 2.0,
            }
        };
        console.log('DPS object created.');

        // 5. Send the DPS
        console.log('Sending DPS to the API...');
        const response = await enviaDps(dps, client, certificateData);

        // 6. Log the response
        console.log('--- DPS Sent Successfully! ---');
        console.log('API Response:', JSON.stringify(response, null, 2));
        if (response.chaveAcesso) {
            console.log('Access Key:', response.chaveAcesso);
        }

    } catch (error) {
        console.error('--- An Error Occurred ---');
        console.error(error.message || error);
        if (error.response && error.response.data) {
            console.error('API Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

main();
