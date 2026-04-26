import { layoutIconDefaults, type LayoutIconProps } from '../iconProps';

type SpacingSide = 'top' | 'right' | 'bottom' | 'left';
type SpacingKind = 'margin' | 'padding';

type SpacingSidePreviewIconProps = LayoutIconProps & {
  side: SpacingSide;
  spacingKey: SpacingKind;
};

export function SpacingSidePreviewIcon({
  side,
  spacingKey,
  ...props
}: SpacingSidePreviewIconProps) {
  const isMargin = spacingKey === 'margin';
  const rotation = {
    top: 0,
    right: 90,
    bottom: 180,
    left: 270,
  }[side];

  return (
    <svg {...layoutIconDefaults} {...props}>
      <rect
        x={isMargin ? '7.5' : '5'}
        y={isMargin ? '7.5' : '5'}
        width={isMargin ? '9' : '14'}
        height={isMargin ? '9' : '14'}
        rx="1.8"
        strokeWidth="1"
      />
      <rect x="10" y="10" width="4" height="4" rx="0.9" strokeWidth="1" />
      <g transform={`rotate(${rotation} 12 12)`}>
        {isMargin ? (
          <path d="M12 7.2V3M12 3l-1.8 1.8M12 3l1.8 1.8" strokeWidth="1" />
        ) : (
          <path
            d="M12 4.8v4.5M12 9.3l-1.8-1.8M12 9.3l1.8-1.8"
            strokeWidth="1"
          />
        )}
      </g>
    </svg>
  );
}
