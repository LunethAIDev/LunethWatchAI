import { BlobServiceClient, ContainerClient } from "@azure/storage-blob"

export class BlobClient {
  private container: ContainerClient

  constructor(connectionString: string, containerName: string) {
    const service = BlobServiceClient.fromConnectionString(connectionString)
    this.container = service.getContainerClient(containerName)
  }

  async uploadBlob(name: string, data: Buffer | string): Promise<void> {
    const block = this.container.getBlockBlobClient(name)
    await block.upload(data, Buffer.byteLength(data as string))
  }

  async downloadBlob(name: string): Promise<Buffer> {
    const blob = this.container.getBlobClient(name)
    const resp = await blob.download()
    return Buffer.from(await this.streamToBuffer(resp.readableStreamBody!))
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer)
    }
    return Buffer.concat(chunks)
  }
}
