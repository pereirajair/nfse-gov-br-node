import { NfseClient } from '../core/client';
import { NFSeResponse, DPS, DPSResponse } from '../models/dps';

/**
 * Consults an NFSe by its access key.
 *
 * @param chaveAcesso The 50-character access key of the NFSe.
 * @param client An instance of the configured NfseClient.
 * @returns A promise that resolves with the NFSe data.
 */
export async function consultarNfseChave(chaveAcesso: string, client: NfseClient): Promise<NFSeResponse> {
  // Use GET /nfse/{chaveAcesso} as per the documentation
  const response = await client.get(`/nfse/${chaveAcesso}`);
  return response as NFSeResponse;
}

/**
 * Consults a DPS by its Id.
 *
 * @param id The identifier of the DPS.
 * @param client An instance of the configured NfseClient.
 * @returns A promise that resolves with the DPS response data.
 */
export async function consultarDpsId(id: string, client: NfseClient): Promise<DPSResponse> {
  const response = await client.get(`/dps/${id}`);
  return response as DPSResponse;
}

/**
 * Verifies if an NFSe was emitted from a DPS Id.
 *
 * @param id The identifier of the DPS.
 * @param client An instance of the configured NfseClient.
 * @returns A promise that resolves to true if the NFSe exists, false otherwise.
 */
export async function verificarNfsePorDpsId(id: string, client: NfseClient): Promise<boolean> {
  try {
    // Verified by HEAD /nfse?id={id} according to some interpretations, 
    // but the doc says "HEAD /nfse" path parameters or query? 
    // doc: head /nfse, path parameters id required string
    await client.head(`/nfse/${id}`);
    return true;
  } catch (error: any) {
    if (error.message.includes('status 404')) {
      return false;
    }
    throw error;
  }
}
