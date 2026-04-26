import type { SVGProps } from 'react';

export type LayoutIconProps = SVGProps<SVGSVGElement>;

export const layoutIconDefaults = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'black',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;
