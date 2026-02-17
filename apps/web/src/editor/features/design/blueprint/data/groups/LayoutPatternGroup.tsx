import { MdrDiv } from '@mdr/ui';
import type { ComponentGroup } from '../../../BlueprintEditor.types';

const PATTERN_PREVIEW_STYLE = {
  borderRadius: '8px',
  backgroundColor: 'var(--color-1)',
};

export const LAYOUT_PATTERN_GROUP: ComponentGroup = {
  id: 'layout-pattern',
  title: '布局范式',
  items: [
    {
      id: 'layout-pattern-split',
      name: 'Split Layout',
      preview: (
        <MdrDiv
          display="Grid"
          gap="6px"
          padding="6px"
          style={{ gridTemplateColumns: '1fr 1fr' }}
        >
          <MdrDiv height="24px" style={PATTERN_PREVIEW_STYLE}>
            {null}
          </MdrDiv>
          <MdrDiv height="24px" style={PATTERN_PREVIEW_STYLE}>
            {null}
          </MdrDiv>
        </MdrDiv>
      ),
      defaultProps: {
        patternId: 'split',
      },
    },
    {
      id: 'layout-pattern-holy-grail',
      name: 'Holy Grail',
      preview: (
        <MdrDiv display="Flex" flexDirection="Column" gap="6px" padding="6px">
          <MdrDiv height="12px" style={PATTERN_PREVIEW_STYLE}>
            {null}
          </MdrDiv>
          <MdrDiv display="Flex" gap="6px">
            <MdrDiv width="20px" height="28px" style={PATTERN_PREVIEW_STYLE}>
              {null}
            </MdrDiv>
            <MdrDiv width="44px" height="28px" style={PATTERN_PREVIEW_STYLE}>
              {null}
            </MdrDiv>
          </MdrDiv>
          <MdrDiv height="10px" style={PATTERN_PREVIEW_STYLE}>
            {null}
          </MdrDiv>
        </MdrDiv>
      ),
      defaultProps: {
        patternId: 'holy-grail',
      },
    },
    {
      id: 'layout-pattern-dashboard-shell',
      name: 'Dashboard Shell',
      preview: (
        <MdrDiv display="Flex" flexDirection="Column" gap="6px" padding="6px">
          <MdrDiv height="12px" style={PATTERN_PREVIEW_STYLE}>
            {null}
          </MdrDiv>
          <MdrDiv
            display="Grid"
            gap="6px"
            style={{ gridTemplateColumns: '1fr 1fr 1fr' }}
          >
            <MdrDiv height="16px" style={PATTERN_PREVIEW_STYLE}>
              {null}
            </MdrDiv>
            <MdrDiv height="16px" style={PATTERN_PREVIEW_STYLE}>
              {null}
            </MdrDiv>
            <MdrDiv height="16px" style={PATTERN_PREVIEW_STYLE}>
              {null}
            </MdrDiv>
          </MdrDiv>
          <MdrDiv height="10px" style={PATTERN_PREVIEW_STYLE}>
            {null}
          </MdrDiv>
        </MdrDiv>
      ),
      defaultProps: {
        patternId: 'dashboard-shell',
      },
    },
  ],
};
