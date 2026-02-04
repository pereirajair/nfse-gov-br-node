export { NfseClient } from './core/client';
export type { NfseClientConfig } from './core/client';

export { loadA1Certificate } from './core/certificate';
export { buildDpsXml, generateDpsId } from './utils/xml';
export { signXml } from './core/signer';
export type { CertificateData } from './core/certificate';

export { enviaDps } from './services/dps';
export {
    consultarNfseChave,
    consultarDpsId,
    verificarNfsePorDpsId
} from './services/consultas';

export { environmentUrls } from './config/environments';
export type { NfseEnvironment } from './config/environments';

export type { DPS, Endereco, Contato, NFSeResponse, DPSResponse } from './models/dps';
export type { NFSe, DPSConsultaResponse } from './models/responses';
