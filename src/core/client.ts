import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import * as forge from 'node-forge';
import { CertificateData } from './certificate';
import { NfseEnvironment, environmentUrls } from '../config/environments';

/**
 * Configuration for the NfseClient.
 */
export interface NfseClientConfig {
  environment: NfseEnvironment;
  certificate: CertificateData;
  timeout?: number;
}

/**
 * A secure HTTP client for communicating with the NFSe Nacional API.
 * It handles mTLS authentication using a provided A1 certificate.
 */
export class NfseClient {
  private readonly client: AxiosInstance;
  private readonly config: NfseClientConfig;

  constructor(config: NfseClientConfig) {
    this.config = config;

    const { privateKey, certificate, caCertificates } = this.config.certificate;
    const { environment, timeout = 30000 } = this.config;

    // node-forge requires a password to create a PFX. Since this is for an in-memory
    // representation passed directly to the https.Agent, we can use a temporary, random one.
    const tempPassword = Math.random().toString(36).substring(2);

    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
      privateKey as any,
      [certificate, ...caCertificates],
      tempPassword,
      { algorithm: '3des' }
    );

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const p12Buffer = Buffer.from(p12Der, 'binary');

    const httpsAgent = new https.Agent({
      pfx: p12Buffer,
      passphrase: tempPassword,
      rejectUnauthorized: true, // Ensure the server certificate is validated
    });

    this.client = axios.create({
      baseURL: environmentUrls[environment],
      httpsAgent,
      timeout,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Sends a POST request to the specified path with the given payload.
   *
   * @param path The API endpoint path.
   * @param data The data to send (object or string).
   * @returns A promise that resolves with the response data.
   */
  async post(path: string, data: any): Promise<any> {
    try {
      const response = await this.client.post(path, data);
      return response.data;
    } catch (error) {
      // Enhance error handling to provide more context
      if (axios.isAxiosError(error)) {
        const { response } = error;
        const errorMessage = response?.data || error.message;
        throw new Error(`API request failed with status ${response?.status}: ${JSON.stringify(errorMessage)}`);
      }
      throw new Error(`An unexpected error occurred: ${error}`);
    }
  }

  /**
   * Sends a GET request to the specified path.
   *
   * @param path The API endpoint path.
   * @returns A promise that resolves with the response data.
   */
  async get(path: string): Promise<any> {
    try {
      const response = await this.client.get(path);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const { response } = error;
        const errorMessage = response?.data || error.message;
        throw new Error(`API request failed with status ${response?.status}: ${JSON.stringify(errorMessage)}`);
      }
      throw new Error(`An unexpected error occurred: ${error}`);
    }
  }

  /**
   * Sends a HEAD request to the specified path.
   *
   * @param path The API endpoint path.
   * @param params Optional query parameters.
   * @returns A promise that resolves with the response headers.
   */
  async head(path: string, params?: any): Promise<any> {
    try {
      const response = await this.client.head(path, { params });
      return response.headers;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const { response } = error;
        // For HEAD requests, we mostly care about the status code
        throw new Error(`API request failed with status ${response?.status}`);
      }
      throw new Error(`An unexpected error occurred: ${error}`);
    }
  }
}
