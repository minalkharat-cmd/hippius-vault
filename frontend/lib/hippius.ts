/**
 * Hippius S3 API Client
 * 
 * Provides integration with Hippius decentralized storage (Bittensor Subnet 75)
 * Uses S3-compatible API backed by IPFS
 * 
 * @see https://hippius.com
 * @see https://github.com/thenervelab/hippius-doc
 */

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import JSZip from 'jszip';

// ============ Types ============

export interface HippiusConfig {
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    region?: string;
}

export interface UploadResult {
    ipfsHash: string;
    bucket: string;
    key: string;
    size: number;
    timestamp: Date;
}

export interface VaultMetadata {
    projectName: string;
    description: string;
    version: string;
    files: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface FileInfo {
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
}

// ============ Constants ============

const HIPPIUS_ENDPOINT = 'https://s3.hippius.com';
const HIPPIUS_REGION = 'decentralized';
const METADATA_FILE = 'vault-metadata.json';

// ============ Hippius Client Class ============

export class HippiusClient {
    private client: S3Client;
    private config: HippiusConfig;

  constructor(config: HippiusConfig) {
        this.config = config;
        this.client = new S3Client({
                endpoint: config.endpoint || HIPPIUS_ENDPOINT,
                region: config.region || HIPPIUS_REGION,
                credentials: {
                          accessKeyId: config.accessKeyId,
                          secretAccessKey: config.secretAccessKey,
                },
                forcePathStyle: true, // Required for S3-compatible services
        });
  }

  // ============ Bucket Operations ============

  /**
     * Generate a unique bucket name for a vault
     */
  generateBucketName(projectName: string): string {
        const sanitized = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const timestamp = Date.now();
        return `vault-${sanitized}-${timestamp}`;
  }

  /**
     * Create a new bucket for a vault
     */
  async createBucket(bucketName: string): Promise<void> {
        const { CreateBucketCommand } = await import('@aws-sdk/client-s3');
        await this.client.send(new CreateBucketCommand({ Bucket: bucketName }));
  }

  // ============ Upload Operations ============

  /**
     * Upload a single file to a vault
     */
  async uploadFile(
        bucket: string,
        key: string,
        content: Buffer | Uint8Array | string,
        contentType?: string
      ): Promise<UploadResult> {
        const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: content,
                ContentType: contentType || 'application/octet-stream',
        });

      const response = await this.client.send(command);

      // Extract IPFS hash from ETag (Hippius returns IPFS CID)
      const etag = response.ETag?.replace(/"/g, '') || '';

      return {
              ipfsHash: etag,
              bucket,
              key,
              size: typeof content === 'string' ? content.length : content.byteLength,
              timestamp: new Date(),
      };
  }

  /**
     * Upload a project (folder) as a zip to the vault
     */
  async uploadProject(
        projectName: string,
        files: Map<string, Buffer | Uint8Array>,
        metadata: Partial<VaultMetadata>
      ): Promise<UploadResult> {
        // Create bucket
      const bucket = this.generateBucketName(projectName);
        await this.createBucket(bucket);

      // Create zip file
      const zip = new JSZip();

      for (const [path, content] of files) {
              zip.file(path, content);
      }

      const zipBuffer = await zip.generateAsync({ 
                                                      type: 'uint8array',
              compression: 'DEFLATE',
              compressionOptions: { level: 9 }
      });

      // Upload zip
      const zipResult = await this.uploadFile(
              bucket,
              'source.zip',
              zipBuffer,
              'application/zip'
            );

      // Create and upload metadata
      const fullMetadata: VaultMetadata = {
              projectName,
              description: metadata.description || '',
              version: metadata.version || '1.0.0',
              files: Array.from(files.keys()),
              createdAt: new Date(),
              updatedAt: new Date(),
      };

      await this.uploadFile(
              bucket,
              METADATA_FILE,
              JSON.stringify(fullMetadata, null, 2),
              'application/json'
            );

      return {
              ...zipResult,
              ipfsHash: zipResult.ipfsHash,
      };
  }

  /**
     * Upload files from a FileList (browser upload)
     */
  async uploadFromFileList(
        projectName: string,
        fileList: FileList,
        metadata: Partial<VaultMetadata>
      ): Promise<UploadResult> {
        const files = new Map<string, Buffer>();

      for (let i = 0; i < fileList.length; i++) {
              const file = fileList[i];
              const arrayBuffer = await file.arrayBuffer();
              const relativePath = (file as any).webkitRelativePath || file.name;
              files.set(relativePath, Buffer.from(arrayBuffer));
      }

      return this.uploadProject(projectName, files, metadata);
  }

