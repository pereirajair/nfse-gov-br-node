import { DPS, NFSeResponse } from '../models/dps';
import { NfseClient } from '../core/client';
import { CertificateData } from '../core/certificate';
import { buildDpsXml } from '../utils/xml';
import { signXml } from '../core/signer';
import { compressAndEncodeXml } from '../utils/compression';

/**
 * Orchestrates the process of sending a DPS to the NFSe Nacional API.
 *
 * @param dps The DPS object to be sent.
 * @param client An instance of the configured NfseClient.
 * @param certificate The certificate data for signing.
 * @returns A promise that resolves with the response from the API.
 * @throws Will throw an error if any step of the process fails.
 */
export async function enviaDps(
  dps: DPS,
  client: NfseClient,
  certificate: CertificateData
): Promise<NFSeResponse> {
  try {
    // 1. Build the DPS XML from the object
    const dpsXml = buildDpsXml(dps);

    // 2. Sign the DPS XML document
    // The signature must be applied to the <infDPS> tag
    const signedDpsXml = signXml(dpsXml, certificate, 'infDPS');

    // 3. Compress and Base64 encode the signed XML
    const dpsXmlGZipB64 = await compressAndEncodeXml(signedDpsXml);

    // 4. Send the request using the mTLS client
    // Updated to use the synchronous JSON API endpoint
    const response = await client.post('/nfse', { dpsXmlGZipB64 });

    return response as NFSeResponse;

  } catch (error) {
    console.error('Failed to send DPS:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}
