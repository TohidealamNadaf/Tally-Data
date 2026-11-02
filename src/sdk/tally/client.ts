import axios, { AxiosInstance, AxiosError } from 'axios';
import fs from 'fs';
import path from 'path';
import { TallyConnectionError, TallyApiError } from './errors';

export interface TallyClientConfig {
  host: string;
  port: number;
  timeout?: number;
}

export class TallyGatewayClient {
  private client: AxiosInstance;

  constructor(config: TallyClientConfig) {
    const baseURL = `http://${config.host}:${config.port}`;
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }

  /**
   * Send raw XML to Tally Gateway
   */
  public async send(xml: string, endpointName: string = 'Unknown', timeoutMs?: number): Promise<string> {
    console.log('\n========================================================');
    console.log(`POST ${this.client.defaults.baseURL}`);
    console.log(`REQUEST XML (${endpointName})`);
    console.log(xml);
    console.log('========================================================\n');

    try {
      const response = await this.client.post('', xml, {
        timeout: timeoutMs || this.client.defaults.timeout,
      });
      const rawXml = response.data;

      // Log HTTP Status and Response details
      console.log('========================================================');
      console.log(`HTTP Status: ${response.status}`);
      console.log(`Response Length: ${rawXml.length} characters`);
      
      const first1000 = rawXml.substring(0, 1000);
      console.log(`\nFIRST 1000 CHARS OF RAW XML:\n${first1000}${rawXml.length > 1000 ? '...\n' : ''}`);
      console.log('========================================================\n');

      // Save to logs/response.xml
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.writeFileSync(path.join(logDir, 'response.xml'), rawXml);

      return rawXml;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Export data from Tally
   */
  public async export(requestXml: string, endpointName: string = 'Export'): Promise<string> {
    return this.send(requestXml, endpointName);
  }

  /**
   * Import data into Tally
   */
  public async import(requestXml: string, endpointName: string = 'Import'): Promise<string> {
    return this.send(requestXml, endpointName);
  }

  /**
   * Check if Tally is reachable
   */
  public async health(): Promise<boolean> {
    try {
      await this.client.get('');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ping Tally
   */
  public async ping(): Promise<string> {
    const isHealthy = await this.health();
    return isHealthy ? 'pong' : 'timeout';
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ECONNABORTED') {
        throw new TallyConnectionError(`Unable to connect to Tally Gateway at ${axiosError.config?.baseURL}`, axiosError);
      }
      throw new TallyApiError(`Tally API Error: ${axiosError.message}`, axiosError.code);
    }
    throw new Error(`Unexpected error communicating with Tally: ${error}`);
  }
}
