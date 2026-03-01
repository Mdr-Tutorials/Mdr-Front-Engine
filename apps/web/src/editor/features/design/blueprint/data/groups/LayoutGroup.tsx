import { MdrCard, MdrDiv, MdrPanel, MdrSection, MdrText } from '@mdr/ui';
import type { ComponentGroup } from '@/editor/features/design/BlueprintEditor.types';
import { buildVariants } from '@/editor/features/design/blueprint/data/helpers';
import {
  CARD_VARIANTS,
  PANEL_VARIANTS,
  SIZE_OPTIONS,
} from '@/editor/features/design/blueprint/data/options';

export const LAYOUT_GROUP: ComponentGroup = {
  id: 'layout',
  title: '布局组件',
  items: [
    {
      id: 'div',
      name: 'Div',
      preview: (
        <MdrDiv
          padding="6px"
          backgroundColor="var(--color-1)"
          borderRadius="6px"
        >
          <MdrText size="Tiny">Div</MdrText>
        </MdrDiv>
      ),
    },
    {
      id: 'flex',
      name: 'Flex',
      preview: (
        <MdrDiv
          display="Flex"
          gap="6px"
          padding="6px"
          backgroundColor="var(--color-1)"
          borderRadius="6px"
        >
          <MdrDiv
            width="18px"
            height="18px"
            backgroundColor="var(--color-3)"
            borderRadius="4px"
          >
            {null}
          </MdrDiv>
          <MdrDiv
            width="18px"
            height="18px"
            backgroundColor="var(--color-4)"
            borderRadius="4px"
          >
            {null}
          </MdrDiv>
          <MdrDiv
            width="18px"
            height="18px"
            backgroundColor="var(--color-5)"
            borderRadius="4px"
          >
            {null}
          </MdrDiv>
        </MdrDiv>
      ),
    },
    {
      id: 'grid',
      name: 'Grid',
      preview: (
        <MdrDiv
          display="Grid"
          gap="6px"
          padding="6px"
          backgroundColor="var(--color-1)"
          borderRadius="6px"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
        >
          <MdrDiv
            height="16px"
            backgroundColor="var(--color-3)"
            borderRadius="4px"
          >
            {null}
          </MdrDiv>
          <MdrDiv
            height="16px"
            backgroundColor="var(--color-4)"
            borderRadius="4px"
          >
            {null}
          </MdrDiv>
          <MdrDiv
            height="16px"
            backgroundColor="var(--color-5)"
            borderRadius="4px"
          >
            {null}
          </MdrDiv>
          <MdrDiv
            height="16px"
            backgroundColor="var(--color-6)"
            borderRadius="4px"
          >
            {null}
          </MdrDiv>
        </MdrDiv>
      ),
    },
    {
      id: 'section',
      name: 'Section',
      preview: (
        <MdrSection size="Medium" padding="Small" backgroundColor="Light">
          <MdrText size="Tiny">Section</MdrText>
        </MdrSection>
      ),
      sizeOptions: SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <MdrSection
          size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
          padding="Small"
          backgroundColor="Light"
        >
          <MdrText size="Tiny">Section</MdrText>
        </MdrSection>
      ),
      scale: 0.65,
    },
    {
      id: 'card',
      name: 'Card',
      preview: (
        <MdrCard size="Medium" variant="Bordered" padding="Small">
          <MdrText size="Tiny">Card</MdrText>
        </MdrCard>
      ),
      sizeOptions: SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <MdrCard
          size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
          variant="Bordered"
          padding="Small"
        >
          <MdrText size="Tiny">Card</MdrText>
        </MdrCard>
      ),
      variants: buildVariants(CARD_VARIANTS, (variant) => (
        <MdrCard size="Medium" variant={variant} padding="Small">
          <MdrText size="Tiny">{variant}</MdrText>
        </MdrCard>
      )),
    },
    {
      id: 'panel',
      name: 'Panel',
      preview: (
        <MdrPanel size="Medium" title="Panel">
          <MdrText size="Tiny">Content</MdrText>
        </MdrPanel>
      ),
      sizeOptions: SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <MdrPanel
          size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
          title="Panel"
        >
          <MdrText size="Tiny">Content</MdrText>
        </MdrPanel>
      ),
      variants: buildVariants(PANEL_VARIANTS, (variant) => (
        <MdrPanel size="Medium" variant={variant} title="Panel">
          <MdrText size="Tiny">{variant}</MdrText>
        </MdrPanel>
      )),
      scale: 0.64,
    },
  ],
};
