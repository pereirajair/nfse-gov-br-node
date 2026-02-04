import * as forge from 'node-forge';
import * as fs from 'fs';

/**
 * Interface for the extracted certificate data.
 */
export interface CertificateData {
  privateKey: forge.pki.PrivateKey;
  certificate: forge.pki.Certificate;
  caCertificates: forge.pki.Certificate[];
}

/**
 * Loads an A1 certificate from a PFX/P12 file.
 *
 * @param pfxBuffer The buffer containing the PFX/P12 file content.
 * @param password The password for the certificate.
 * @returns An object containing the private key, certificate, and CA certificates.
 * @throws Will throw an error if the certificate cannot be loaded or parsed.
 */
export function loadA1Certificate(pfxBuffer: Buffer, password: string): CertificateData {
  try {
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    let privateKey: forge.pki.PrivateKey | null = null;
    let certificate: forge.pki.Certificate | null = null;
    const caCertificates: forge.pki.Certificate[] = [];

    // 1. Get Private Keys (check both encrypted and unencrypted bags)
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const unshroudedKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });

    const combinedKeyBags = [
      ...(keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || []),
      ...(unshroudedKeyBags[forge.pki.oids.keyBag] || [])
    ];

    if (combinedKeyBags.length > 0) {
      privateKey = combinedKeyBags[0].key as forge.pki.PrivateKey;
    }

    // 2. Get Certificates
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certs = certBags[forge.pki.oids.certBag] || [];

    for (const bag of certs) {
      if (certificate === null) {
        certificate = bag.cert as forge.pki.Certificate;
      } else {
        caCertificates.push(bag.cert as forge.pki.Certificate);
      }
    }

    if (!privateKey) {
      throw new Error('Could not find private key in PFX/P12 file.');
    }
    if (!certificate) {
      throw new Error('Could not find certificate in PFX/P12 file.');
    }

    return { privateKey, certificate, caCertificates };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid password')) {
        throw new Error('The provided password for the certificate is incorrect.');
      }
      if (error.message.includes('Unable to parse PKCS#12')) {
        throw new Error('Unable to parse the certificate. The file may be corrupt or in an unsupported format.');
      }
      // Re-throw our specific errors
      if (error.message.includes('Could not find')) {
        throw error;
      }
    }
    throw new Error(`Failed to load A1 certificate: ${error}`);
  }
}
