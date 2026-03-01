import {
  MdrButton,
  MdrDrawer,
  MdrEmpty,
  MdrMessage,
  MdrModal,
  MdrNotification,
  MdrPopover,
  MdrSkeleton,
  MdrText,
  MdrTooltip,
} from '@mdr/ui';
import type { ComponentGroup } from '@/editor/features/design/BlueprintEditor.types';
import { buildVariants } from '@/editor/features/design/blueprint/data/helpers';
import {
  DRAWER_PLACEMENTS,
  MESSAGE_TYPES,
  NOTIFICATION_TYPES,
  SKELETON_VARIANTS,
  SIZE_OPTIONS,
  TOOLTIP_PLACEMENTS,
} from '@/editor/features/design/blueprint/data/options';

export const FEEDBACK_GROUP: ComponentGroup = {
  id: 'feedback',
  title: '反馈组件',
  items: [
    {
      id: 'modal',
      name: 'Modal',
      preview: (
        <MdrModal
          open
          size="Medium"
          title="Modal"
          footer={<MdrButton text="OK" size="Tiny" category="Primary" />}
        >
          <MdrText size="Tiny">Details</MdrText>
        </MdrModal>
      ),
      sizeOptions: SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <MdrModal
          open
          size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
          title="Modal"
          footer={<MdrButton text="OK" size="Tiny" category="Primary" />}
        >
          <MdrText size="Tiny">Details</MdrText>
        </MdrModal>
      ),
      scale: 0.45,
    },
    {
      id: 'drawer',
      name: 'Drawer',
      preview: (
        <MdrDrawer open placement="Right" size={160} title="Drawer">
          <MdrText size="Tiny">Content</MdrText>
        </MdrDrawer>
      ),
      variants: buildVariants(DRAWER_PLACEMENTS, (placement) => (
        <MdrDrawer open placement={placement} size={140} title="Drawer">
          <MdrText size="Tiny">Content</MdrText>
        </MdrDrawer>
      )),
      scale: 0.45,
    },
    {
      id: 'tooltip',
      name: 'Tooltip',
      preview: (
        <MdrTooltip content="Tooltip" placement="Top">
          <MdrButton text="Hover" size="Tiny" category="Secondary" />
        </MdrTooltip>
      ),
      variants: buildVariants(TOOLTIP_PLACEMENTS, (placement) => (
        <MdrTooltip content={placement} placement={placement}>
          <MdrButton text="Hover" size="Tiny" category="Secondary" />
        </MdrTooltip>
      )),
      scale: 0.8,
    },
    {
      id: 'popover',
      name: 'Popover',
      preview: (
        <MdrPopover title="Popover" content="Details" defaultOpen>
          <MdrButton text="More" size="Tiny" category="Secondary" />
        </MdrPopover>
      ),
      scale: 0.8,
    },
    {
      id: 'message',
      name: 'Message',
      preview: <MdrMessage text="Saved" type="Success" />,
      statusOptions: MESSAGE_TYPES.map((status) => ({
        id: status,
        label: status,
        value: status,
      })),
      defaultStatus: 'Success',
      renderPreview: ({ status }) => (
        <MdrMessage
          text="Saved"
          type={
            (status ?? 'Success') as 'Info' | 'Success' | 'Warning' | 'Danger'
          }
        />
      ),
      variants: buildVariants(MESSAGE_TYPES, (type) => (
        <MdrMessage text={type} type={type} />
      )),
      scale: 0.8,
    },
    {
      id: 'notification',
      name: 'Notification',
      preview: (
        <MdrNotification
          title="Update"
          description="Latest changes"
          type="Info"
        />
      ),
      statusOptions: NOTIFICATION_TYPES.map((status) => ({
        id: status,
        label: status,
        value: status,
      })),
      defaultStatus: 'Info',
      renderPreview: ({ status }) => (
        <MdrNotification
          title="Update"
          description="Latest changes"
          type={(status ?? 'Info') as 'Info' | 'Success' | 'Warning' | 'Danger'}
        />
      ),
      variants: buildVariants(NOTIFICATION_TYPES, (type) => (
        <MdrNotification
          title={type}
          description="Latest changes"
          type={type}
        />
      )),
      scale: 0.6,
    },
    {
      id: 'empty',
      name: 'Empty',
      preview: <MdrEmpty title="No data" description="Nothing here" />,
      scale: 0.7,
    },
    {
      id: 'skeleton',
      name: 'Skeleton',
      preview: <MdrSkeleton variant="Text" lines={2} />,
      variants: buildVariants(SKELETON_VARIANTS, (variant) => (
        <MdrSkeleton variant={variant} lines={variant === 'Text' ? 2 : 1} />
      )),
      scale: 0.8,
    },
  ],
};
