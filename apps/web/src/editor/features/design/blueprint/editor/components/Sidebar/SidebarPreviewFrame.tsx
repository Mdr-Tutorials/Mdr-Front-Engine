import type { ReactNode } from 'react';
import { DEFAULT_PREVIEW_SCALE } from '@/editor/features/design/BlueprintEditor.data';

type SidebarPreviewFrameProps = {
  scale?: number;
  className?: string;
  wide?: boolean;
  children: ReactNode;
};

export const SidebarPreviewFrame = ({
  scale = DEFAULT_PREVIEW_SCALE,
  className = '',
  wide = false,
  children,
}: SidebarPreviewFrameProps) => (
  <div
    className={`ComponentPreviewSurface relative flex h-[60px] min-w-20 items-center justify-center overflow-hidden rounded-md border border-(--border-subtle) bg-(--bg-raised) [&_.MdrDrawer]:max-h-full [&_.MdrDrawer]:max-w-full [&_.MdrDrawerOverlay]:absolute [&_.MdrDrawerOverlay]:inset-1 [&_.MdrDrawerOverlay]:z-0 [&_.MdrDrawerOverlay]:rounded-md [&_.MdrModal]:w-[140px] [&_.MdrModal]:max-w-full [&_.MdrModalOverlay]:absolute [&_.MdrModalOverlay]:inset-1 [&_.MdrModalOverlay]:z-0 [&_.MdrModalOverlay]:rounded-md [&_.MuiDialog-root]:absolute [&_.MuiDialog-root]:inset-0 [&_.MuiPaper-root]:m-0 [&_.MuiPaper-root]:max-h-full [&_.MuiPaper-root]:max-w-[150px] [&_.ant-modal]:my-1 [&_.ant-modal]:max-w-[150px] [&_.ant-modal-root]:relative [&_.ant-modal-root]:inset-auto [&_.ant-modal-root]:z-[1] [&_.ant-modal-wrap]:relative [&_.ant-modal-wrap]:inset-auto [&_.ant-modal-wrap]:overflow-hidden ${wide ? 'Wide w-full' : ''} ${className}`.trim()}
  >
    <div
      className="ComponentPreviewInner pointer-events-none inline-flex origin-center items-center justify-center"
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </div>
  </div>
);
