export const truncate = (
  str: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

  const segments = Array.from(segmenter.segment(str));

  if (segments.length <= maxLength) {
    return str;
  }

  return (
    segments
      .slice(0, maxLength - suffix.length)
      .map((s) => s.segment)
      .join('') + suffix
  );
};
