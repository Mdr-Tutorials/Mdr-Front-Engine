import { describe, expect, it } from 'vitest';
import {
  decodeDataUrlToBytes,
  resolveZipFilePayload,
} from '@/editor/features/export/exportZip';

const bytesToText = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

describe('exportZip', () => {
  it('decodes base64 data url to bytes', () => {
    const dataUrl = 'data:text/plain;base64,SGVsbG8=';
    const bytes = decodeDataUrlToBytes(dataUrl);
    expect(bytes).not.toBeNull();
    expect(ArrayBuffer.isView(bytes)).toBe(true);
    expect(bytesToText(bytes as Uint8Array)).toBe('Hello');
  });

  it('decodes url-encoded data url to bytes', () => {
    const dataUrl = 'data:text/plain;charset=utf-8,%E4%BD%A0%E5%A5%BD';
    const bytes = decodeDataUrlToBytes(dataUrl);
    expect(bytes).not.toBeNull();
    expect(ArrayBuffer.isView(bytes)).toBe(true);
    expect(bytesToText(bytes as Uint8Array)).toBe('你好');
  });

  it('returns null for invalid data url', () => {
    expect(decodeDataUrlToBytes('not-a-data-url')).toBeNull();
    expect(decodeDataUrlToBytes('data:text/plain;base64')).toBeNull();
  });

  it('uses binary payload when binaryDataUrl can be decoded', () => {
    const payload = resolveZipFilePayload({
      path: 'public/images/logo.png',
      content: '// placeholder',
      binaryDataUrl: 'data:text/plain;base64,SGVsbG8=',
    });
    expect(payload).toBeInstanceOf(Uint8Array);
    expect(bytesToText(payload as Uint8Array)).toBe('Hello');
  });

  it('falls back to text content when binaryDataUrl is missing or invalid', () => {
    expect(
      resolveZipFilePayload({
        path: 'src/App.tsx',
        content: 'export default function App() {}',
      })
    ).toBe('export default function App() {}');
    expect(
      resolveZipFilePayload({
        path: 'public/images/logo.png',
        content: '// placeholder',
        binaryDataUrl: 'invalid',
      })
    ).toBe('// placeholder');
  });
});
