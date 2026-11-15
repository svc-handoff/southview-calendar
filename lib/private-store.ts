import { get, put, BlobPreconditionFailedError } from '@vercel/blob';

export function privateStorageConfigured() {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readPrivateDocument<T>(path: string, empty: T): Promise<{ data: T; etag?: string }> {
  if (!privateStorageConfigured()) throw new Error('Private storage is not configured.');
  // Compression changes a strong storage ETag into a weak HTTP ETag (W/...),
  // which cannot be used for the conditional write below. Read the original
  // representation so large directories remain safe to append to.
  const result = await get(path, { access: 'private', useCache: false, headers: { 'Accept-Encoding': 'identity' } });
  if (!result) return { data: structuredClone(empty) };
  if (result.statusCode !== 200) throw new Error('Private storage could not be read.');
  return { data: await new Response(result.stream).json() as T, etag: result.blob.etag };
}

// Conditional writes prevent simultaneous staff uploads from replacing each other.
export async function updatePrivateDocument<T, R>(path: string, empty: T, update: (data: T) => { data: T; result: R }): Promise<R> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await readPrivateDocument(path, empty);
    const next = update(current.data);
    try {
      await put(path, JSON.stringify(next.data), {
        access: 'private', addRandomSuffix: false, contentType: 'application/json',
        allowOverwrite: Boolean(current.etag), ...(current.etag ? { ifMatch: current.etag } : {}),
      });
      return next.result;
    } catch (error) {
      const raced = error instanceof BlobPreconditionFailedError || (error instanceof Error && /already exists/i.test(error.message));
      if (!raced || attempt === 4) throw error;
    }
  }
  throw new Error('Another upload is finishing. Please try again.');
}
