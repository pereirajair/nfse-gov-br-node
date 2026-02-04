const fs = require('fs');
const path = require('path');
// In a real project, use: require('@pereirajair/nfse-gov-br-node')
const { loadA1Certificate, NfseClient, consultarNfseChave } = require('../dist/index');

// --- Configuration ---
const certPassword = 'YOUR_CERTIFICATE_PASSWORD';
const chaveAcesso = '00000...'; // Replace with the Access Key

// The certificate file should be placed in the same folder as this script
const pfxPath = path.resolve(__dirname, 'CERTIFICATE.pfx');

async function main() {
    console.log('--- NFSe Nacional: Consult NFSe by Access Key Sample ---');

    if (!fs.existsSync(pfxPath)) {
        console.error(`ERROR: Certificate file not found at: ${pfxPath}`);
        return;
    }

    try {
        // 1. Load the Certificate
        console.log('Loading A1 certificate...');
        const pfxBuffer = fs.readFileSync(pfxPath);
        const certificateData = loadA1Certificate(pfxBuffer, certPassword);

        // 2. Create the Client
        const client = new NfseClient({
            environment: 'homologacao',
            certificate: certificateData,
        });

        // 3. Consult the NFSe
        console.log(`Consulting NFSe with key: ${chaveAcesso}...`);
        const response = await consultarNfseChave(chaveAcesso, client);

        console.log('--- NFSe Consultation Response ---');
        console.log(JSON.stringify(response, null, 2));

    } catch (error) {
        console.error('--- An Error Occurred ---');
        console.error(error.message || error);
    }
}

main();
