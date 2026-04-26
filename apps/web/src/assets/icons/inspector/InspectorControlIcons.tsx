import { layoutIconDefaults, type LayoutIconProps } from '../layout/iconProps';

function InspectorIcon({ children, ...props }: LayoutIconProps) {
  return (
    <svg {...layoutIconDefaults} {...props}>
      {children}
    </svg>
  );
}

export const DisplayFieldIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <rect x="5" y="5" width="14" height="5" rx="1" strokeWidth="1" />
    <rect x="5" y="14" width="6" height="5" rx="1" strokeWidth="1" />
    <rect x="14" y="14" width="5" height="5" rx="1" strokeWidth="1" />
  </InspectorIcon>
);

export const DisplayBlockIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <rect x="5" y="8" width="14" height="8" rx="1" strokeWidth="1" />
    <line x1="7" y1="18" x2="17" y2="18" strokeWidth="1" />
  </InspectorIcon>
);

export const DisplayFlexIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <line x1="5" y1="12" x2="19" y2="12" strokeWidth="1" />
    <rect x="6" y="8" width="3" height="8" rx="1.5" strokeWidth="1" />
    <rect x="12" y="7" width="3" height="10" rx="1.5" strokeWidth="1" />
  </InspectorIcon>
);

export const DisplayGridIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <rect x="5" y="5" width="14" height="14" rx="1" strokeWidth="1" />
    <line x1="12" y1="5" x2="12" y2="19" strokeWidth="1" />
    <line x1="5" y1="12" x2="19" y2="12" strokeWidth="1" />
  </InspectorIcon>
);

export const DisplayInlineIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <line x1="5" y1="16" x2="19" y2="16" strokeWidth="1" />
    <rect x="5" y="9" width="3" height="4" rx="0.8" strokeWidth="1" />
    <rect x="10.5" y="9" width="3" height="4" rx="0.8" strokeWidth="1" />
    <rect x="16" y="9" width="3" height="4" rx="0.8" strokeWidth="1" />
  </InspectorIcon>
);

export const DisplayInlineBlockIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <line x1="5" y1="17" x2="19" y2="17" strokeWidth="1" />
    <rect x="7" y="7" width="10" height="7" rx="1" strokeWidth="1" />
  </InspectorIcon>
);

export const TextAlignFieldIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <line x1="6" y1="7" x2="18" y2="7" strokeWidth="1" />
    <line x1="8" y1="12" x2="16" y2="12" strokeWidth="1" />
    <line x1="6" y1="17" x2="18" y2="17" strokeWidth="1" />
  </InspectorIcon>
);

export const TextAlignLeftIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <line x1="5" y1="7" x2="18" y2="7" strokeWidth="1" />
    <line x1="5" y1="12" x2="14" y2="12" strokeWidth="1" />
    <line x1="5" y1="17" x2="17" y2="17" strokeWidth="1" />
  </InspectorIcon>
);

export const TextAlignCenterIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <line x1="6" y1="7" x2="18" y2="7" strokeWidth="1" />
    <line x1="8" y1="12" x2="16" y2="12" strokeWidth="1" />
    <line x1="5" y1="17" x2="19" y2="17" strokeWidth="1" />
  </InspectorIcon>
);

export const TextAlignRightIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <line x1="6" y1="7" x2="19" y2="7" strokeWidth="1" />
    <line x1="10" y1="12" x2="19" y2="12" strokeWidth="1" />
    <line x1="7" y1="17" x2="19" y2="17" strokeWidth="1" />
  </InspectorIcon>
);

export const TextAlignJustifyIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <line x1="5" y1="7" x2="19" y2="7" strokeWidth="1" />
    <line x1="5" y1="12" x2="19" y2="12" strokeWidth="1" />
    <line x1="5" y1="17" x2="19" y2="17" strokeWidth="1" />
  </InspectorIcon>
);

export const LinkTargetFieldIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <path d="M9.5 8.5h-1a3.5 3.5 0 0 0 0 7h3" strokeWidth="1" />
    <path d="M12.5 8.5h3a3.5 3.5 0 0 1 0 7h-1" strokeWidth="1" />
    <line x1="9" y1="12" x2="15" y2="12" strokeWidth="1" />
  </InspectorIcon>
);

export const LinkTargetSelfIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <rect x="5" y="6" width="14" height="12" rx="1.4" strokeWidth="1" />
    <path d="M14 10h-4v4M10 10l5 5" strokeWidth="1" />
  </InspectorIcon>
);

export const LinkTargetBlankIcon = (props: LayoutIconProps) => (
  <InspectorIcon {...props}>
    <rect x="5" y="8" width="11" height="11" rx="1.4" strokeWidth="1" />
    <path d="M12 5h7v7M18.5 5.5 11 13" strokeWidth="1" />
  </InspectorIcon>
);
