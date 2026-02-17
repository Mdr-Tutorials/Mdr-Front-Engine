export type ZipExportFile = {
  path: string;
  content: string;
  binaryDataUrl?: string;
};

export const decodeDataUrlToBytes = (dataUrl: string): Uint8Array | null => {
  if (!dataUrl.startsWith('data:')) return null;
  const separatorIndex = dataUrl.indexOf(',');
  if (separatorIndex < 0) return null;
  const metadata = dataUrl.slice(5, separatorIndex);
  const payload = dataUrl.slice(separatorIndex + 1);
  if (/;base64/i.test(metadata)) {
    const binary = window.atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  const decoded = decodeURIComponent(payload);
  return new TextEncoder().encode(decoded);
};

export const resolveZipFilePayload = (
  file: ZipExportFile
): string | Uint8Array => {
  const bytes = file.binaryDataUrl
    ? decodeDataUrlToBytes(file.binaryDataUrl)
    : null;
  return bytes ?? file.content;
};
