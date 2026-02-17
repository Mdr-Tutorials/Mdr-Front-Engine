type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const mergeResourceSection = <T extends JsonRecord>(
  base: T,
  patch: JsonRecord
): T => {
  const output: JsonRecord = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    const current = output[key];
    if (isRecord(current) && isRecord(value)) {
      output[key] = mergeResourceSection(current, value);
      return;
    }
    output[key] = value;
  });
  return output as T;
};
