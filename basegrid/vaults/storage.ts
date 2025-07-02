import { BlobClient } from "./blobClient"
import { ensureContainerExists } from "./ensureContainer"

export class Storage {
  private client: BlobClient

  constructor(connectionString: string, containerName: string) {
    this.client = new BlobClient(connectionString, containerName)
  }

  async init(): Promise<void> {
    await ensureContainerExists(this.client["container"].url.split("/").pop()!, this.client["container"].containerName)
  }

  async save(key: string, content: Buffer | string): Promise<void> {
    await this.client.uploadBlob(key, content)
  }

  async load(key: string): Promise<Buffer> {
    return this.client.downloadBlob(key)
  }
}
