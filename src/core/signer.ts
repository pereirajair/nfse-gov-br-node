import * as forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { CertificateData } from './certificate';

/**
 * Signs an XML string with the provided certificate data using xml-crypto.
 *
 * @param xml The XML string to sign.
 * @param certificateData The certificate data to use for signing.
 * @param tagToSign The name of the tag within the XML to which the signature will be appended.
 * @returns The signed XML string.
 */
export function signXml(xml: string, certificateData: CertificateData, tagToSign: string): string {
    const { privateKey, certificate } = certificateData;

    // Convert keys to PEM format expected by xml-crypto
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    const certPem = forge.pki.certificateToPem(certificate);

    // Helper to get pure base64 certificate (no headers)
    const getCertB64 = (pem: string) => {
        return pem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\r|\n/g, '');
    };

    const sig = new SignedXml({
        privateKey: privateKeyPem,
        signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
        canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
    });

    // Extract ID reference
    // We assume the tagToSign matches the pattern <tagToSign ... Id="XYZ" ...>
    const tagMatch = xml.match(new RegExp(`<${tagToSign}[^>]*Id="([^"]+)"[^>]*>`, 'i'));
    const tagId = tagMatch ? tagMatch[1] : '';
    const referenceUri = tagId ? `#${tagId}` : '';

    if (!tagId) {
        throw new Error(`Could not find Id attribute in tag '${tagToSign}' to sign.`);
    }

    // Add Reference
    sig.addReference({
        xpath: `//*[local-name(.)='${tagToSign}']`,
        transforms: [
            "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
            "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
        ],
        digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
        uri: referenceUri
    });

    // Custom KeyInfo provider
    // Implementing exactly as nfse-brazil-national does to ensure compatibility
    // They overwrite the getKeyInfoContent method on the instance.
    (sig as any).getKeyInfoContent = function ({ prefix }: { prefix: string }) {
        const certB64 = getCertB64(certPem);
        const p = prefix ? `${prefix}:` : "";
        return `<${p}X509Data><${p}X509Certificate>${certB64}</${p}X509Certificate></${p}X509Data>`;
    };

    // Compute Signature
    // xml-crypto expects the whole XML. By default it appends Signature to root.
    // For DPS, root is <DPS>. <infDPS> is child.
    // So Signature will become a sibling of <infDPS> (child of <DPS>).
    // This matches the requirement "Signature invalid child of infDPS" -> means it must NOT be inside infDPS.
    sig.computeSignature(xml, {
        prefix: "", // No prefix for Signature namespace by default
        attrs: {
            xmlns: "http://www.w3.org/2000/09/xmldsig#"
        }
    });

    let signedXml = sig.getSignedXml();

    return signedXml;
}
