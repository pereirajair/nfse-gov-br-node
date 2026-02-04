import { signXml } from '../../src/core/signer';
import { CertificateData } from '../../src/core/certificate';
import * as forge from 'node-forge';

jest.mock('node-forge', () => {
  const original = jest.requireActual('node-forge');
  return {
    ...original,
    pki: {
      ...original.pki,
      certificateToPem: () => '-----BEGIN CERTIFICATE-----\nMOCK_PEM\n-----END CERTIFICATE-----',
      privateKeyToPem: () => '-----BEGIN RSA PRIVATE KEY-----\nMOCK_KEY_PEM\n-----END RSA PRIVATE KEY-----'
    }
  };
});

jest.mock('xml-crypto', () => {
  return {
    SignedXml: jest.fn().mockImplementation(() => {
      return {
        addReference: jest.fn(),
        computeSignature: jest.fn(),
        getSignedXml: jest.fn().mockReturnValue('<DPS Id="DPS123"><Signature>MOCK_SIGNATURE</Signature></DPS>'),
        getKeyInfoContent: null // This will be overwritten by our code
      };
    })
  };
});

// A simplified mock for certificate data to avoid complex Pem parsing in tests
const mockCertificateData: CertificateData = {
  privateKey: {
    sign: () => 'mockSignature', // Mock the sign method
  } as any,
  certificate: {
    // Mock whatever properties of the certificate are needed
  } as any,
  caCertificates: [],
};


describe('XML Signer', () => {
  it('should add a Signature block to the XML document', () => {
    const xml = '<DPS Id="DPS123"><info>TestData</info></DPS>';

    const signedXml = signXml(xml, mockCertificateData, 'DPS');

    expect(signedXml).toContain('<Signature>MOCK_SIGNATURE</Signature>');
  });
});
