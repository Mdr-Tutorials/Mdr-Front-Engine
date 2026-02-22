import type {
  AnimationTimeline,
  AnimationTrack,
  SvgFilterDefinition,
} from '@/core/types/engine.types';
import { resolveKeyframedValue } from './animationKeyframes';

type NodeStyleDraft = {
  opacity?: number | string;
  color?: string;
  transform?: string;
  filter?: string;
};

type PreviewSnapshot = {
  cssText: string;
  svgFilters: SvgFilterDefinition[];
};

const escapeAttrValue = (value: string) =>
  value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const resolveCssFilterUnit = (
  fn: Extract<AnimationTrack, { kind: 'css-filter' }>['fn'],
  unit?: Extract<AnimationTrack, { kind: 'css-filter' }>['unit']
) => {
  if (unit) return unit;
  if (fn === 'hue-rotate') return 'deg';
  if (fn === 'blur') return 'px';
  return '%';
};

const coerceNumber = (value: number | string) => {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const ensureFilterPart = (parts: string[], nextPart: string) => {
  if (!nextPart) return;
  if (parts.includes(nextPart)) return;
  parts.push(nextPart);
};

export const buildAnimationPreviewSnapshot = ({
  timeline,
  cursorMs,
  svgFilters,
}: {
  timeline: AnimationTimeline | undefined;
  cursorMs: number;
  svgFilters: SvgFilterDefinition[];
}): PreviewSnapshot => {
  if (!timeline) {
    return { cssText: '', svgFilters };
  }

  const stylesByNodeId = new Map<string, NodeStyleDraft>();
  const filterEditsByFilterId = new Map<
    string,
    Map<string, Record<string, number | string>>
  >();

  timeline.bindings.forEach((binding) => {
    const translateXTracks: number[] = [];
    const translateYTracks: number[] = [];
    const scaleTracks: number[] = [];
    const filterParts: string[] = [];

    let opacity: number | undefined;
    let color: string | undefined;

    binding.tracks.forEach((track) => {
      const value = resolveKeyframedValue(track.keyframes, cursorMs);

      if (track.kind === 'style') {
        if (track.property === 'opacity') {
          opacity = coerceNumber(value);
          return;
        }
        if (track.property === 'transform.translateX') {
          translateXTracks.push(coerceNumber(value));
          return;
        }
        if (track.property === 'transform.translateY') {
          translateYTracks.push(coerceNumber(value));
          return;
        }
        if (track.property === 'transform.scale') {
          scaleTracks.push(coerceNumber(value));
          return;
        }
        if (track.property === 'color' && typeof value === 'string') {
          color = value;
        }
        return;
      }

      if (track.kind === 'css-filter') {
        const resolvedUnit = resolveCssFilterUnit(track.fn, track.unit);
        const numeric = coerceNumber(value);
        ensureFilterPart(filterParts, `${track.fn}(${numeric}${resolvedUnit})`);
        return;
      }

      if (track.kind === 'svg-filter-attr') {
        ensureFilterPart(filterParts, `url(#${track.filterId})`);
        const nextValue =
          typeof value === 'string' || typeof value === 'number' ? value : 0;
        const primitiveMap =
          filterEditsByFilterId.get(track.filterId) ?? new Map();
        const attrs = primitiveMap.get(track.primitiveId) ?? {};
        primitiveMap.set(track.primitiveId, {
          ...attrs,
          [track.attr]: nextValue,
        });
        filterEditsByFilterId.set(track.filterId, primitiveMap);
      }
    });

    const transforms: string[] = [];
    if (translateXTracks.length) {
      transforms.push(`translateX(${translateXTracks.at(-1)}px)`);
    }
    if (translateYTracks.length) {
      transforms.push(`translateY(${translateYTracks.at(-1)}px)`);
    }
    if (scaleTracks.length) {
      transforms.push(`scale(${scaleTracks.at(-1)})`);
    }

    const draft: NodeStyleDraft = {};
    if (typeof opacity === 'number' && Number.isFinite(opacity)) {
      draft.opacity = opacity;
    }
    if (color) {
      draft.color = color;
    }
    if (transforms.length) {
      draft.transform = transforms.join(' ');
    }
    if (filterParts.length) {
      draft.filter = filterParts.join(' ');
    }

    if (Object.keys(draft).length) {
      stylesByNodeId.set(binding.targetNodeId, draft);
    }
  });

  const rules: string[] = [];
  stylesByNodeId.forEach((style, nodeId) => {
    const declarations: string[] = [];

    if (style.opacity !== undefined) {
      declarations.push(`opacity:${style.opacity};`);
    }
    if (style.color) {
      declarations.push(`color:${style.color};`);
    }
    if (style.transform) {
      declarations.push(`transform:${style.transform};`);
      declarations.push('transform-origin:center;');
    }
    if (style.filter) {
      declarations.push(`filter:${style.filter};`);
    }
    if (!declarations.length) return;

    rules.push(
      `[data-mir-node-id="${escapeAttrValue(nodeId)}"] > * {${declarations.join(
        ''
      )}}`
    );
  });

  const animatedSvgFilters = svgFilters.map((filter) => {
    const primitiveEdits = filterEditsByFilterId.get(filter.id);
    if (!primitiveEdits) return filter;

    return {
      ...filter,
      primitives: filter.primitives.map((primitive) => {
        const edits = primitiveEdits.get(primitive.id);
        if (!edits) return primitive;
        return {
          ...primitive,
          attrs: {
            ...(primitive.attrs ?? {}),
            ...edits,
          },
        };
      }),
    };
  });

  return {
    cssText: rules.join('\n'),
    svgFilters: animatedSvgFilters,
  };
};
