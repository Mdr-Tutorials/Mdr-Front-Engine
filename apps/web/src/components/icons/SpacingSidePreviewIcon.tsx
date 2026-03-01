// 编辑器中预览 margin/padding 四个方向的图标组件
type SpacingSide = 'top' | 'right' | 'bottom' | 'left';
type SpacingKind = 'margin' | 'padding';

interface Props {
  side: SpacingSide;
  spacingKey: SpacingKind;
}

export function SpacingSidePreviewIcon({ side, spacingKey }: Props) {
  const isMargin = spacingKey === 'margin';

  // 基础配置：中心点 20, 20
  const BOX_SIZE = isMargin ? 14 : 24;
  const BOX_X = (40 - BOX_SIZE) / 2;
  const opacity = isMargin ? 0.34 : 0.42;

  // 根据方向计算旋转角度
  const rotation = {
    top: 0,
    right: 90,
    bottom: 180,
    left: 270,
  }[side];

  return (
    <svg
      className="h-14 w-16 shrink-0 text-(--color-6)"
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      {/* 边框（Margin时较小，Padding时较大） */}
      <rect
        x={BOX_X}
        y={BOX_X}
        width={BOX_SIZE}
        height={BOX_SIZE}
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity={opacity}
      />

      <rect x={16} y={16} width={8} height={8} rx="1.5" fill="var(--color-9)" />

      {/* 箭头组：默认定义一个“向上”的箭头，通过旋转实现四个方向 */}
      <g transform={`rotate(${rotation}, 20, 20)`}>
        {isMargin ? (
          // Margin 箭头：从盒子边缘向外指
          <g>
            <line
              x1="20"
              y1="12"
              x2="20"
              y2="4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <polygon points="20,3 17.5,6 22.5,6" fill="currentColor" />
          </g>
        ) : (
          // Padding 箭头：从盒子边缘向内指
          <g>
            <line
              x1="20"
              y1="9"
              x2="20"
              y2="15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <polygon points="20,16 17.5,13 22.5,13" fill="currentColor" />
          </g>
        )}
      </g>
    </svg>
  );
}
