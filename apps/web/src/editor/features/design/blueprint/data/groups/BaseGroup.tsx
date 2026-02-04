import {
  MdrButton,
  MdrButtonLink,
  MdrHeading,
  MdrIcon,
  MdrIconLink,
  MdrLink,
  MdrParagraph,
  MdrText,
} from '@mdr/ui';
import { Sparkles } from 'lucide-react';
import type { ComponentGroup } from '../../../BlueprintEditor.types';
import { buildVariants } from '../helpers';
import {
  BUTTON_CATEGORIES,
  BUTTON_SIZE_OPTIONS,
  HEADING_LEVELS,
  SIZE_OPTIONS,
  TEXT_SIZE_OPTIONS,
} from '../options';

export const BASE_GROUP: ComponentGroup = {
  id: 'base',
  title: '基础组件',
  items: [
    {
      id: 'text',
      name: 'Text',
      preview: <MdrText size="Medium">Text</MdrText>,
      sizeOptions: TEXT_SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <MdrText
          size={
            (size ?? 'Medium') as 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Big'
          }
        >
          Text
        </MdrText>
      ),
    },
    {
      id: 'heading',
      name: 'Heading',
      preview: <MdrHeading level={2}>Heading</MdrHeading>,
      variants: buildVariants(
        HEADING_LEVELS,
        (level) => <MdrHeading level={level}>H{level}</MdrHeading>,
        (level) => `H${level}`,
        undefined,
        undefined,
        (level) => ({ level })
      ),
    },
    {
      id: 'paragraph',
      name: 'Paragraph',
      preview: <MdrParagraph size="Medium">Paragraph</MdrParagraph>,
      sizeOptions: SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <MdrParagraph size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}>
          Paragraph
        </MdrParagraph>
      ),
    },
    {
      id: 'button',
      name: 'Button',
      preview: <MdrButton text="Button" size="Medium" category="Primary" />,
      sizeOptions: BUTTON_SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <MdrButton
          text="Button"
          size={(size ?? 'Medium') as 'Tiny' | 'Small' | 'Medium' | 'Big'}
          category="Primary"
        />
      ),
      variants: buildVariants(
        BUTTON_CATEGORIES,
        (category) => (
          <MdrButton text={category} size="Medium" category={category} />
        ),
        undefined,
        undefined,
        (category, { size }) => (
          <MdrButton
            text={category}
            size={(size ?? 'Medium') as 'Tiny' | 'Small' | 'Medium' | 'Big'}
            category={category}
          />
        ),
        (category) => ({ category })
      ),
    },
    {
      id: 'button-link',
      name: 'ButtonLink',
      preview: (
        <MdrButtonLink
          text="Link"
          to="/blueprint"
          size="Medium"
          category="Secondary"
        />
      ),
      sizeOptions: BUTTON_SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <MdrButtonLink
          text="Link"
          to="/blueprint"
          size={(size ?? 'Medium') as 'Tiny' | 'Small' | 'Medium' | 'Big'}
          category="Secondary"
        />
      ),
      variants: buildVariants(
        BUTTON_CATEGORIES,
        (category) => (
          <MdrButtonLink
            text={category}
            to="/blueprint"
            size="Medium"
            category={category}
          />
        ),
        undefined,
        undefined,
        (category, { size }) => (
          <MdrButtonLink
            text={category}
            to="/blueprint"
            size={(size ?? 'Medium') as 'Tiny' | 'Small' | 'Medium' | 'Big'}
            category={category}
          />
        ),
        (category) => ({ category })
      ),
    },
    {
      id: 'icon',
      name: 'Icon',
      preview: <MdrIcon icon={Sparkles} size={20} />,
      variants: buildVariants(
        [12, 16, 20, 24] as const,
        (size) => <MdrIcon icon={Sparkles} size={size} />,
        (size) => `${size}px`
      ),
    },
    {
      id: 'icon-link',
      name: 'IconLink',
      preview: <MdrIconLink icon={Sparkles} to="/blueprint" size={18} />,
      variants: buildVariants(
        [14, 18, 22] as const,
        (size) => <MdrIconLink icon={Sparkles} to="/blueprint" size={size} />,
        (size) => `${size}px`
      ),
    },
    {
      id: 'link',
      name: 'Link',
      preview: <MdrLink to="/blueprint" text="Link" />,
    },
  ],
};
