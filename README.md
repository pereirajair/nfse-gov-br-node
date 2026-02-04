# @pereirajair/nfse-gov-br-node

Unofficial Node.js library for interacting with the Brazilian **NFS-e Nacional** (Nota Fiscal de Serviço Eletrônica) API.

This library simplifies the process of generating, signing, and transmitting the DPS (Declaração Prévia de Serviço) using an A1 digital certificate.

## Features

- **Full XML Generation**: Automatically builds the compliant XML structure for DPS.
- **XML Signing**: Handles XML Digital Signature (X509) using `xml-crypto` (RSA-SHA1 + Enveloped Signature), fully compatible with the national standard.
- **mTLS Authentication**: Easy configuration for A1 (PFX) certificates for mutual TLS authentication.
- **Homologation & Production**: toggle between environments easily.
- **Typed Interfaces**: TypeScript definitions for all major data structures (DPS, Prestador, Tomador, etc.).

## Installation

```bash
npm install @pereirajair/nfse-gov-br-node
```

## Prerequisites

- **Node.js** >= 18
- **A1 Digital Certificate** (.pfx or .p12)
- **OpenSSL** (usually required by `node-forge` or `xml-crypto` under the hood for some operations, though mostly pure JS).

## Usage

### 1. Basic Setup

First, load your certificate and initialize the client:

```javascript
const fs = require('fs');
const { loadA1Certificate, NfseClient } = require('@pereirajair/nfse-gov-br-node');

// Load Certificate
const pfxBuffer = fs.readFileSync('path/to/certificate.pfx');
const certificateData = loadA1Certificate(pfxBuffer, 'YOUR_PASSWORD');

// Initialize Client (homologacao or producao)
const client = new NfseClient({
  environment: 'homologacao', // or 'producao'
  certificate: certificateData,
});
```

### 2. Sending a DPS (Issue NFS-e)

```javascript
const { enviaDps, generateDpsId } = require('@pereirajair/nfse-gov-br-node');

const dpsDataForId = {
  municipioEmissao: '4125506',
  prestador: { cnpj: '00000000000000' },
  serie: '1',
  numero: '10'
};
const idDps = generateDpsId(dpsDataForId);

const dps = {
  id: idDps,
  ambiente: 2, // 2-Homologação
  dataEmissao: new Date(),
  serie: '1',
  numero: '10',
  prestador: { ... },
  tomador: { ... },
  servico: { ... },
  valores: { ... }
  // See examples/enviar-dps.js for full object structure
};

enviaDps(dps, client, certificateData)
  .then(response => {
     console.log('NFS-e Issued!', response.chaveAcesso);
  })
  .catch(err => console.error(err));
```

## Examples

Check the `examples/` directory for complete working scripts:
- `enviar-dps.js`: Full example of issuing an NFS-e.
- `consultar-nfse.js`: Query an NFS-e by Access Key.
- `consultar-dps.js`: Query a DPS by ID.

## License

MIT
