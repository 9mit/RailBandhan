/** Bound upstream JSON to avoid unbounded provider payloads and redirect chains. */
export async function boundedJson(
  response: Response,
  maximum = 2 * 1024 * 1024,
): Promise<any> {
  if (Number(response.headers.get("content-length")) > maximum)
    throw new Error("Upstream response too large");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty upstream response");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > maximum) {
        await reader.cancel();
        throw new Error("Upstream response too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