  // ============ Download Operations ============

  /**
     * Download a file from the vault
     */
  async downloadFile(bucket: string, key: string): Promise<Uint8Array> {
        const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
        });

      const response = await this.client.send(command);

      if (!response.Body) {
              throw new Error('Empty response body');
      }

      // Convert stream to Uint8Array
      const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as any) {
                chunks.push(chunk);
        }

      return new Uint8Array(
              chunks.reduce((acc, chunk) => [...acc, ...chunk], [] as number[])
            );
  }

  /**
     * Get a signed URL for downloading a file
     */
  async getDownloadUrl(bucket: string, key: string, expiresIn = 3600): Promise<string> {
        const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
        });

      return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
     * Download and extract project zip
     */
  async downloadProject(bucket: string): Promise<Map<string, Uint8Array>> {
        const zipData = await this.downloadFile(bucket, 'source.zip');
        const zip = await JSZip.loadAsync(zipData);

      const files = new Map<string, Uint8Array>();

      for (const [path, file] of Object.entries(zip.files)) {
              if (!file.dir) {
                        const content = await file.async('uint8array');
                        files.set(path, content);
              }
      }

      return files;
  }

  // ============ Metadata Operations ============

  /**
     * Get vault metadata
     */
  async getMetadata(bucket: string): Promise<VaultMetadata> {
        const data = await this.downloadFile(bucket, METADATA_FILE);
        const text = new TextDecoder().decode(data);
        return JSON.parse(text);
  }

  /**
     * Update vault metadata
     */
  async updateMetadata(bucket: string, updates: Partial<VaultMetadata>): Promise<void> {
        const current = await this.getMetadata(bucket);
        const updated: VaultMetadata = {
                ...current,
                ...updates,
                updatedAt: new Date(),
        };

      await this.uploadFile(
              bucket,
              METADATA_FILE,
              JSON.stringify(updated, null, 2),
              'application/json'
            );
  }

  // ============ List Operations ============

  /**
     * List all files in a vault
     */
  async listFiles(bucket: string): Promise<FileInfo[]> {
        const command = new ListObjectsV2Command({
                Bucket: bucket,
        });

      const response = await this.client.send(command);

      return (response.Contents || []).map(item => ({
              key: item.Key || '',
              size: item.Size || 0,
              lastModified: item.LastModified || new Date(),
              etag: item.ETag?.replace(/"/g, '') || '',
      }));
  }

  // ============ Verification Operations ============

  /**
     * Verify a vault exists and return its IPFS hash
     */
  async verifyVault(bucket: string): Promise<{ exists: boolean; ipfsHash?: string }> {
        try {
                const files = await this.listFiles(bucket);
                const sourceZip = files.find(f => f.key === 'source.zip');

          if (sourceZip) {
                    return {
                                exists: true,
                                ipfsHash: sourceZip.etag,
                    };
          }

          return { exists: false };
        } catch (error) {
                return { exists: false };
        }
  }

  /**
     * Get the IPFS gateway URL for a file
     */
  getIpfsUrl(ipfsHash: string): string {
        return `https://ipfs.hippius.com/ipfs/${ipfsHash}`;
  }
}

// ============ Factory Function ============

/**
 * Create a Hippius client from environment variables
 */
export function createHippiusClient(): HippiusClient {
    const accessKeyId = process.env.HIPPIUS_ACCESS_KEY;
    const secretAccessKey = process.env.HIPPIUS_SECRET_KEY;

  if (!accessKeyId || !secretAccessKey) {
        throw new Error('Missing Hippius credentials. Set HIPPIUS_ACCESS_KEY and HIPPIUS_SECRET_KEY');
  }

  return new HippiusClient({
        accessKeyId,
        secretAccessKey,
  });
}

// ============ React Hook (for Next.js) ============

export function useHippiusClient(): HippiusClient | null {
    // In browser, credentials should be passed via API routes
  // This is a placeholder for server-side usage
  if (typeof window !== 'undefined') {
        console.warn('HippiusClient should be used server-side only for security');
        return null;
  }

  return createHippiusClient();
}
