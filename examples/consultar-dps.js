const fs = require('fs');
const path = require('path');
// In a real project, use: require('@pereirajair/nfse-gov-br-node')
const { loadA1Certificate, NfseClient, consultarDpsId } = require('../dist/index');

// --- Configuration ---
const certPassword = 'YOUR_CERTIFICATE_PASSWORD';
const dpsId = 'DPS...'; // Replace with the Id of the DPS you want to consult

// The certificate file should be placed in the same folder as this script
const pfxPath = path.resolve(__dirname, 'CERTIFICATE.pfx');

async function main() {
    console.log('--- NFSe Nacional: Consult DPS Sample ---');

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

        // 3. Consult the DPS
        console.log(`Consulting DPS with Id: ${dpsId}...`);
        const response = await consultarDpsId(dpsId, client);

        console.log('--- DPS Consultation Response ---');
        console.log(JSON.stringify(response, null, 2));

    } catch (error) {
        console.error('--- An Error Occurred ---');
        console.error(error.message || error);
    }
}

main();
