import { BlobServiceClient } from "@azure/storage-blob"

export async function ensureContainerExists(
  connectionString: string,
  containerName: string
): Promise<void> {
  const service = BlobServiceClient.fromConnectionString(connectionString)
  const container = service.getContainerClient(containerName)
  const exists = await container.exists()
  if (!exists) {
    await container.create()
  }
}
